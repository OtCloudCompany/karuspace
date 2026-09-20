import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  forkJoin,
  from,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  map,
  mergeMap,
  reduce,
  switchMap,
} from 'rxjs/operators';
import { Audit } from 'src/app/core/audit/model/audit.model';
import { SortDirection } from 'src/app/core/cache/models/sort-options.model';
import { AuditDataService } from 'src/app/core/data/audit-data.service';
import { FindListOptions } from 'src/app/core/data/find-list-options.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { followLink } from 'src/app/core/shared/follow-link-config.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';

import {
  isoToNgbDate,
  ngbDateToIso,
} from '../ngb-date.util';

export interface StaffActivityRow {
  id: string;
  name: string;
  email: string;
  /**
   * True for the bucket of records the audit could not attribute to anyone. The audit stores the
   * session user, and command-line or scheduled work (batch imports, media filtering, curation
   * tasks) runs without one, so all of it collapses into this single row.
   */
  unattributed: boolean;
  itemsCreated: number;
  itemsEdited: number;
  itemsDeleted: number;
  bitstreamsAdded: number;
  totalEvents: number;
}

/**
 * Bucket key for audit records with no eperson.
 */
const UNATTRIBUTED = 'unattributed';

/**
 * The stock audit endpoint (`/api/system/auditevents`) has no `startDate`/`endDate` filter, so the
 * records for a period have to be found by position: pages are sorted newest-first, so the period
 * always starts at page 0 and ends at whichever page first contains a record older than the start
 * date. {@link StaffActivityComponent.findLastPageInRange} binary-searches for that page, and the
 * pages up to it are then fetched in parallel.
 *
 * The page size is the backend's maximum. The page cap is deliberately high, because a single bulk
 * import writes one audit record per metadata value *per item* - a few hundred items can easily be
 * tens of thousands of records, and a cap that stops short of the item CREATE records reports the
 * import as zero items added.
 */
const AUDIT_PAGE_SIZE = 100;
const MAX_AUDIT_PAGES = 200;
const PAGE_CONCURRENCY = 6;

/**
 * Reports how much repository work each staff member did over a period: items created, archived,
 * edited or deleted, and files added.
 *
 * Backed entirely by the stock DSpace Audit System REST API (`AuditDataService`, the same service
 * the admin "Audit log" page under /auditlogs already uses) rather than a custom aggregation
 * endpoint. Every count is a number of *distinct* objects rather than a number of audit records,
 * because the audit core writes one record per changed metadata value.
 */
@Component({
  selector: 'ds-staff-activity',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgbDatepickerModule],
  templateUrl: './staff-activity.component.html',
  styleUrl: './staff-activity.component.scss',
})
export class StaffActivityComponent implements OnInit, OnDestroy {

  rows: StaffActivityRow[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  validationError: string | null = null;

  /**
   * True when the report came back empty, which most often means auditing has not been switched on
   * (`audit.enabled`) or there is no activity in the selected period.
   */
  noData = false;

  /**
   * True when the audit-event page cap was hit before reaching the start of the selected period,
   * meaning older events in range may be missing from the counts below.
   */
  truncated = false;

  /**
   * How many audit records the period holds, and how many of them were actually read. They differ
   * only when {@link truncated} is true, and the template reports both so the shortfall is visible
   * rather than implied.
   */
  recordsInPeriod = 0;
  recordsScanned = 0;

  totalItemsCreated = 0;
  totalElements = 0;

  filterForm = new FormGroup({
    startDate: new FormControl<NgbDateStruct | null>(isoToNgbDate(this.defaultStart())),
    endDate: new FormControl<NgbDateStruct | null>(isoToNgbDate(this.today())),
  });

  private sub?: Subscription;

  constructor(
    private auditService: AuditDataService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    const startIso = ngbDateToIso(this.filterForm.value.startDate);
    const endIso = ngbDateToIso(this.filterForm.value.endDate);
    if (!startIso || !endIso) {
      this.validationError = 'Both Start Date and End Date are required to apply date filtering.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.validationError = null;
    this.truncated = false;
    this.cdr.detectChanges();

    const start = new Date(`${startIso}T00:00:00Z`);
    const end = new Date(`${endIso}T23:59:59Z`);

    this.sub?.unsubscribe();
    this.sub = this.fetchAuditsInRange(start).subscribe({
      next: (audits) => {
        this.buildRows(audits, start, end);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching staff activity:', err);
        this.errorMessage = 'Failed to load the staff activity report. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * One page of audit records, newest first. `currentPage` is 1-based.
   */
  private fetchPage(page: number): Observable<Audit[]> {
    const options = Object.assign(new FindListOptions(), {
      elementsPerPage: AUDIT_PAGE_SIZE,
      currentPage: page,
      sort: { field: 'timeStamp', direction: SortDirection.DESC },
    });
    return this.auditService.findAll(options, false, true, followLink('eperson')).pipe(
      getFirstCompletedRemoteData(),
      map((rd: RemoteData<any>) => rd?.payload?.page || []),
    );
  }

  /**
   * The 1-based index of the last page that still holds records at or after `start`.
   *
   * Records are ordered newest-first, so "is this page still inside the period" is monotonic across
   * pages and can be binary-searched: about a dozen requests locate the boundary in a repository
   * with millions of audit records, instead of walking every page to find it.
   */
  private findLastPageInRange(start: Date): Observable<number> {
    const pageStartsInRange = (page: number): Observable<boolean> => this.fetchPage(page).pipe(
      map((items) => items.length > 0 && new Date(items[0].timeStamp).getTime() >= start.getTime()),
    );

    // Grow the upper bound by doubling until a page starts before the period, so the search space
    // stays proportional to the period rather than to the whole audit history.
    const growBound = (low: number, high: number): Observable<{ low: number; high: number }> =>
      pageStartsInRange(high).pipe(
        switchMap((inRange) => {
          if (!inRange) {
            return of({ low, high });
          }
          if (high >= MAX_AUDIT_PAGES) {
            // The cap is still inside the period: take it as the last page, so the search does not
            // settle one page short and report a complete scan when it was actually cut off.
            return of({ low: high, high });
          }
          return growBound(high, Math.min(high * 2, MAX_AUDIT_PAGES));
        }),
      );

    // Invariant: `low` is in range, `high` is not (or is the cap).
    const narrow = (low: number, high: number): Observable<number> => {
      if (high - low <= 1) {
        return of(low);
      }
      const mid = Math.floor((low + high) / 2);
      return pageStartsInRange(mid).pipe(
        switchMap((inRange) => (inRange ? narrow(mid, high) : narrow(low, mid))),
      );
    };

    return pageStartsInRange(1).pipe(
      switchMap((firstPageInRange) => {
        if (!firstPageInRange) {
          return of(0);
        }
        return growBound(1, 2).pipe(
          switchMap(({ low, high }) => (low === high ? of(low) : narrow(low, high))),
        );
      }),
    );
  }

  /**
   * Every audit record in the period, found by locating the boundary page and then reading the
   * pages up to it in parallel.
   */
  private fetchAuditsInRange(start: Date): Observable<Audit[]> {
    return this.findLastPageInRange(start).pipe(
      switchMap((lastPage) => {
        if (lastPage === 0) {
          this.recordsInPeriod = 0;
          this.recordsScanned = 0;
          return of([] as Audit[]);
        }
        this.truncated = lastPage >= MAX_AUDIT_PAGES;
        const pages = Array.from({ length: lastPage }, (_, i) => i + 1);
        return from(pages).pipe(
          mergeMap((page) => this.fetchPage(page), PAGE_CONCURRENCY),
          reduce((acc: Audit[], pageItems: Audit[]) => acc.concat(pageItems), []),
        );
      }),
    );
  }

  private buildRows(audits: Audit[], start: Date, end: Date): void {
    this.recordsScanned = audits.length;
    const inRange = audits.filter((audit) => {
      const t = new Date(audit.timeStamp).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    this.recordsInPeriod = inRange.length;

    interface Bucket {
      created: Set<string>;
      edited: Set<string>;
      deleted: Set<string>;
      files: Set<string>;
      total: number;
      sample?: Audit;
    }

    const byEperson = new Map<string, Bucket>();

    inRange.forEach((audit) => {
      const key = audit.epersonUUID || UNATTRIBUTED;
      if (!byEperson.has(key)) {
        byEperson.set(key, {
          created: new Set(), edited: new Set(),
          deleted: new Set(), files: new Set(), total: 0,
        });
      }
      const bucket = byEperson.get(key);
      bucket.total += 1;
      bucket.sample = bucket.sample || audit;

      const subjectType = (audit.subjectType || '').toUpperCase();
      const eventType = (audit.eventType || '').toUpperCase();

      // INSTALL is not counted: the audit consumer only stores CREATE, MODIFY_METADATA, DELETE and
      // REMOVE (plus anything carrying a related object), and the INSTALL event carries none, so an
      // "archived" column could only ever read zero.
      if (subjectType === 'ITEM') {
        if (eventType === 'CREATE') { bucket.created.add(audit.subjectUUID); }
        if (eventType === 'MODIFY_METADATA' || eventType === 'MODIFY') { bucket.edited.add(audit.subjectUUID); }
        if (eventType === 'DELETE' || eventType === 'REMOVE') { bucket.deleted.add(audit.subjectUUID); }
      }
      if (subjectType === 'BITSTREAM' && eventType === 'CREATE') {
        bucket.files.add(audit.subjectUUID);
      }
    });

    const entries = Array.from(byEperson.entries());

    if (entries.length === 0) {
      this.rows = [];
      this.totalElements = 0;
      this.totalItemsCreated = 0;
      this.noData = true;
      return;
    }

    const rows$ = entries.map(([epersonUUID, bucket]) => {
      const unattributed = epersonUUID === UNATTRIBUTED;
      const eperson$ = !unattributed && bucket.sample?.eperson
        ? bucket.sample.eperson.pipe(getFirstCompletedRemoteData())
        : of(null);
      return eperson$.pipe(
        map((rd: RemoteData<any>) => ({
          id: epersonUUID,
          name: unattributed ? '' : (rd?.payload?.name || rd?.payload?.email || epersonUUID),
          email: unattributed ? '' : (rd?.payload?.email || ''),
          unattributed,
          itemsCreated: bucket.created.size,
          itemsEdited: bucket.edited.size,
          itemsDeleted: bucket.deleted.size,
          bitstreamsAdded: bucket.files.size,
          totalEvents: bucket.total,
        } as StaffActivityRow)),
      );
    });

    forkJoin(rows$).subscribe((resolved) => {
      resolved.sort((a, b) => b.itemsCreated - a.itemsCreated);
      this.rows = resolved;
      this.totalElements = resolved.length;
      this.totalItemsCreated = resolved.reduce((sum, r) => sum + r.itemsCreated, 0);
      this.noData = false;
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    this.fetch();
  }

  onReset(): void {
    this.filterForm.patchValue({ startDate: null, endDate: null });
    this.validationError = null;
    this.rows = [];
    this.totalElements = 0;
    this.totalItemsCreated = 0;
  }

  downloadCSV(): void {
    const headers = ['Staff member', 'Email', 'Created', 'Edited', 'Deleted', 'Files added', 'Audit records'];
    const rows = this.rows.map((row) => [
      `"${(row.unattributed ? 'Unattributed (batch or scheduled process)' : row.name || '').replace(/"/g, '""')}"`,
      row.email,
      row.itemsCreated,
      row.itemsEdited,
      row.itemsDeleted,
      row.bitstreamsAdded,
      row.totalEvents,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Staff_Activity_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private defaultStart(): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 90);
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
