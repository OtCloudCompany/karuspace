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

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            this.initHighcharts();
        }
    }

    private async initHighcharts(): Promise<void> {
        // Import the ESM builds, not the default UMD ones: the UMD module bundles
        // (highcharts/modules/*) read Highcharts off `window._Highcharts`, which a
        // bundler never sets, so they throw while initialising. The ESM builds
        // under highcharts/esm import the Highcharts instance themselves and
        // register against it on load, so they must not be applied as functions.
        const [
            Highcharts,
            worldMap,
        ] = await Promise.all([
            import('highcharts/esm/highcharts'),
            import('@highcharts/map-collection/custom/world.geo.json'),
            import('highcharts/esm/modules/map'),
            import('highcharts/esm/modules/exporting'),
        ]);

        const highcharts = (Highcharts as any).default;
        // `maps` is added by the map module, so this has to come after it loads.
        highcharts.maps['custom/world'] = (worldMap as any).default ?? worldMap;

        this._highcharts = highcharts;
    }

    async getHighcharts(): Promise<any> {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        // Wait for initialization if still loading
        if (!this._highcharts) {
            await this.initHighcharts();
        }

        return this._highcharts;
    }
}