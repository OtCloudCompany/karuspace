import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Context } from 'src/app/core/shared/context.model';
import { ViewMode } from 'src/app/core/shared/view-mode.model';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { CollectionsComponent } from 'src/app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from 'src/app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from 'src/app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from 'src/app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ItemPageDateFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/date/item-page-date-field.component';
import { GenericItemPageFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { ThemedItemPageTitleFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { ThemedMetadataRepresentationListComponent } from 'src/app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component';
import { DsoEditMenuComponent } from 'src/app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from 'src/app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { listableObjectComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from 'src/app/shared/results-back-button/themed-results-back-button.component';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { ThemedThumbnailComponent } from 'src/app/thumbnail/themed-thumbnail.component';

import { UsageMetricsComponent } from '../../../kubuni-apps/usage-metrics/usage-metrics.component';
import { UsageStatisticsComponent } from 'src/themes/kubuni/app/otcloud-apps/usage-statistics/usage-statistics.component';
import { StripLineBreaksPipe } from '../../../strip-line-breaks.pipe';
import {UntypedItemComponent as BaseComponent } from 'src/app/item-page/simple/item-types/untyped-item/untyped-item.component';

@listableObjectComponent('Presentation', ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-presentation',
  standalone: true,
  imports: [AsyncPipe,
    CollectionsComponent,
    DsoEditMenuComponent,
    GenericItemPageFieldComponent,
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
    UsageStatisticsComponent],
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
})
export class PresentationComponent extends BaseComponent {
  usageReport: UsageReport[] | null;
  reportsLoaded = false;
  onReportLoaded(reportData: UsageReport[]) {
    this.usageReport = reportData;
    this.reportsLoaded = true;
  }
}
