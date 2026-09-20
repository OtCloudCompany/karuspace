import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
} from '@angular/router';
import { Observable } from 'rxjs';
import { DSpaceObjectDataService } from 'src/app/core/data/dspace-object-data.service';
import { RemoteData } from 'src/app/core/data/remote-data';
import { DSpaceObject } from 'src/app/core/shared/dspace-object.model';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';

/**
 * Resolves the community, collection or site a usage report's `uuid` route param refers to.
 *
 * Without this, `route.data.dso` is empty on these report pages, so route-aware chrome - most
 * visibly the "Statistics" navbar dropdown - can't tell what the report is scoped to and falls
 * back to the whole repository. That fallback is correct on pages with no container at all (the
 * home page, search, an item), but wrong here: a usage report at `/usage-dashboard/<uuid>` is
 * unambiguously about that one uuid, whatever type of object it turns out to be.
 */
export const reportDsoResolver: ResolveFn<RemoteData<DSpaceObject>> = (
  route: ActivatedRouteSnapshot,
  state,
  dsoService: DSpaceObjectDataService = inject(DSpaceObjectDataService),
): Observable<RemoteData<DSpaceObject>> => {
  return dsoService.findById(route.params.uuid).pipe(
    getFirstCompletedRemoteData(),
  );
};
