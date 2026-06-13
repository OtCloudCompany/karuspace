import {
  NgFor,
  NgIf,
} from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  filter,
  map,
  Observable,
  Subscription,
  switchMap,
} from 'rxjs';
import { DSpaceObjectType } from 'src/app/core/shared/dspace-object-type.model';
import { getFirstSucceededRemoteDataPayload } from 'src/app/core/shared/operators';
import { SearchService } from 'src/app/shared/search/search.service'; 
import { SearchConfigurationService } from 'src/app/shared/search/search-configuration.service';
import { hasValue } from '@dspace/shared/utils/empty.util';
import { ThemedLoadingComponent } from 'src/app/shared/loading/themed-loading.component';
import { FacetValue } from '@dspace/core/shared/search/models/facet-value.model'; 
import { PaginatedSearchOptions } from '@dspace/core/shared/search/models/paginated-search-options.model';
import { SearchFilterConfig } from '@dspace/core/shared/search/models/search-filter-config.model';

import { KubuniFacetValue } from '../../shared/facetValue.model';

@Component({
  selector: 'ds-repository-summaries',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ThemedLoadingComponent,
  ],
  templateUrl: './repository-summaries.component.html',
  styleUrl: './repository-summaries.component.scss',
})
export class RepositorySummariesComponent implements OnInit, OnDestroy {

  filterConfig: SearchFilterConfig;
  public scope$: Observable<string>;
  isLoading = true;
  facetMessage = 'Loading entities';
  facetValues: KubuniFacetValue[] = [];
  private subscription: Subscription;
  private readonly ALLOWED_ENTITIES = ['Thesis', 'Person', 'Publication'];

  constructor(
    private searchService: SearchService,
    private searchConfigurationService: SearchConfigurationService,
  ) { }

  ngOnInit(): void {
    this.scope$ = this.searchConfigurationService.getCurrentScope('');
    this.subscription = this.searchConfigurationService.getConfig('', 'default').pipe(
      getFirstSucceededRemoteDataPayload(),
      map(configs => configs.find(cfg => cfg.name === 'entityType')),
      filter(cfg => !!cfg),
      switchMap(searchFilterConfig =>
        this.scope$.pipe(
          switchMap(scope => {
            const searchOptions = new PaginatedSearchOptions({
              configuration: 'default',
              scope: scope,
              dsoTypes: [DSpaceObjectType.ITEM],
            });
            return this.searchService.getFacetValuesFor(searchFilterConfig, 1, searchOptions, null, true);
          }),
        ),
      ),
    ).subscribe(facetValues => {
      this.isLoading = false;
      this.facetValues = []; // Clear existing values to prevent duplicates

      if (facetValues.hasCompleted) {
        if (hasValue(facetValues.payload)) {
          facetValues.payload.page.forEach((facetValue: FacetValue) => {
            if (this.ALLOWED_ENTITIES.includes(facetValue.label)) {
              // Correctly instantiate KubuniFacetValue
              const kubuniFacetValue = Object.assign(new KubuniFacetValue(), facetValue);
              this.facetValues.push(kubuniFacetValue);
            }
          });
        } else {
          this.facetMessage = 'No entities found';
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
