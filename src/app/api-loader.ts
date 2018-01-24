import Map from 'api/map';
import * as GEO from 'api/geometry';
import { Subject } from 'rxjs/Rx';
// import * as $ from "jquery";

const mapInstances: Array<Map> = [];

class RZ {
    /**
     * Emits an instance of the map class whenever a new map is added to the viewer.
     * */
    mapAdded: Subject<Map> = new Subject();
    /** Loads and executes a javascript file from the provided url. */
    loadExtension(url: string): void {
        $.getScript(url);
    }
    /** Returns the map class */
    get Map(): typeof Map { return Map; }
    get mapInstances(): Array<Map> { return mapInstances; }
    /** Contains all geography related classes. */
    get GEO() { return GEO };

    mapById(id: string): Map | undefined {
        return this.mapInstances.find(mi => mi.id === id);
    }
}

const RZInstance = new RZ();
interface EnhancedWindow extends Window {
    RZ: RZ
};

(<EnhancedWindow>window).RZ = (<EnhancedWindow>window).RZ ? (<EnhancedWindow>window).RZ : RZInstance;
RZInstance.mapAdded.subscribe(mapInstance => mapInstances.push(mapInstance));
