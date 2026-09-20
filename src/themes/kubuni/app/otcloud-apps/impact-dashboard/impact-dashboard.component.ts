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
import { RouterLink } from '@angular/router';
import {
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { SiteDataService } from 'src/app/core/data/site-data.service';

import {
  isoToNgbDate,
  ngbDateToIso,
} from '../ngb-date.util';
import { MetadataUsageComponent } from '../metadata-usage/metadata-usage.component';
import { RepositorySummaryComponent } from '../repository-summary/repository-summary.component';
import { StaffActivityComponent } from '../staff-activity/staff-activity.component';
import { TopItemsComponent } from '../top-items/top-items.component';

/**
 * Repository impact report: headline figures, top authors, and (where the backend's
 * workflow-statistics visibility setting allows it) how much each staff member contributed.
 *
 * The sections reuse the standalone `ds-repository-summary`, `ds-metadata-usage` and
 * `ds-staff-activity` reports rather than re-implementing their data fetching. The first two are
 * driven by this page's shared date range via their `externalDateRange` input; staff activity keeps
 * its own filter, because scanning the audit trail needs a narrower period than this page defaults
 * to.
 *
 * The "most viewed" and "most downloaded" panels are top 5s built by `ds-top-items`, one per metric,
 * which has to rank items itself because stock DSpace reports usage per DSpaceObject and offers no
 * repository-wide item ranking; "view full report" opens the same component paginated over the whole
 * period.
 *
 * Staff activity only renders once `canViewStaffActivity` resolves true, via the
 * `canViewWorkflowStatistics` authorization feature against the Site - the same feature the backend
 * evaluates for the `usage-statistics.authorization.admin.workflow` setting, so a public visitor
 * never even triggers the request.
 */
@Component({
  selector: 'ds-impact-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    RouterLink,
    TranslateModule,
    RepositorySummaryComponent,
    TopItemsComponent,
    MetadataUsageComponent,
    StaffActivityComponent,
  ],
  templateUrl: './impact-dashboard.component.html',
  styleUrl: './impact-dashboard.component.scss',
})
export class ImpactDashboardComponent implements OnInit, OnDestroy {

  siteUuid: string | null = null;
  siteName = '';
  isLoadingSite = true;

  canViewStaffActivity = false;

  filterForm = new FormGroup({
    startDate: new FormControl<NgbDateStruct | null>(isoToNgbDate(this.defaultStart())),
    endDate: new FormControl<NgbDateStruct | null>(isoToNgbDate(this.today())),
  });

  externalDateRange: { startDate: string | null; endDate: string | null } = {
    startDate: this.defaultStart(),
    endDate: this.today(),
  };

  private siteSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private siteService: SiteDataService,
    private authorizationService: AuthorizationDataService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.siteSub = this.siteService.find().subscribe((site) => {
      this.siteUuid = site.uuid;
      this.siteName = site.name;
      this.isLoadingSite = false;
      this.cdr.detectChanges();

      this.authSub = this.authorizationService.isAuthorized(FeatureID.CanViewWorkflowStatistics, site.self)
        .subscribe((authorized) => {
          this.canViewStaffActivity = authorized;
          this.cdr.detectChanges();
        });
    });
  }

  onSubmit(): void {
    const startDate = ngbDateToIso(this.filterForm.value.startDate);
    const endDate = ngbDateToIso(this.filterForm.value.endDate);
    if (!startDate || !endDate) {
      return;
    }
    // Reassigning (rather than mutating) so the child components' `externalDateRange` input is
    // seen as a new value and their ngOnChanges re-fetches.
    this.externalDateRange = { startDate, endDate };
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private defaultStart(): string {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - 1);
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.siteSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }
}
