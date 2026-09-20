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
import { TranslateModule } from '@ngx-translate/core';
import {
  forkJoin,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
} from 'rxjs/operators';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

interface SearchObjectsJson {
  _embedded?: {
    searchResult?: {
      page?: { totalElements?: number };
    };
  };
}

interface UsageReportJson {
  points?: { values: Record<string, number> }[];
}

/**
 * Headline figures for the repository, for managers: how much is in it, how much was added in the
 * reporting period, how far it reaches, and how much of it is actually usable.
 *
 * Every figure is one request to a stock DSpace endpoint and is exact; each is fetched
 * independently so that one unavailable figure shows as "–" instead of blanking the whole row:
 *  - item counts come from Discovery, read off `page.totalElements` of a `size=1` search. The
 *    open-access and full-text counts apply the `access_status` and `has_content_in_original_bundle`
 *    filters, which stock Discovery configures by default.
 *  - views and the countries reached come from the Site's `TotalVisits` and `TopCountries` reports.
 *
 * Two figures that look like they belong here are deliberately absent, because stock DSpace cannot
 * produce them in one request:
 *  - repository-wide *downloads*: `TotalDownloads` exists only at Item scope (a site-scoped request
 *    404s), so a whole-repository figure would mean summing every item.
 *  - a distinct *author* count: facet responses carry no `totalElements` and the backend caps `size`
 *    at 100 per page, so counting authors means walking every page. `ds-metadata-usage` shows the
 *    authors themselves, which is the more useful view anyway.
 */
@Component({
  selector: 'ds-repository-summary',
  imports: [CommonModule, TranslateModule],
  templateUrl: './repository-summary.component.html',
  styleUrl: './repository-summary.component.scss',
})
export class RepositorySummaryComponent implements OnInit, OnChanges {

  @Input() siteUuid?: string | null;

  /**
   * The reporting period. Figures that can be scoped to it (views, items added) honour it; totals
   * that describe the repository as it stands today (items, authors, collections) do not.
   */
  @Input() externalDateRange?: { startDate: string | null; endDate: string | null } | null = null;

  totalItems: number | null = null;
  itemsInPeriod: number | null = null;
  openAccessItems: number | null = null;
  fullTextItems: number | null = null;
  totalViews: number | null = null;
  countriesReached: number | null = null;

  isLoading = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
  ) { }

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalDateRange'] && !changes['externalDateRange'].firstChange) {
      this.load();
    }
  }

  load(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const itemParams = new HttpParams().set('dsoType', 'ITEM').set('size', '1');
    let periodParams = itemParams;
    const yearRange = this.yearRangeFilter();
    if (yearRange) {
      periodParams = periodParams.set('f.dateIssued', yearRange);
    }

    forkJoin({
      totalItems: this.searchTotal(itemParams),
      itemsInPeriod: yearRange ? this.searchTotal(periodParams) : of(null),
      openAccessItems: this.searchTotal(itemParams.set('f.access_status', 'open.access,equals')),
      fullTextItems: this.searchTotal(itemParams.set('f.has_content_in_original_bundle', 'true,equals')),
      totalViews: this.siteReportTotal('TotalVisits'),
      countriesReached: this.siteReportPointCount('TopCountries'),
    }).subscribe((result) => {
      this.totalItems = result.totalItems;
      this.itemsInPeriod = result.itemsInPeriod;
      this.openAccessItems = result.openAccessItems;
      this.fullTextItems = result.fullTextItems;
      this.totalViews = result.totalViews;
      this.countriesReached = result.countriesReached;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  /**
   * A count as a share of the whole repository, for the cards that are more meaningful as a
   * proportion than as an absolute.
   */
  percentOfItems(count: number | null): number | null {
    if (count === null || !this.totalItems) {
      return null;
    }
    return Math.round((count / this.totalItems) * 100);
  }

  private searchTotal(params: HttpParams): Observable<number | null> {
    return this.http.get<SearchObjectsJson>(this.url('api/discover/search/objects'), { params }).pipe(
      map((response) => response?._embedded?.searchResult?.page?.totalElements ?? null),
      catchError(() => of(null)),
    );
  }

  /**
   * A Site usage report for the period, or null when it is unavailable.
   */
  private siteReport(reportType: string): Observable<UsageReportJson | null> {
    if (!this.siteUuid) {
      return of(null);
    }
    let params = new HttpParams();
    const start = this.externalDateRange?.startDate;
    const end = this.externalDateRange?.endDate;
    if (start && end) {
      params = params.set('startDate', `${start}T00:00:00Z`).set('endDate', `${end}T23:59:59Z`);
    }
    return this.http.get<UsageReportJson>(this.url(`api/statistics/usagereports/${this.siteUuid}_${reportType}`), { params }).pipe(
      catchError(() => of(null)),
    );
  }

  private siteReportTotal(reportType: string): Observable<number | null> {
    return this.siteReport(reportType).pipe(
      map((report) => (report === null ? null : (report.points || []).reduce((sum, point) => {
        const numbers = Object.values(point.values || {});
        return sum + (numbers.length ? Number(numbers[0]) : 0);
      }, 0))),
    );
  }

  /**
   * How many points a report has - for `TopCountries`, that is how many countries the repository
   * was read from in the period.
   */
  private siteReportPointCount(reportType: string): Observable<number | null> {
    return this.siteReport(reportType).pipe(
      map((report) => (report === null ? null : (report.points || []).length)),
    );
  }

  /**
   * The Discovery "dateIssued" filter is year-granular, so the period narrows to whole years here.
   */
  private yearRangeFilter(): string | null {
    const start = this.externalDateRange?.startDate;
    const end = this.externalDateRange?.endDate;
    if (!start || !end) {
      return null;
    }
    return `[${start.slice(0, 4)} TO ${end.slice(0, 4)}],equals`;
  }

  private url(path: string): string {
    const baseUrl = this.appConfig.rest.baseUrl;
    const separator = baseUrl.endsWith('/') ? '' : '/';
    return `${baseUrl}${separator}${path}`;
  }
}
