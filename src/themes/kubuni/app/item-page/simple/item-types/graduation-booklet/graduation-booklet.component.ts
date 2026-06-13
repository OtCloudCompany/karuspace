import {
  AsyncPipe,
  NgForOf,
  NgIf,
} from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  Router,
  RouterLink,
} from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { RouteService } from 'src/app/core/services/route.service';
import { Bitstream } from 'src/app/core/shared/bitstream.model';
import { Context } from 'src/app/core/shared/context.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { ViewMode } from 'src/app/core/shared/view-mode.model';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { CollectionsComponent } from 'src/app/item-page/field-components/collections/collections.component';
import { MiradorViewerComponent } from 'src/app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from 'src/app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ItemPageDateFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/date/item-page-date-field.component';
import { GenericItemPageFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { ThemedItemPageTitleFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { PublicationComponent as BaseComponent } from 'src/app/item-page/simple/item-types/publication/publication.component';
import { ThemedMetadataRepresentationListComponent } from 'src/app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component';
import { hasValue } from '@dspace/shared/utils/empty.util'; 
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { NotificationsService } from '@dspace/core/notification-system/notifications.service';
import { listableObjectComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from 'src/app/shared/results-back-button/themed-results-back-button.component';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { VarDirective } from 'src/app/shared/utils/var.directive';

import { UsageMetricsComponent } from '../../../kubuni-apps/usage-metrics/usage-metrics.component';

@listableObjectComponent('GraduationBooklet', ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-graduation-booklet',
  standalone: true,
  imports: [
    AsyncPipe,
    CollectionsComponent,
    GenericItemPageFieldComponent,
    ItemPageDateFieldComponent,
    ItemPageUriFieldComponent,
    MiradorViewerComponent,
    NgForOf,
    NgIf,
    PdfJsViewerModule,
    RouterLink,
    ThemedFileSectionComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedLoadingComponent,
    ThemedMetadataRepresentationListComponent,
    ThemedResultsBackButtonComponent,
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
    UsageMetricsComponent,
    VarDirective,
  ],
  templateUrl: './graduation-booklet.component.html',
  styleUrl: './graduation-booklet.component.scss',
})
export class GraduationBookletComponent extends BaseComponent implements OnInit {
  usageReport: UsageReport[] | null;
  reportsLoaded = false;
  bitstreams$: BehaviorSubject<Bitstream[]>;
  bitstream: Bitstream[];
  primaryBitstreamId: string;
  currentPage: number;
  isLoading: boolean;
  isLastPage: boolean;
  pageSize: number;
  canDownloadPrimaryBitstream = false;
  pdfSource: any;
  bitstreamInfoLoaded = false;
  private bitstreamDownloadStatus = new Map<string, Observable<boolean>>();

  constructor(protected routeService: RouteService,
              protected router: Router,
              protected bitstreamDataService: BitstreamDataService,
              protected notificationsService: NotificationsService,
              protected translateService: TranslateService,
              protected authService: AuthService,
              protected authorizationService: AuthorizationDataService,
              private cdRef: ChangeDetectorRef, protected http: HttpClient) {
    super(routeService, router);
  }

  ngOnInit() {
    super.ngOnInit();
    this.getPrimaryBitstreamId();
    this.getNextPage();
  }

  onReportLoaded(reportData: UsageReport[]) {
    this.usageReport = reportData;
    this.reportsLoaded = true;
  }

  private getPrimaryBitstreamId() {
    this.bitstreamDataService.findPrimaryBitstreamByItemAndName(this.object, 'ORIGINAL', true, true).subscribe((primaryBitstream: Bitstream | null) => {
      if (!primaryBitstream) {
        return;
      }
      this.primaryBitstreamId = primaryBitstream?.id;
    });
  }

  getNextPage(): void {
    this.isLoading = true;
    if (this.currentPage === undefined) {
      this.currentPage = 1;
      this.bitstreams$ = new BehaviorSubject([]);
    } else {
      this.currentPage++;
    }
    this.bitstreamDataService.findAllByItemAndBundleName(this.object, 'ORIGINAL', {
      currentPage: this.currentPage,
      elementsPerPage: this.pageSize,
    }).pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((bitstreamsRD: RemoteData<PaginatedList<Bitstream>>) => {
      if (bitstreamsRD.errorMessage) {
        this.notificationsService.error(this.translateService.get('file-section.error.header'), `${bitstreamsRD.statusCode} ${bitstreamsRD.errorMessage}`);
      } else if (hasValue(bitstreamsRD.payload)) {
        const current: Bitstream[] = this.bitstreams$.getValue();
        this.bitstreams$.next([...current, ...bitstreamsRD.payload.page]);
        this.isLastPage = this.currentPage === bitstreamsRD.payload.totalPages;
      }
    });
  }
  canDownloadBitstream(bitstream: Bitstream): Observable<boolean> {
    if (!this.bitstreamDownloadStatus.has(bitstream.self)) {
      const downloadStatus$ = this.authorizationService
        .isAuthorized(FeatureID.CanDownload, bitstream.self)
        .pipe(
          tap(response => {
            this.canDownloadPrimaryBitstream = response;
            this.isLoading = false;
            this.loadPdf(bitstream);
          }),
          shareReplay(1), // Ensures we do not create multiple subscriptions
        );

      this.bitstreamDownloadStatus.set(bitstream.self, downloadStatus$);
    }

    return this.bitstreamDownloadStatus.get(bitstream.self)!;
  }

  loadPdf(bitstream: Bitstream) {
    const bitstreamPath = bitstream._links.content.href;

    this.authService.getShortlivedToken().subscribe(token => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
      });
      const params = { 'authentication-token': token };
      this.http.get<ArrayBuffer>(bitstreamPath, {
        headers: headers, params: params,
        responseType: 'arraybuffer' as 'json',
      }).subscribe((ab) => {
        this.pdfSource = {
          data: new Uint8Array(ab),
        };
        this.bitstreamInfoLoaded = true;
        this.cdRef.detectChanges();
      });
    });
  }
}
