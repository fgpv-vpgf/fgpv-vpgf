import { Observable } from 'rxjs/Rx';
import * as $ from "jquery";
import { MouseEvent, esriMouseEvent } from 'api/event/MouseEvent';

export default class Map {
    /** The main JQuery map element on the host page.  */
    mapDiv: JQuery<HTMLElement>;

    private opts: Object | JSON | string;

    /**
     * Emits when a user clicks anywhere on the map.
     *
     * It **does not** emit for clicks on overlaying panels or map controls.
     * @event click
    */
    click: Observable<MouseEvent>;

    /**
     * Emits when a user double clicks anywhere on the map.
     *
     * It **does not** emit for double clicks on overlaying panels or map controls.
     * @event doubleClick
    */
    doubleClick: Observable<MouseEvent>;

    /**
     * Emits whenever a users mouse moves over the map.
     *
     * It **does not** emit for mouse movements over overlaying panels or map controls.
     *
     * This observable emits a considerable amount of data, be mindful of performance implications.
     * @event mouseMove
    */
    mouseMove: Observable<MouseEvent>;

    /**
     * Emits whenever a user left clicks down.
     *
     * It **does not** emit for down left clicks on overlaying panels or map controls.
     * @event mouseDown
    */
    mouseDown: Observable<MouseEvent>;

    /**
     * Emits whenever a user lifts a previous down left click.
     *
     * It **does not** emit for mouse lifts over overlaying panels or map controls.
     * @event mouseUp
    */
    mouseUp: Observable<MouseEvent>;

    /**
     * Emits whenever the map zoom level changes.
     * @event zoomChanged
    */
    zoomChanged: Observable<number>;

    /**
     * Emits whenever the map center has changed.
     *
     * @todo does not yet work when panning with your mouse. Either hook into ESRI event or confer a center change if there is a mouse down and movement. TBD
     * @event centerChanged
    */
    centerChanged: Observable<MouseEvent>;

    /**
     * Creates a new map inside of the given HTML node.
     *
     * @param mapDiv DOM node to contain the map, usually a div node but not strictly required
     * @param opts a schema valid map config snippet if opts is in an Object or JSON format
     */
    constructor(mapDiv: HTMLElement, opts?: Object | JSON) {
        this.mapDiv = $(mapDiv);
        this.opts = opts || {};

        initObservables.apply(this);
    }
}

function initObservables(this: Map) {
    const esriMapElement = this.mapDiv.find('.rv-esri-map')[0];

    this.click = Observable.fromEvent(esriMapElement, 'click').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.doubleClick = Observable.fromEvent(esriMapElement, 'dblclick').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseMove = Observable.fromEvent(esriMapElement, 'mousemove').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseDown = Observable.fromEvent(esriMapElement, 'mousedown').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseUp = Observable.fromEvent(esriMapElement, 'mouseup').map(evt => new MouseEvent(<esriMouseEvent>evt));
}