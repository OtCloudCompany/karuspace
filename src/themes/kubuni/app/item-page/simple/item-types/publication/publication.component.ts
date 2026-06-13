import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';

import { Context } from '../../../../../../../app/core/shared/context.model';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import { CollectionsComponent } from '../../../../../../../app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../../../../../../app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ItemPageDateFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/date/item-page-date-field.component';
import { GenericItemPageFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { GeospatialItemPageFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/geospatial/geospatial-item-page-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { PublicationComponent as BaseComponent } from '../../../../../../../app/item-page/simple/item-types/publication/publication.component';
import { ThemedMetadataRepresentationListComponent } from '../../../../../../../app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from '../../../../../../../app/thumbnail/themed-thumbnail.component';
import { CitationGeneratorComponent } from '../../../kubuni-apps/citation-generator/citation-generator.component';
import { UsageMetricsComponent } from    'src/themes/kubuni/app/otcloud-apps/usage-metrics/usage-metrics.component';
// import { UsageStatisticsComponent } from 'src/themes/kubuni/app/otcloud-apps/usage-statistics/usage-statistics.component'; 
import { StripLineBreaksPipe } from '../../../strip-line-breaks.pipe';

@listableObjectComponent('Publication', ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-publication',
  styleUrls: ['../../../../../../../app/item-page/simple/item-types/publication/publication.component.scss'],
  templateUrl: './publication.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    CitationGeneratorComponent,
    CollectionsComponent,
    GenericItemPageFieldComponent,
    GeospatialItemPageFieldComponent,
    ItemPageDateFieldComponent,
    ItemPageUriFieldComponent,
    MetadataFieldWrapperComponent,
    MiradorViewerComponent,
    RouterLink,
    StripLineBreaksPipe,
    ThemedFileSectionComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedMediaViewerComponent,
    ThemedMetadataRepresentationListComponent,
    ThemedResultsBackButtonComponent,
    ThemedThumbnailComponent,
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
    UsageMetricsComponent,
  ],
})
export class PublicationComponent extends BaseComponent {
  usageReport: UsageReport[] | null;
  reportsLoaded = false;

  onReportLoaded(reportData: UsageReport[]) {
    this.usageReport = reportData;
    this.reportsLoaded = true;
  }
}
