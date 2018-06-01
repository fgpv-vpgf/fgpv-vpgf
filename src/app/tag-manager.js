import { skip } from 'rxjs/operators';

const dataLayer = window.RZ.gtmDL;


export default function(api) {
    api.boundsChanged.pipe(skip(1)).subscribe(() => {
        dataLayer.push({
            event : 'extentChanged',
            category : 'map',
            action : 'interaction',
            label : 'extentChanged'
        });
    });

    api.ui.basemaps.click.subscribe(() => {
        dataLayer.push({
            event : 'basemapChanged',
            category : 'map',
            action : 'basemapChanged'
        });
    });
}