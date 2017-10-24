import Map from 'api/Map';
import { Subject } from 'rxjs/Rx';
import * as $ from "jquery";

const mapInstances: Array<Map> = [];

class RZ {
    /** Emits an instance of the map class whenever a new map is added to the viewer. */
    map_added = new Subject();
    /** Loads and executes a javascript file from the provided url. */
    loadExtension(url: string): void {
        $.getScript(url);
    }
    /** Returns the map class */
    get Map(): typeof Map { return Map; }
    get mapInstances(): Array<Map> { return mapInstances; }
}

const RZInstance = new RZ();
interface EnhancedWindow extends Window {
    RZ: RZ
};

(<EnhancedWindow>window).RZ = (<EnhancedWindow>window).RZ ? (<EnhancedWindow>window).RZ : RZInstance;
RZInstance.map_added.subscribe(mi => mapInstances.push(mi));
