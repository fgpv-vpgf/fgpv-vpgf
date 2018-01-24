/**
 *               __
 *              /    \
 *             | STOP |
 *              \ __ /
 *                ||
 *                ||
 *                ||
 *                ||
 *                ||
 *              ~~~~~~~
 * THE CODE HEREIN IS A WORK IN PROGRESS - DO NOT USE, BREAKING CHANGES WILL OCCUR FREQUENTLY.
 * 
 * THIS API IS NOT SUPPORTED.
 */


import { Observable } from 'rxjs/Rx';
// import $ from 'jquery';
import { MouseEvent, esriMouseEvent, MapClickEvent } from 'api/events';
import * as geo from 'api/geometry';
import { seeder } from 'app/app-seed';
import { FgpvConfigSchema as ViewerConfigSchema } from 'api/schema';
import { UI } from 'api/ui';
import { Subject } from 'rxjs/Subject';

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
 * 
 * @example #### Disable identify feature
 * 
 * ```js
 * mapInstance.identify = false;
 * ```
 */
export default class Map {
    private _id: string;
    private _fgpMap: Object;
    private _bounds: geo.XYBounds;
    private _boundsChanged: Observable<geo.XYBounds>;
    private _ui: UI;
    private _allowIdentify = true;

    /** Creates a new map inside of the given HTML container, which is typically a DIV element. */
    constructor(mapDiv: HTMLElement, config?: ViewerConfigSchema | string) {
        this.mapDiv = $(mapDiv);
        this._id = this.mapDiv.attr('id') || '';
        this._ui = new UI(this);

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

    /** Once set, we know the map instance is ready. */
    set fgpMap(fgpMap: Object) {
        this._fgpMap = fgpMap;
        this.setBounds(this.mapI.extent, false);
        initObservables.apply(this);
    }

    set identify(allow: boolean) {
        this._allowIdentify = allow;
    }

    get identify(): boolean {
        return this._allowIdentify;
    }

    /**
     * Changes the map boundaries based on the given extent. Any projection supported by Proj4 can be provided.
     *
     * The `bounds` property cannot be defined with a setter since their types mismatch (Extent vs. XYBounds - a TS issue)
     */
    setBounds(bounds: geo.XYBounds | geo.Extent, propagate: boolean = true): void {
        if (geo.isExtent(bounds)) {
            if (bounds.spatialReference.wkid !== 4326) {
                const weirdExtent = (<any>window).RZ.GAPI.proj.localProjectExtent(bounds, 4326);

                this._bounds = new geo.XYBounds([weirdExtent.x1, weirdExtent.y1], [weirdExtent.x0, weirdExtent.y0]);
            }
        } else {
            this._bounds = bounds;
        }

        if (propagate) {
            this.mapI.setExtent(this.bounds.extent);
        }
    }

    set boundsChanged(observable: Observable<geo.XYBounds>) {
        this._boundsChanged = observable;
        this._boundsChanged.subscribe(xyBounds => {
            this.setBounds(xyBounds, false);
        });
    }

    /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
    fullscreen(enabled: boolean): void {
        this.mapI.fullscreen(enabled);
    }

    /** Triggers the map export screen. */
    export(): void {
        this.mapI.export();
    }

    /** Returns the boundary of the map, similar to extent. */
    get bounds(): geo.XYBounds { return this._bounds; }

    /** Returns the id assigned to the viewer. */
    get id(): string { return this._id; }

    get center(): geo.XY { return this.bounds.center; }

    /** The main JQuery map element on the host page.  */
    mapDiv: JQuery<HTMLElement>;

    /** @ignore */
    _clickSubject: Subject<MapClickEvent> = new Subject();

    /**
     * Emits when a user clicks anywhere on the map.
     *
     * It **does not** emit for clicks on overlaying panels or map controls.
     * @event click
    */
    click: Observable<MapClickEvent>;

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

    /**
    * Emits whenever the viewable map boundaries change, usually caused by panning, zooming, or a change to the viewport size/fullscreen.
    * @event boundsChanged
    */
    get boundsChanged(): Observable<geo.XYBounds> {
        return this._boundsChanged;
    }

    /** Returns the viewer map instance as an `any` type for convenience.  */
    get mapI(): any {
        return (<any>this._fgpMap);
    }

    /** Pans the map to the center point provided. */
    setCenter(xy: geo.XY | geo.XYLiteral): void;
    @geo.XYLiteral
    setCenter(xy: geo.XY): void {
        this.mapI.centerAt(xy.projectToPoint(3978));
    }

    /** Returns the current zoom level applied on the map */
    get zoom(): number {
        return this.mapI.zoomCounter;
    }

    /** Zooms to the level provided. */
   set zoom(to: number) {
        this.mapI.setZoom(to);
   }

   /** Returns the jQuery element of the main viewer.  */
    get div(): JQuery<HTMLElement> {
        return this.mapDiv;
    }

    get ui (): UI {
        return this._ui;
    }
}

function isConfigSchema(config: ViewerConfigSchema | string): config is ViewerConfigSchema {
    return (<ViewerConfigSchema>config).version !== undefined;
}

function initObservables(this: Map) {
    const esriMapElement = this.mapDiv.find('.rv-esri-map')[0];

    this.click = this._clickSubject.asObservable();
    this.doubleClick = Observable.fromEvent(esriMapElement, 'dblclick').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseMove = Observable.fromEvent(esriMapElement, 'mousemove').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseDown = Observable.fromEvent(esriMapElement, 'mousedown').map(evt => new MouseEvent(<esriMouseEvent>evt));
    this.mouseUp = Observable.fromEvent(esriMapElement, 'mouseup').map(evt => new MouseEvent(<esriMouseEvent>evt));
}