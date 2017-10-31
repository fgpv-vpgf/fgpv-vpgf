import { Observable } from 'rxjs/Rx';
import * as $ from "jquery";
import { MouseEvent, esriMouseEvent } from 'api/event/MouseEvent';
import * as geo from 'api/geometry';
import { seeder } from 'app/app-seed';

/**
 * Provides controls for modifying the map, watching for changes, and to access map layers and UI properties.
 *
 * @example #### Acting on a double click event
 *
 * ```js
 * mapInstance.doubleClick.subscribe(mouseEvent => {
 *  console.log(`Double click at pixel location (${mouseEvent.pageX}, ${mouseEvent.pageY})`);
 * });
 * ```
 */
export default class Map {

    private _center: geo.XY;

    get center() { return this._center }

    /** The main JQuery map element on the host page.  */
    mapDiv: JQuery<HTMLElement>;

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
    * Emits whenever the viewable map boundaries change, usually caused by a change to the viewport or going fullscreen.
    * @event boundsChanged
    */
    boundsChanged: Observable<geo.XYBounds>;

   /** Pans the map to the center point provided. */
   setCenter(xy: geo.XY | geo.XYLiteral): void {
       if(geo.isXYLiteral(xy)) {
           this._center = new geo.XY(xy[0], xy[1]);
       } else {
           this._center = xy;
       }
   }

   /** Returns the position displayed at the center of the map.  */
    //setCenter(xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral) : void;
    //setZoom(zoom: number) : void;
    /** Changes the center of the map to the given XY. If the change is less than both the width and height of the map, the transition will be smoothly animated. */
    //panTo(xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral) : void;
    /** Changes the center of the map by the given distance in pixels. If the distance is less than both the width and height of the map, the transition will be smoothly animated.  */
    //panBy(x: number, y: number) : void;
    //getZoom(): number;
    //getDiv(): HTMLElement;
    //getCenter(): RV.GEOMETRY.XY;
    //getBounds(): RV.GEOMETRY.XYBounds;
    /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
    //fullscreen(enabled: boolean) : void;

    /**
     * Creates a new map inside of the given HTML container, which is typically a DIV element.
    */
    constructor(mapDiv: HTMLElement, rvMap?: Object) {
        this.mapDiv = $(mapDiv);
        initObservables.apply(this);
        console.error(rvMap);
        console.error(gapi);

        if (!rvMap) {
            seeder(this.mapDiv);
        }
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