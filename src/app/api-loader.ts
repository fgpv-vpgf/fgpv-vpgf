import Map from 'api/map';
import * as EVENT from 'api/event';
import { Subject } from 'rxjs/Rx';
import * as $ from "jquery";

class RZ {
    /** Emits an instance of the map class whenever a new map is added to the viewer. */
    map_added = new Subject();
    /** Loads and executes a javascript file from the provided url. */
    loadExtension(url: string): void {
        $.getScript(url);
    }
    /** Returns the map class */
    get Map(): typeof Map { return Map; }
}

(<any>window).RZ = (<any>window).RZ ? (<any>window).RZ : new RZ();
