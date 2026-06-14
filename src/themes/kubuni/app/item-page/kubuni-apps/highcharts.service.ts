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
        const [
            Highcharts,
            MapModule,
            ExportingModule,
            worldMap,
        ] = await Promise.all([
            import('highcharts'),
            import('highcharts/modules/map'),
            import('highcharts/modules/exporting'),
            import('@highcharts/map-collection/custom/world.geo.json'),
        ]);

        (MapModule as any).default(Highcharts.default);
        (ExportingModule as any).default(Highcharts.default);
        (Highcharts.default as any).maps['custom/world'] = worldMap.default;

        this._highcharts = Highcharts.default;
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