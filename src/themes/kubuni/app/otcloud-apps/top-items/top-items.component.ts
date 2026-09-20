import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  EMPTY,
  from,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  expand,
  map,
  mergeMap,
  reduce,
  switchMap,
  toArray,
} from 'rxjs/operators';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import {
  isoToNgbDate,
  ngbDateToIso,
} from '../ngb-date.util';

/**
 * Which usage figure items are ranked by. Both come from stock usage reports, so the whole report
 * differs only in the report type requested and the wording.
 */
export type UsageMetric = 'views' | 'downloads';

export interface RankedItem {
  id: string;
  label: string;
  value: number;
}

interface SearchObjectsJson {
  _embedded?: {
    searchResult?: {
      page?: { totalElements?: number; totalPages?: number; number?: number };
      _embedded?: {
        objects?: {
          _embedded?: {
            indexableObject?: {
              uuid?: string;
              id?: string;
              name?: string;
              metadata?: Record<string, { value: string }[]>;
            };
          };
        }[];
      };
    };
  };
}

interface UsageReportJson {
  points?: { values: Record<string, number> }[];
}

/**
 * Most viewed - or most downloaded - items over a reporting period, ranked.
 *
 * Stock DSpace reports usage per DSpaceObject and offers no repository-wide item ranking (the Site's
 * `TotalVisits` is a single whole-repository total, and `TotalDownloads` does not exist at Site
 * scope at all), so the ranking is built here: the items issued in the period are listed via
 * Discovery, then each one's usage report is requested individually and the results are sorted.
 *
 * That makes the ranking *exact* for the period rather than a sample - but it costs one request per
 * item, so requests run at limited concurrency and the candidate set is capped by
 * {@link MAX_CANDIDATES}. When the cap is hit the component says so, because the ranking is then
 * only over the newest items in the period.
 */
@Component({
  selector: 'ds-top-items',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink, NgbDatepickerModule],
  templateUrl: './top-items.component.html',
  styleUrl: './top-items.component.scss',
})
export class TopItemsComponent implements OnInit, OnChanges {

  /**
   * Whether to rank by views or by downloads. Bound from route data on the standalone reports
   * (component input binding is enabled for the router), and set directly by the dashboard.
   */
  @Input() metric: UsageMetric = 'views';

  /**
   * How many ranked items to show. The dashboard panels pass 5; the full reports leave it unset
   * and paginate instead.
   */
  @Input() limit?: number | null = null;

  /**
   * When set, the component's own date inputs are hidden and the report follows this range.
   */
  @Input() externalDateRange?: { startDate: string | null; endDate: string | null } | null = null;

  ranked: RankedItem[] = [];

  isLoading = false;
  errorMessage: string | null = null;

  /**
   * How many items were examined, and whether the cap stopped us short of the full period.
   */
  candidatesChecked = 0;
  candidateTotal = 0;
  capped = false;

  currentPage = 0;
  pageSize = 20;

  filterForm = new FormGroup({
    startDate: new FormControl<any>(isoToNgbDate(this.defaultStart())),
    endDate: new FormControl<any>(isoToNgbDate(this.today())),
  });

  private readonly CONCURRENCY = 6;
  private readonly MAX_CANDIDATES = 500;
  private readonly CANDIDATE_PAGE_SIZE = 100;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
  ) { }

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const rangeChanged = changes['externalDateRange'] && !changes['externalDateRange'].firstChange;
    const metricChanged = changes['metric'] && !changes['metric'].firstChange;
    if (rangeChanged || metricChanged) {
      this.load();
    }
  }

  /**
   * Prefix for this report's wording, so the labels follow the metric.
   */
  get i18nPrefix(): string {
    return `otcloud.top-items.${this.metric}`;
  }

  get displayed(): RankedItem[] {
    if (this.limit) {
      return this.ranked.slice(0, this.limit);
    }
    const start = this.currentPage * this.pageSize;
    return this.ranked.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.ranked.length / this.pageSize));
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.ranked = [];
    this.candidatesChecked = 0;
    this.candidateTotal = 0;
    this.capped = false;
    this.currentPage = 0;
    this.cdr.detectChanges();

    const usageParams = this.usageParams();

    this.fetchCandidates().pipe(
      switchMap((candidates) => {
        if (candidates.length === 0) {
          return of([] as RankedItem[]);
        }
        return from(candidates).pipe(
          mergeMap((candidate) => this.fetchUsage(candidate, usageParams), this.CONCURRENCY),
          toArray(),
        );
      }),
    ).subscribe({
      next: (items) => {
        // Items with nothing recorded are noise in a "most used" ranking, not results.
        this.ranked = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error building the most ${this.metric} items report:`, err);
        this.errorMessage = `Failed to build the most ${this.metric} items report.`;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * List the items to rank: everything issued in the period, newest first, up to the cap.
   */
  private fetchCandidates(): Observable<RankedItem[]> {
    let page = 0;

    const fetchPage = (): Observable<SearchObjectsJson> => {
      let params = new HttpParams()
        .set('dsoType', 'ITEM')
        .set('size', this.CANDIDATE_PAGE_SIZE.toString())
        .set('page', page.toString());
      const yearRange = this.yearRangeFilter();
      if (yearRange) {
        params = params.set('f.dateIssued', yearRange);
      }
      const url = this.url('api/discover/search/objects');
      // Newest first, so that capping keeps the most recent items - but not every repository
      // configures this sort field, so fall back to the default ordering rather than failing.
      return this.http.get<SearchObjectsJson>(url, { params: params.set('sort', 'dc.date.accessioned,DESC') }).pipe(
        catchError(() => this.http.get<SearchObjectsJson>(url, { params })),
      );
    };

    return fetchPage().pipe(
      expand((response) => {
        const pageInfo = response?._embedded?.searchResult?.page;
        const fetchedSoFar = (page + 1) * this.CANDIDATE_PAGE_SIZE;
        const morePages = pageInfo?.totalPages != null && page + 1 < pageInfo.totalPages;
        if (!morePages || fetchedSoFar >= this.MAX_CANDIDATES) {
          return EMPTY;
        }
        page += 1;
        return fetchPage();
      }),
      map((response) => {
        const pageInfo = response?._embedded?.searchResult?.page;
        if (pageInfo?.totalElements != null) {
          this.candidateTotal = pageInfo.totalElements;
        }
        return (response?._embedded?.searchResult?._embedded?.objects || [])
          .map((entry) => entry?._embedded?.indexableObject)
          .filter((object) => !!object)
          .map((object) => ({
            id: object.uuid || object.id,
            label: object.name || object.metadata?.['dc.title']?.[0]?.value || object.uuid || object.id,
            value: 0,
          }));
      }),
      reduce((acc: RankedItem[], items: RankedItem[]) => acc.concat(items), []),
      map((items) => {
        const capped = items.slice(0, this.MAX_CANDIDATES);
        this.capped = this.candidateTotal > capped.length;
        this.candidatesChecked = capped.length;
        this.cdr.detectChanges();
        return capped;
      }),
    );
  }

  /**
   * One item's figure for the period. A `TotalDownloads` report has a point per bitstream, so the
   * points are summed either way; items with no bitstreams simply have nothing to report.
   */
  private fetchUsage(item: RankedItem, params: HttpParams): Observable<RankedItem> {
    const reportType = this.metric === 'downloads' ? 'TotalDownloads' : 'TotalVisits';
    return this.http.get<UsageReportJson>(this.url(`api/statistics/usagereports/${item.id}_${reportType}`), { params }).pipe(
      map((report) => ({
        ...item,
        value: (report?.points || []).reduce((sum, point) => {
          const numbers = Object.values(point.values || {});
          return sum + (numbers.length ? Number(numbers[0]) : 0);
        }, 0),
      })),
      catchError(() => of({ ...item, value: 0 })),
    );
  }

  private usageParams(): HttpParams {
    let params = new HttpParams();
    const start = this.startDate();
    const end = this.endDate();
    if (start && end) {
      params = params.set('startDate', `${start}T00:00:00Z`).set('endDate', `${end}T23:59:59Z`);
    }
    return params;
  }

  /**
   * The Discovery "dateIssued" filter is year-granular, so the candidate set narrows to whole years.
   */
  private yearRangeFilter(): string | null {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) {
      return null;
    }
    return `[${start.slice(0, 4)} TO ${end.slice(0, 4)}],equals`;
  }

  private startDate(): string | null {
    return this.externalDateRange ? this.externalDateRange.startDate : ngbDateToIso(this.filterForm.value.startDate);
  }

  private endDate(): string | null {
    return this.externalDateRange ? this.externalDateRange.endDate : ngbDateToIso(this.filterForm.value.endDate);
  }

  onSubmit(): void {
    this.load();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  downloadCSV(): void {
    const column = this.metric === 'downloads' ? 'Downloads' : 'Views';
    const headers = ['Rank', 'Title', 'ID', column];
    const rows = this.ranked.map((item, index) => [
      index + 1,
      `"${(item.label || '').replace(/"/g, '""')}"`,
      item.id,
      item.value,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Most_${column}_Items_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private url(path: string): string {
    const baseUrl = this.appConfig.rest.baseUrl;
    const separator = baseUrl.endsWith('/') ? '' : '/';
    return `${baseUrl}${separator}${path}`;
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private defaultStart(): string {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - 1);
    return date.toISOString().split('T')[0];
  }
}
