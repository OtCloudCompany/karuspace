import { AsyncPipe, NgFor } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CommunityDataService } from 'src/app/core/data/community-data.service';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Community } from 'src/app/core/shared/community.model';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { VarDirective } from '../../../../../app/shared/utils/var.directive';
import { Slide } from './slide.model';
import { ThemedTopLevelCommunityListComponent } from 'src/app/home-page/top-level-community-list/themed-top-level-community-list.component';

@Component({
  selector: 'ds-themed-top-level-community-list',
  // styleUrls: ['./top-level-community-list.component.scss'],
  styleUrls: ['../../../../../app/home-page/top-level-community-list/top-level-community-list.component.scss'],
  templateUrl: './top-level-community-list.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    ErrorComponent,
    NgbCarouselModule,
    NgFor,
    ThemedLoadingComponent,
    ThemedTopLevelCommunityListComponent,
    TranslateModule,
    VarDirective,
  ],
})
export class TopLevelCommunityListComponent extends BaseComponent implements OnInit {
  slides: Slide[] = [];
  groupedSlides: Slide[][] = [];
  communitiesList: Community[];
  data: {name: string, y: number}[] = [];
  collectionImages = {

    '94750be5-9eee-41e2-874c-f4e768cfea9e': 'archives',
    '2d01594e-fcaa-415b-9068-ae540846f20f': 'bookstack',
    '2052064b-f7f3-4866-9d01-32b912da6959': 'typing',
    '3ce96388-1de6-4507-ad0d-42d6f4508130': 'phd-thesis',
    '43655813-d0bd-40ed-9118-7653e07ac4f3': 'graduation',
    '387523ac-a16d-454f-b872-b0a7c4f4dfd0': 'master-thesis',
    'faf65a1b-623d-49f7-ac7d-8ae651df7e19': 'research',
    '3ca019a9-c080-4e02-ab71-2fdd0df1d8d2': 'scholar-profiles',
    '3515b0b9-c4ad-48c1-9e97-081150d9cf44': 'education',
    '2f41049d-1a3f-41f4-b288-fe09ce102e9c': 'multimedia',
  };

  constructor(
    @Inject(APP_CONFIG) appConfig: AppConfig, cds: CommunityDataService, paginationService: PaginationService,
  ) {
    super(appConfig, cds, paginationService);
  }
  ngOnInit() {
    super.ngOnInit();
    this.communitiesRD$.subscribe(( (dataFetched) =>{

      if ( dataFetched.hasSucceeded ){
        this.communitiesList = dataFetched.payload.page;
        this.communitiesList.forEach((community: Community, num)=>{
          const itemsCount = Number(community.archivedItemsCount);
          const communityId = community.id;
          const communityName = community.metadata['dc.title'][0].value;

          this.slides.push({
            index: Number(num + 1),
            itemsNumber: itemsCount,
            name: communityName,
            collectionUrl: communityId,
            icon: this.collectionImages[communityId],
          },
          );
        });
        this.groupSlides();
      }
    }));
  }

  groupSlides(): void {
    this.groupedSlides = [];
    for (let i = 0; i < this.slides.length; i += 4) {
      this.groupedSlides.push(this.slides.slice(i, i + 4));
    }
  }
}
