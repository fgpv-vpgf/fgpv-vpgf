import { Observable } from 'rxjs/Rx';
import $ from 'jquery';
import { MouseEvent, esriMouseEvent } from 'api/event/MouseEvent';
import * as geo from 'api/geometry';
import { seeder } from 'app/app-seed';
import { FgpvConfigSchema } from 'api/schema';

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
    private _id: string;
    private _fgpMap: Object;
    private _bounds: geo.XYBounds;
    private _boundsChanged: Observable<geo.XYBounds>;

    get center(): geo.XY { return this.bounds.center; }

    /**
     * Changes the map boundaries based on the given extent. Any projection supported by Proj4 can be provided.
     *
     * The `bounds` property cannot be defined with a setter since their types mismatch (Extent vs. XYBounds - a TS issue)
     */
    setBounds(bounds: geo.XYBounds | geo.Extent, propagate: boolean = true): void {
        this._bounds = geo.isExtent(bounds) ? new geo.XYBounds(bounds) : bounds;

        if (propagate) {
            console.error('Passing Bounds', this._bounds);
            (<any>this._fgpMap).setExtent(this.bounds.extent);
        }
    }

    /**
     * Returns the boundary of the map, similar to extent
     */
    get bounds(): geo.XYBounds { return this._bounds; }

    get id(): string { return this._id; }

    /**
     * Once set, we know the map instance is ready.
     */
    set fgpMap(fgpMap: Object) {
        this._fgpMap = fgpMap;
        this.setBounds((<any>fgpMap).extent, false);
        initObservables.apply(this);
    }

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
     * @event centerChanged
    */
    centerChanged: Observable<MouseEvent>;

    set boundsChanged(observable: Observable<geo.XYBounds>) {
        this._boundsChanged = observable;
        this._boundsChanged.subscribe(xyBounds => {
            this.setBounds(xyBounds, false);
        });
    }

    /**
    * Emits whenever the viewable map boundaries change, usually caused by panning, zooming, or a change to the viewport size/fullscreen.
    * @event boundsChanged
    */
    get boundsChanged(): Observable<geo.XYBounds> {
        return this._boundsChanged;
    }

   /** Pans the map to the center point provided.
    * @TODO James/Aly to fix - esri throwing `TypeError: a.isWebMercator is not a function`
   */
   setCenter(xy: geo.XY | geo.XYLiteral): void {
        xy = geo.XY.confirm(xy);
        const zoomPoint = (<any>window).RZ.GAPI.proj.Point(xy.x, xy.y, {wkid: 4326});
        (<any>this._fgpMap).centerAt(zoomPoint);
   }

   get zoom(): number {
       return (<any>this._fgpMap).zoomCounter;
   }

   set zoom(to: number) {
        (<any>this._fgpMap).setZoom(to);
   }

    /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
    //fullscreen(enabled: boolean) : void;

    /**
     * Creates a new map inside of the given HTML container, which is typically a DIV element.
    */
    constructor(mapDiv: HTMLElement, config?: FgpvConfigSchema | string) {
        this.mapDiv = $(mapDiv);
        this._id = this.mapDiv.attr('id') || '';

        // config set implies viewer loading via API
        if (config) {
            // type guard for cases where config object is given, store on window for config.service to find
            if (isConfigSchema(config)) {
                (<any>window)[`rzConfig${this._id}`] = config;
                this.mapDiv.attr('rv-config', `rzConfig${this._id}`);
            } else {
                this.mapDiv.attr('rv-config', config);
            }

            // startup the map
            seeder(mapDiv);
            this.mapDiv.attr('is', 'rv-map'); // needed for css styling issues
        }
    }
}

function isConfigSchema(config: FgpvConfigSchema | string): config is FgpvConfigSchema {
    return (<FgpvConfigSchema>config).version !== undefined;
}

function initObservables(this: Map) {
    const esriMapElement = this.mapDiv.find('.rv-esri-map')[0];

    this.click = Observable.fromEvent(esriMapElement, 'click').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.doubleClick = Observable.fromEvent(esriMapElement, 'dblclick').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseMove = Observable.fromEvent(esriMapElement, 'mousemove').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseDown = Observable.fromEvent(esriMapElement, 'mousedown').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseUp = Observable.fromEvent(esriMapElement, 'mouseup').map(evt => new MouseEvent(<esriMouseEvent>evt));
}