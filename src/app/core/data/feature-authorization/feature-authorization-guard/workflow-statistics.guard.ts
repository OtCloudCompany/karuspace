import { CanActivateFn } from '@angular/router';
import { of } from 'rxjs';

import { FeatureID } from '../feature-id';
import { singleFeatureAuthorizationGuard } from './single-feature-authorization.guard';

/**
 * Prevent unauthorized activating and loading of routes reporting on workflow/submission activity
 * (e.g. staff activity) when the current user isn't allowed to view them.
 *
 * Unlike a hardcoded admin-only guard, this defers to the backend's `canViewWorkflowStatistics`
 * authorization feature, which itself branches on the
 * `usage-statistics.authorization.admin.workflow` setting: administrators only when that setting
 * is enabled (the default), or anyone with READ access to the site when it's disabled.
 */
export const workflowStatisticsGuard: CanActivateFn =
  singleFeatureAuthorizationGuard(() => of(FeatureID.CanViewWorkflowStatistics));
