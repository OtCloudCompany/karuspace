import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ThemedHomeNewsComponent } from '../../../../app/home-page/home-news/themed-home-news.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { RecentItemListComponent } from '../../../../app/home-page/recent-item-list/recent-item-list.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../../../../app/search-page/themed-configuration-search-page.component';
import { RepositorySummariesComponent } from './repository-summaries/repository-summaries.component';

@Component({
  selector: 'ds-themed-home-page',
  styleUrls: ['../../../../app/home-page/home-page.component.scss'],
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RecentItemListComponent,
    RepositorySummariesComponent,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    ThemedHomeNewsComponent,
    TranslateModule,
  ],
})
export class HomePageComponent extends BaseComponent {
}
