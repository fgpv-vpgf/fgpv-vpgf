import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import $ from 'jquery';
import { MouseEvent, esriMouseEvent, MapClickEvent } from 'api/events';
import * as geo from 'api/geometry';
import { seeder } from 'app/app-seed';
import { FgpvConfigSchema as ViewerConfigSchema } from 'api/schema';
import { UI } from 'api/ui';
import { PanelRegistry } from 'api/panel-registry';
import { LayerGroup, SimpleLayer } from 'api/layers';
import { Panel, ClosingResponse } from 'api/panel';

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
export class Map {
    /**Creates a new map inside of the given HTML container, which is typically a DIV element.*/
    constructor(mapDiv: HTMLElement, config?: ViewerConfigSchema | string) {
        this.mapDiv = $(mapDiv);
        this.identifier = this.mapDiv.attr('id') || '';
        this.uiObj = new UI(this);
        this.layersObj = new LayerGroup(this);
        this.layersObj = new LayerGroup(this);

        this.panelRegistryObj = new PanelRegistry(this);
        this.panelRegistryObj._init();

        // config set implies viewer loading via API
        if (config) {
            // type guard for cases where config object is given, store on window for config.service to find
            if (isConfigSchema(config)) {
                (<any>window)[`rampConfig${this.identifier}`] = config;
                this.mapDiv.attr('rv-config', `rampConfig${this.identifier}`);
            } else {
                this.mapDiv.attr('rv-config', config);
            }
            // startup the map
            seeder(mapDiv);
            this.mapDiv.attr('is', 'rv-map'); // needed for css styling issues
        }
    }

    get layers(): LayerGroup {
        return this.layersObj;
    }

    /**
     * Returns the inner shell (rv-inner-shell) of this Map instance (this is where Panels reside on the Map)
     * @return {HTMLElement} - rv-inner-shell div.
     */
    get innerShell(): HTMLElement {
        let mapDiv = <HTMLElement>document.getElementById(this.identifier);
        let innerShell = mapDiv.getElementsByClassName('rv-inner-shell')[0];
        return <HTMLElement>innerShell;
    }

    /** Once set, we know the map instance is ready. */
    set fgpMap(fgpMap: Object) {
        this.fgpMapObj = fgpMap;
        this.setBounds(this.mapI.extent, false);
        initObservables.apply(this);
    }

    get simpleLayer(): SimpleLayer {
        return this.simpleLayerObj;
    }

    /**
     * Changes the map boundaries based on the given extent. Any projection supported by Proj4 can be provided.
     *
     * The `bounds` property cannot be defined with a setter since their types mismatch (Extent vs. XYBounds - a TS issue)
     */
    setBounds(bounds: geo.XYBounds | geo.Extent, propagate: boolean = true): void {
        if (geo.isExtent(bounds)) {
            if (bounds.spatialReference.wkid !== 4326) {
                const weirdExtent = (<any>window).RAMP.GAPI.proj.localProjectExtent(bounds, 4326);

                this.boundsObj = new geo.XYBounds([weirdExtent.x1, weirdExtent.y1], [weirdExtent.x0, weirdExtent.y0]);
            }
        } else {
            this.boundsObj = bounds;
        }

        if (propagate) {
            this.mapI.setExtent(this.bounds.extent);
        }
    }

    set boundsChanged(observable: Observable<geo.XYBounds>) {
        this.boundsChangedObj = observable;
        this.boundsChangedObj.subscribe(xyBounds => {
            this.setBounds(xyBounds, false);
        });
    }

    /**
     * Performs an identify operation similar to clicking on the map at the provided xy coordinates.
     *
     * @example
     *
     * ```js
     * // perform an identify on Toronto, ON
     * RAMP.mapInstances[0].identify([-79.347015, 42.651070]);
     * ```
     *
     */
    @geo.XYLiteral
    identify(xy: geo.XY) {
        this._identify(xy);
    }

    /**
     * Returns the map extent in the native projection (using ESRI JSON format).
     * Note: the extent will not be modified.
     */
    getExtent(): any {
        return this.mapI.extent;
    }

    /**
     * Sets the extent of the map. The extent must be in the same spatial reference as the map.
     * Note: the extent will not be modified.
     *
     * The `extent` property must be provided using standard ESRI JSON format.
     * The `fit` property is optional (defaults to false). If true, for maps containing tile layers the input extent always shown completely on the map.
     */
    setExtent(extent: geo.Extent, fit: boolean = false) {
        this.mapI.setExtent((<any>window).RAMP.GAPI.Map.getExtentFromJson(extent), fit);
    }

    /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
    fullscreen(enabled: boolean): void {
        this.mapI.fullscreen(enabled);
    }

    /** Triggers the map export screen. */
    export(): void {
        this.mapI.export();
    }

    /** Expose export generators to allow export plugins to call them. */
    get exportGenerators(): Object {
        return this.mapI.exportGenerators;
    }

    /** Triggers the map help screen. */
    help(): void {
        this.mapI.help();
    }

    /** Returns the boundary of the map, similar to extent. */
    get bounds(): geo.XYBounds {
        return this.boundsObj;
    }

    /** Returns the id assigned to the viewer. */
    get id(): string {
        return this.identifier;
    }

    get center(): geo.XY {
        return this.bounds.center;
    }

    /** The main JQuery map element on the host page.  */
    mapDiv: JQuery<HTMLElement>;

    /** @ignore */
    _clickSubject: Subject<MapClickEvent> = new Subject();

    /**
     * Emits when a user clicks anywhere on the map or when an identify operation is performed. This includes identify requests made via the API method `identify`.
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
        return this.boundsChangedObj;
    }

    /** Returns the viewer map instance as an `any` type for convenience.  */
    get mapI(): any {
        return <any>this.fgpMapObj;
    }

    /** Pans the map to the center point provided. */
    setCenter(xy: geo.XY | geo.XYLiteral): void;
    @geo.XYLiteral
    setCenter(xy: geo.XY): void {
        this.mapI.centerAt(xy.projectToPoint(this.mapI.spatialReference.wkid));
    }

    /** Returns the current zoom level applied on the map */
    get zoom(): number {
        return this.mapI.getLevel();
    }

    /** Zooms to the level provided. */
    set zoom(to: number) {
        this.mapI.setZoom(to);
    }

    /** Returns the jQuery element of the main viewer.  */
    get div(): JQuery<HTMLElement> {
        return this.mapDiv;
    }

    get ui(): UI {
        return this.uiObj;
    }

    get panels(): PanelRegistry {
        return this.panelRegistryObj;
    }

    // use of the following property is unsupported by ramp team.
    // it is provided for plugin developers who want to write advanced geo functions
    // and wish to directly consume the esri api objects AT THEIR OWN RISK !!!  :'O  !!!
    get esriMap() {
        return this.mapI.esriMap;
    }
}

//Map objects prototype
export interface Map {
    identifier: string;
    fgpMapObj: Object;
    boundsObj: geo.XYBounds;
    boundsChangedObj: Observable<geo.XYBounds>;
    extentChanged: Observable<any>; // add this to avoid issues with projection changes see https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2547
    filterChanged: Observable<any>;
    uiObj: UI;
    panelRegistryObj: PanelRegistry;
    layersObj: LayerGroup;
    simpleLayerObj: SimpleLayer;
    $compile: any;

    Panel: Panel;

    /**
     * @ignore
     */
    _identify: any;
    /**
     * @ignore
     */
    _panels: Panel[];
    /**
     * @ignore
     */
    _panelOpened: Subject<Panel>;
    /**
     * @ignore
     */
    _panelClosed: Subject<ClosingResponse>;
}

export default Map;

function isConfigSchema(config: ViewerConfigSchema | string): config is ViewerConfigSchema {
    return (<ViewerConfigSchema>config).version !== undefined;
}

function initObservables(this: Map) {
    const esriMapElement = this.mapDiv.find('.rv-esri-map')[0];
    this.click = this._clickSubject.asObservable();

    this.doubleClick = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'dblclick').pipe(
        map(evt => new MouseEvent(evt, this))
    );
    this.mouseMove = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mousemove').pipe(
        map((evt: esriMouseEvent) => new MouseEvent(evt, this)),
        distinctUntilChanged((x, y) => x.equals(y))
    );
    this.mouseDown = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mousedown').pipe(
        map(evt => new MouseEvent(evt, this))
    );
    this.mouseUp = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mouseup').pipe(
        map(evt => new MouseEvent(evt, this))
    );
}
