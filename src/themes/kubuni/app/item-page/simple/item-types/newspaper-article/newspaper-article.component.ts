import { Component } from '@angular/core';
import { ItemPageNavbarComponent } from 'src/themes/kubuni/app/otcloud-apps/item-page-navbar/item-page-navbar.component';
import { UsageStatisticsComponent } from 'src/themes/kubuni/app/otcloud-apps/usage-statistics/usage-statistics.component'; 
import { UntypedItemComponent as BaseComponent } from 'src/app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { listableObjectComponent } from 'src/app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { Item } from '@dspace/core/shared/item.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { Context } from '@dspace/core/shared/context.model';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StripLineBreaksPipe } from 'src/themes/kubuni/app/otcloud-apps/strip-line-breaks.pipe';
import { ResultsBackButtonComponent } from 'src/app/shared/results-back-button/results-back-button.component';
import { MiradorViewerComponent } from 'src/app/item-page/mirador-viewer/mirador-viewer.component';
import { DsoEditMenuComponent } from 'src/app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { GenericItemPageFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { ItemPageUriFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { MetadataRepresentationListComponent } from '../../metadata-representation-list/metadata-representation-list.component';
import { ThemedItemPageTitleFieldComponent } from "src/app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component";
import { ThemedResultsBackButtonComponent } from "src/app/shared/results-back-button/themed-results-back-button.component";
import { CollectionsComponent } from "src/app/item-page/field-components/collections/collections.component";
import { ThemedMetadataRepresentationListComponent } from "src/app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component";
import { ItemPageDateFieldComponent } from "src/app/item-page/simple/field-components/specific-field/date/item-page-date-field.component";
import { ThemedFileSectionComponent } from "src/app/item-page/simple/field-components/file-section/themed-file-section.component";
import { UsageMetricsComponent } from    'src/themes/kubuni/app/otcloud-apps/usage-metrics/usage-metrics.component';
import { UsageReport } from '@dspace/core/statistics/models/usage-report.model';

@listableObjectComponent(Item, ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-newspaper-article',
  standalone: true,
  imports: [UsageMetricsComponent, UsageStatisticsComponent,
    ItemPageNavbarComponent, StripLineBreaksPipe,
    GenericItemPageFieldComponent, MetadataRepresentationListComponent,
    ItemPageUriFieldComponent,
    ResultsBackButtonComponent,
    AsyncPipe, RouterLink, TranslateModule, MiradorViewerComponent,
    DsoEditMenuComponent, TruncatableComponent, TruncatablePartComponent, ThemedItemPageTitleFieldComponent, ThemedResultsBackButtonComponent, CollectionsComponent, ThemedMetadataRepresentationListComponent, ItemPageDateFieldComponent, ThemedFileSectionComponent],
  templateUrl: './newspaper-article.component.html',
  styleUrl: './newspaper-article.component.scss'
})
export class NewspaperArticleComponent extends BaseComponent {
  usageReport: UsageReport[] | null;
  reportsLoaded = false;
  
    onReportLoaded(reportData: UsageReport[]) {
      this.usageReport = reportData;
      this.reportsLoaded = true;
    }

}
