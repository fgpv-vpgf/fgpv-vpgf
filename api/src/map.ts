import { Observable } from 'rxjs/Rx';
import * as $ from "jquery";
import MouseEvent from 'api/event/MouseEvent';

export default class Map {
    mapDiv: JQuery<HTMLElement>;
    opts: Object | JSON | string;
    private _clickObs: Observable<{}>;

    /**
     * Creates a new map inside of the given HTML container, which is typically a DIV element. If opts is a string then it is considered to be
     * a url to a json config snippet of a map.
    */
    constructor(mapDiv: HTMLElement, opts?: Object | JSON | string) {
        this.mapDiv = $(mapDiv);
        this.opts = opts || {};

        this._clickObs = Observable
            .fromEvent(this.mapDiv.find('.rv-esri-map')[0], 'click').map(evt => 1);
    }

    /**
     * This event is fired when the user clicks on the map, but does not fire for clicks on panels or other map controls.
     * @event click
     * @property {Event.MouseEvent} event
    */
    get click() { return this._clickObs; }
}
