import { isPlatformBrowser } from '@angular/common';
import {
    Inject,
    Injectable,
    PLATFORM_ID,
} from '@angular/core';
// Import world map data
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import * as Highcharts from 'highcharts';
import * as ExportingModule from 'highcharts/modules/exporting';
import * as MapModule from 'highcharts/modules/map';

@Injectable({
    providedIn: 'root',
})
export class HighchartsService {
    Highcharts: any = Highcharts;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            // Initialize the modules
            const loadMap = (MapModule as any)?.default || MapModule;
            const loadExporting = (ExportingModule as any)?.default || ExportingModule;
            
            if (typeof loadMap === 'function') {
                loadMap(Highcharts);
            }
            if (typeof loadExporting === 'function') {
                loadExporting(Highcharts);
            }
            // Add map data to Highcharts
            Highcharts.maps['custom/world'] = worldMap;
        }
    }

    getHighcharts(): any {
        return this.Highcharts;
    }

}