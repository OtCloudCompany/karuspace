import { isPlatformBrowser } from '@angular/common';
import {
    Inject,
    Injectable,
    PLATFORM_ID,
} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class HighchartsService {
    private _highcharts: any = null;
    private _loading: Promise<any> | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            // Kick off loading early, but ignore failures here: getHighcharts() is
            // where callers observe the result.
            this.load().catch(() => undefined);
        }
    }

    async getHighcharts(): Promise<any> {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        return this.load();
    }

    /**
     * Loads Highcharts and its modules once, reusing the in-flight promise for
     * concurrent callers.
     */
    private load(): Promise<any> {
        if (this._highcharts) {
            return Promise.resolve(this._highcharts);
        }
        if (!this._loading) {
            this._loading = this.initHighcharts();
        }
        return this._loading;
    }

    private async initHighcharts(): Promise<any> {
        // Import the ESM builds, not the default UMD ones: the UMD module bundles
        // (highcharts/modules/*) read Highcharts off `window._Highcharts`, which a
        // bundler never sets, so they throw while initialising. The ESM builds
        // under highcharts/esm import the Highcharts instance themselves and
        // register against it on load, so they must not be applied as functions.
        const [Highcharts, worldMap] = await Promise.all([
            import('highcharts/esm/highcharts'),
            import('@highcharts/map-collection/custom/world.geo.json'),
            import('highcharts/esm/modules/map'),
            import('highcharts/esm/modules/exporting'),
        ]);

        const highcharts = (Highcharts as any).default;
        // `maps` is added by the map module, so this has to come after it loads.
        highcharts.maps['custom/world'] = (worldMap as any).default ?? worldMap;

        this._highcharts = highcharts;
        return highcharts;
    }
}
