import Map from 'api/map';
import * as EVENT from 'api/event';


class RZ {
    get EVENT() { return EVENT; };
    get Map() { return Map; }
}

(<any>window).RZ = (<any>window).RZ ? (<any>window).RZ : new RZ();