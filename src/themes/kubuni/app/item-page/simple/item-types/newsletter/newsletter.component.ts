import { Component } from '@angular/core';
import { Context } from 'src/app/core/shared/context.model';
import { ViewMode } from 'src/app/core/shared/view-mode.model';
import { listableObjectComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object.decorator';

import { UsageMetricsComponent } from '../../../kubuni-apps/usage-metrics/usage-metrics.component';
import { UsageStatisticsComponent } from 'src/themes/kubuni/app/otcloud-apps/usage-statistics/usage-statistics.component'; 
import { StripLineBreaksPipe } from '../../../strip-line-breaks.pipe';
import { PublicationComponent as BaseComponent } from 'src/app/item-page/simple/item-types/publication/publication.component';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { ThemedResultsBackButtonComponent } from "src/app/shared/results-back-button/themed-results-back-button.component";
import { MiradorViewerComponent } from "src/app/item-page/mirador-viewer/mirador-viewer.component";
import { ThemedItemPageTitleFieldComponent } from "src/app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component";
import { TruncatableComponent } from "src/app/shared/truncatable/truncatable.component";
import { TruncatablePartComponent } from "src/app/shared/truncatable/truncatable-part/truncatable-part.component";
import { GenericItemPageFieldComponent } from "src/app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component";
import { CollectionsComponent } from "src/app/item-page/field-components/collections/collections.component";
import { ItemPageUriFieldComponent } from "src/app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component";
import { ThemedMetadataRepresentationListComponent } from "src/app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component";
import { ThemedFileSectionComponent } from "src/app/item-page/simple/field-components/file-section/themed-file-section.component";
import { ItemPageDateFieldComponent } from "src/app/item-page/simple/field-components/specific-field/date/item-page-date-field.component";
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';


@listableObjectComponent('Newsletter', ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-newsletter',
  standalone: true,
  imports: [AsyncPipe, RouterLink, UsageMetricsComponent, TranslateModule, UsageStatisticsComponent, StripLineBreaksPipe, ThemedResultsBackButtonComponent, MiradorViewerComponent, ThemedItemPageTitleFieldComponent, TruncatableComponent, TruncatablePartComponent, GenericItemPageFieldComponent, CollectionsComponent, ItemPageUriFieldComponent, ThemedMetadataRepresentationListComponent, ThemedFileSectionComponent, ItemPageDateFieldComponent],
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss'
})
export class NewsletterComponent extends BaseComponent{
  usageReport: UsageReport[] | null;
    reportsLoaded = false;
    onReportLoaded(reportData: UsageReport[]) {
      this.usageReport = reportData;
      this.reportsLoaded = true;
    }
}
