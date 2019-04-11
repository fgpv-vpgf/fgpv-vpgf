import { skip } from 'rxjs/internal/operators/skip';

const dataLayer = window.RAMP.gtmDL;

export default function(api) {
    if (!dataLayer) {
        return;
    }
    api.boundsChanged.pipe(skip(1)).subscribe(() => {
        dataLayer.push({
            event: 'extentChanged',
            category: 'map',
            action: 'interaction',
            label: 'extentChanged'
        });
    });

    api.ui.basemaps.click.subscribe(() => {
        dataLayer.push({
            event: 'basemapChanged',
            category: 'map',
            action: 'basemapChanged'
        });
    });
}
