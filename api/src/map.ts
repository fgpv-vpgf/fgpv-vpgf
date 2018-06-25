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

import { Observable, Subject, fromEvent } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import $ from 'jquery';
import { MouseEvent, esriMouseEvent, MapClickEvent } from 'api/events';
import * as geo from 'api/geometry';
import { seeder } from 'app/app-seed';
import { FgpvConfigSchema as ViewerConfigSchema } from 'api/schema';
import { UI } from 'api/ui';
import { LayerGroup, SimpleLayer } from 'api/layers';
import { Panel } from 'api/panel';

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
    private _layers: LayerGroup;
    private _simpleLayer: SimpleLayer;
    private _legendStructure: LegendStructure;
    private _panel_registry: Panel[];

    /**Creates a new map inside of the given HTML container, which is typically a DIV element.*/
    constructor(mapDiv: HTMLElement, config?: ViewerConfigSchema | string) {
        this.mapDiv = $(mapDiv);
        this._id = this.mapDiv.attr('id') || '';
        this._ui = new UI(this);
        this._layers = new LayerGroup(this);
        this._panel_registry = [];
        this._layers = new LayerGroup(this);

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

    get layers(): LayerGroup {
        return this._layers;
    }

    /**
     * Returns the inner shell (rv-inner-shell) of this Map instance (this is where Panels reside on the Map)
     * @return {HTMLElement} - rv-inner-shell div.
     */
    get innerShell(): HTMLElement {
        let mapDiv = <HTMLElement>document.getElementById(this._id);
        let innerShell = mapDiv.getElementsByClassName('rv-inner-shell')[0];
        console.log(innerShell);
        return <HTMLElement>innerShell;
    }

    /**
     * Returns the list of Panels on this map instance.
     * @return {Panel[]} - the list of Panels on this Map instance.
     */
    get panelRegistry() {
        return this._panel_registry;
    }

    /**
     * Creates a Panel on this Map instance.
     * @param {string} id - the ID of the panel to be created
     * @return {Panel} - the Panel that was created
     */
    createPanel(id: string): Panel {
        let panel = new Panel(id, this);
        this.panelRegistry.push(panel);
        return panel;
    }

    /**
     * Deletes a Panel on this Map instance.
     * @param {string} id - the ID of the panel to be deleted
     */
    deletePanel(id: string) {
        $("#" + id).remove();
        for (let panel of this.panelRegistry) {
            let index;
            if (panel.id === id) {
                index = this._panel_registry.indexOf(panel);
                this._panel_registry.splice(index, 1);
            }
        }
    }

    /**
     * Returns the specified Panel on this Map instance.
     * @param id
     */
    getPanel(id: string) {
        let retPanel;
        for (let panel of this.panelRegistry) {
            let index;
            if (panel.id === id) {
                retPanel = panel;
            }
        }
        return retPanel;
    }


    /** Once set, we know the map instance is ready. */
    set fgpMap(fgpMap: Object) {
        this._fgpMap = fgpMap;
        this.setBounds(this.mapI.extent, false);
        initObservables.apply(this);
    }

    /** Returns the current structured legend JSON. If auto legend, returns undefined */
    get legendConfig(): Array<JSON> | undefined {
        if (this._legendStructure.type === 'structured') {  // use constant
            return this._legendStructure.JSON.root.children;
        }
    }

    /**
     * Sets a new structured legend JSON snippet that updates the legend.
     *
     * TODO: If the legend was previously auto, replace it with a structured legend.
     */
    set legendConfig(value: Array<JSON> | undefined) {
        if (value) {
            const structure = this._legendStructure.JSON;
            if (this._legendStructure.type === 'structured') {    // use constant
                structure.root.children = value;
                this.mapI.setLegendConfig(structure);
            }
        }
    }

    get simpleLayer(): SimpleLayer {
        return this._simpleLayer;
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
    get bounds(): geo.XYBounds {
        return this._bounds;
    }

    /** Returns the id assigned to the viewer. */
    get id(): string {
        return this._id;
    }

    get center(): geo.XY {
        return this.bounds.center;
    }

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
        return <any>this._fgpMap;
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
        return this._ui;
    }
}

function isConfigSchema(config: ViewerConfigSchema | string): config is ViewerConfigSchema {
    return (<ViewerConfigSchema>config).version !== undefined;
}

function initObservables(this: Map) {
    const esriMapElement = this.mapDiv.find('.rv-esri-map')[0];
    this.click = this._clickSubject.asObservable();

    this.doubleClick = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'dblclick').pipe(map((evt) => new MouseEvent(evt, this)));
    this.mouseMove = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mousemove').pipe(
        map((evt: esriMouseEvent) => new MouseEvent(evt, this)),
        distinctUntilChanged((x, y) => x.equals(y))
    );
    this.mouseDown = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mousedown').pipe(map((evt) => new MouseEvent(evt, this)));
    this.mouseUp = fromEvent<MouseEvent | esriMouseEvent>(esriMapElement, 'mouseup').pipe(map((evt) => new MouseEvent(evt, this)));
}

interface LegendStructure {
    type: string;
    JSON: LegendJSON;
}

interface LegendJSON {
    type: string;
    root: EntryGroupJSON;
}

interface EntryGroupJSON {
    name: string;
    expanded?: boolean;
    children: Array<JSON>;
    controls?: Array<string>;
    disabledControls?: Array<string>;
}
