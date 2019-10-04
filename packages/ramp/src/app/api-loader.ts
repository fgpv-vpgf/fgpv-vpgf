import Map from 'api/map';
import * as GEO from 'api/geometry';
import { ConfigLayer, SimpleLayer } from 'api/layers';
import { Subject } from 'rxjs';
import * as $ from "jquery";

const mapInstances: Array<Map> = [];

class RAMP {
    /**
     * Emits an instance of the map class whenever a new map is added to the viewer.
     * */
    mapAdded: Subject<Map> = new Subject();

    // Google tag manager dataLayer
    gtmDL: Array<any> = (<any>window).dataLayer;

    /** Loads and executes a javascript file from the provided url. */
    loadExtension(url: string): void {
        $.getScript(url);
    }
    /** Returns the map class */
    get Map(): typeof Map { return Map; }
    get mapInstances(): Array<Map> { return mapInstances; }
    /** Contains all geography related classes. */
    get GEO() { return GEO };

    /** Returns the different layer classes */
    get LAYERS(): Object {
        return {
            ConfigLayer,
            SimpleLayer
        }
    }

    mapById(id: string): Map | undefined {
        return this.mapInstances.find(mi => mi.id === id);
    }
}

const RAMPInstance = new RAMP();
interface EnhancedWindow extends Window {
    RAMP: RAMP
};

(<EnhancedWindow>window).RAMP = (<EnhancedWindow>window).RAMP ? (<EnhancedWindow>window).RAMP : RAMPInstance;

RAMPInstance.mapAdded.subscribe(mapInstance => {
    let index: number = mapInstances.findIndex(map => map.id === mapInstance.id);

    if (index !== -1) {
        mapInstances[index] = mapInstance;
    } else {
        mapInstances.push(mapInstance);
    }
});

(<any>jQuery).expr.filters.offscreen = function(el: any) {
    const elem = <any>jQuery(el);
    const position = elem.position();
    const rvShell = <any>jQuery('rv-shell').first();

    return (
        (position.left + <any>elem.width()) > (rvShell.width()) ||
        (position.left + <any>elem.width()) < 0 ||
        (position.top + <any>elem.height()) > (rvShell.height()) ||
        (position.top + <any>elem.height()) < 0
           );
  };