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
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest,
  Subscription,
} from 'rxjs';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { DSpaceObjectDataService } from 'src/app/core/data/dspace-object-data.service';
import { getFirstSucceededRemoteData } from 'src/app/core/shared/operators';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import { ngbDateToIso } from '../ngb-date.util';

export interface MetadataUsageRow {
  id: string;
  value: string;
  items: number;
}

/**
 * Raw shape of a stock DSpace Discovery facet-values page, as returned by
 * `/api/discover/facets/{field}`.
 */
interface FacetValuesJson {
  _embedded?: {
    values?: { label: string; count: number }[];
  };
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

interface FieldOption {
  value: string;
  labelKey: string;
  headingKey?: string;
}

/**
 * Item counts grouped by a Discovery facet's values - e.g. which authors have the most items
 * matching a date range.
 *
 * Backed entirely by the stock `/api/discover/facets/{field}` endpoint (the same Discovery facet
 * mechanism the search sidebar uses), filtered by a `dateIssued` range via the standard
 * `f.dateIssued.min`/`f.dateIssued.max` query parameters. This reports the number of items per
 * facet value directly from the search index - an exact count, not a lower bound derived from a
 * capped set of most-viewed items.
 *
 * When `lockField` is set (e.g. embedded as the impact dashboard's "Top Authors" panel), the field
 * picker is hidden and the report is pinned to that one field. When `externalDateRange` is set, the
 * component's own date inputs are hidden and the report re-fetches whenever the parent-supplied
 * range changes.
 */
@Component({
  selector: 'ds-metadata-usage',
  imports: [CommonModule, NgbDatepickerModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './metadata-usage.component.html',
  styleUrl: './metadata-usage.component.scss',
})
export class MetadataUsageComponent implements OnInit, OnChanges, OnDestroy {

  @Input() uuid?: string;
  @Input() object?: any;

  /**
   * When set, pins the report to this facet field and hides the field picker.
   */
  @Input() lockField?: string | null = null;

  /**
   * When set, hides the component's own date inputs and drives the report from this range instead.
   */
  @Input() externalDateRange?: { startDate: string | null; endDate: string | null } | null = null;

  /**
   * Facets offered in the picker. "author" is the one virtually every DSpace instance ships with by
   * default; add more here only once their exact facet name has been confirmed for this repository.
   */
  fieldOptions: FieldOption[] = [
    { value: 'author', labelKey: 'otcloud.metadata-usage.field.author', headingKey: 'otcloud.metadata-usage.heading.author' },
  ];

  headingKey = 'otcloud.metadata-usage.title';

  rows: MetadataUsageRow[] = [];
  resolvedUuid: string | null = null;
  resolvedObjectName = '';

  isLoading = false;
  errorMessage: string | null = null;
  noData = false;

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 1;

  filterForm = new FormGroup({
    field: new FormControl('author'),
    startDate: new FormControl<NgbDateStruct | string | null>(null),
    endDate: new FormControl<NgbDateStruct | string | null>(null),
    size: new FormControl(20),
  });

  private sub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dsoService: DSpaceObjectDataService,
    private dsoNameService: DSONameService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
  ) { }

  ngOnInit(): void {
    if (this.lockField) {
      this.filterForm.patchValue({ field: this.lockField }, { emitEvent: false });
      this.ensureFieldOption(this.lockField);
    }

    this.routeSub = combineLatest([this.route.params, this.route.queryParams])
      .subscribe(([params, queryParams]) => {
        // No uuid is valid and means "the whole repository": a Site uuid is not a resolvable
        // Discovery scope, so repository-wide reports must omit the scope parameter entirely.
        this.resolvedUuid = params['uuid'] || this.uuid || this.object?.uuid || this.object?.id || null;

        const requestedField = !this.lockField ? queryParams['field'] : null;
        if (requestedField) {
          this.filterForm.patchValue({ field: requestedField }, { emitEvent: false });
          this.ensureFieldOption(requestedField);
        }

        this.resolveName();
        this.fetch(true);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalDateRange'] && this.externalDateRange) {
      this.filterForm.patchValue({
        startDate: this.externalDateRange.startDate,
        endDate: this.externalDateRange.endDate,
      }, { emitEvent: false });
      this.fetch(true);
    }
  }

  private ensureFieldOption(field: string): void {
    if (!this.fieldOptions.some((option) => option.value === field)) {
      this.fieldOptions = [...this.fieldOptions, { value: field, labelKey: field }];
    }
  }

  private resolveName(): void {
    if (this.object) {
      this.resolvedObjectName = this.dsoNameService.getName(this.object);
      return;
    }
    if (!this.resolvedUuid) {
      return;
    }
    this.dsoService.findById(this.resolvedUuid).pipe(
      getFirstSucceededRemoteData(),
    ).subscribe((rd) => {
      if (rd.hasSucceeded && rd.payload) {
        this.resolvedObjectName = this.dsoNameService.getName(rd.payload);
        this.cdr.detectChanges();
      }
    });
  }

  fetch(resetPage = false): void {
    if (resetPage) {
      this.currentPage = 0;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.pageSize = this.filterForm.value.size || 20;

    const field = this.lockField || this.filterForm.value.field || 'author';
    const option = this.fieldOptions.find((candidate) => candidate.value === field);
    this.headingKey = option?.headingKey || 'otcloud.metadata-usage.title';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString());

    if (this.resolvedUuid) {
      params = params.set('scope', this.resolvedUuid);
    }

    // The "dateIssued" discovery filter is year-granular (it backs the classic Date Issued range
    // slider), so only the year portion of the selected dates is meaningful. The `.min`/`.max`
    // split only exists in the Angular route; the REST API expects a single range filter in the
    // form `f.dateIssued=[<min> TO <max>],equals` (see SearchConfigurationService.getCurrentFilters).
    const start = ngbDateToIso(this.filterForm.value.startDate);
    const end = ngbDateToIso(this.filterForm.value.endDate);
    if (start && end) {
      params = params.set('f.dateIssued', `[${start.slice(0, 4)} TO ${end.slice(0, 4)}],equals`);
    }

    this.sub?.unsubscribe();
    this.sub = this.http.get<FacetValuesJson>(this.endpoint(field), { params }).subscribe({
      next: (response) => {
        const values = response?._embedded?.values || [];
        this.rows = values.map((value, index) => ({
          id: `${field}-${this.currentPage}-${index}`,
          value: value.label,
          items: value.count,
        }));
        this.totalElements = response?.page?.totalElements ?? this.rows.length;
        this.totalPages = response?.page?.totalPages ?? 1;
        this.noData = this.rows.length === 0 && this.currentPage === 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching metadata usage:', err);
        this.errorMessage = 'Failed to load this report.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSubmit(): void {
    this.fetch(true);
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetch(false);
    }
  }

  onPageSizeChange(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value, 10);
    this.filterForm.patchValue({ size });
    this.fetch(true);
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  downloadCSV(): void {
    const headers = ['Value', 'Items'];
    const rows = this.rows.map((row) => [
      `"${(row.value || '').replace(/"/g, '""')}"`,
      row.items,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const field = (this.filterForm.value.field || 'metadata').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `Top_${field}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private endpoint(field: string): string {
    const baseUrl = this.appConfig.rest.baseUrl;
    const separator = baseUrl.endsWith('/') ? '' : '/';
    return `${baseUrl}${separator}api/discover/facets/${field}`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }
}
