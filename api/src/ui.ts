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


import { Observable, Subject } from 'rxjs';
import { PanelEvent } from 'api/events';
import Map from 'api/map';

/**
 * Creates the default panel streams for opening, opened, closing, and closed stream events
 */
class BasePanel {

    _closing: Subject<PanelEvent>;
    _closed: Subject<PanelEvent>;
    _opened: Subject<PanelEvent>;
    _opening: Subject<PanelEvent>;

    constructor() {
        this._closing = new Subject();
        this._closed = new Subject();
        this._opened = new Subject();
        this._opening = new Subject();
    }

    /**
     * This event is fired before a panel starts to close. Calling `event.stop()` prevents the panel from closing.
     * @event closing
    */
    get closing(): Observable<PanelEvent> {
        return this._closing.asObservable();
    }

    /**
     * This event is fired when a panel is fully closed.
     * @event closed
    */
    get closed(): Observable<PanelEvent> {
        return this._closed.asObservable();
    }

    /**
     * This event is fired before a panel starts to open. Calling `event.stop()` prevents the panel from opening.
     * @event opening
     * @property    Event
     * @property    JQuery<HTMLElement>    - HTML dom node of panel contents
    */
    get opening(): Observable<PanelEvent> {
        return this._opening.asObservable();
    }

    /**
     * This event is fired when a panel is fully open.
     * @event opened
    */
    get opened(): Observable<PanelEvent> {
        return this._opened.asObservable();
    }
}

/**
 * A panel represents a top level viewer panel (is an `rv-panel` node).
 *
 * There are currently three panels:
 * - main
 * - side
 * - table
 *
 * @example #### Opening a panel
 *
 * ```js
 * panel.open();
 * ```
 *
 * Note that `panel` refers to an instance of a panel object, which you'll see how to get from a `PanelRegistry`
 */
export class Panel extends BasePanel {

    private _id: string;
    private _node: JQuery<HTMLElement>;
    private _stateStream: Subject<boolean> = new Subject();

    constructor(id: string, node: JQuery<HTMLElement>) {
        super();

        this._id = id;
        this._node = node;
    }

    /** Returns the panel identifier, can be "featureDetails", "legend", ... */
    get id (): string {
        return this._id;
    }

    get stateObservable(): Observable<boolean> {
        return this._stateStream.asObservable();
    }

    /** Returns the dom node of the panel content, not the panel node itself. Currently this is the first direct div element of a panel. */
    get node(): JQuery<HTMLElement> {
        return this._node;
    }

    /** Closes this panel. */
    close (): void {
        this._stateStream.next(false);
    }

    /** Opens this panel. */
    open (): void {
        this._stateStream.next(true);
    }
}

/**
 * A collection of panels with helper methods to make managing them easier.
 *
 * For example, using `panelRegistry.opening.subscribe(...)` will trigger when any panel in the collection is opening.
 *
 * ```text
 * Panel types:
 *  table    -   Large, right to legend content panel
 *  main     -   Legend panel
 *  other    -   Equal size, right to legend panel (settings)
 *  side     -   Slide out menu panel
 * ```
 */
export class PanelRegistry extends BasePanel {
    private _panels: Array<Panel>;

    constructor() {
        super();

        this._panels = [];
    }

    /**
     * Rebroadcasts `to` with the PanelEvent
     *
     * @param to the internal event name, one of ['_opening', '_opened', '_closing', '_closed']
     */
    private subscription (to: string, panelEvent: PanelEvent) {
        (<any>this)[to].next(panelEvent);
    }

    byId (id: string): Panel | null {
        const panel = this._panels.find(p => p.id === id);

        return panel ? panel : null;
    }

    forEach(cb: (panel: Panel) => void): void {
        this._panels.forEach(cb);
    }

    add (panel: Panel): void {
        // subscribe to panel and to rebroadcast any of its PanelEvents
        ['_opening', '_opened', '_closing', '_closed'].forEach(to => {
            (<any>panel)[to].subscribe(this.subscription.bind(this, to));
        });

        this._panels.push(panel);
    }

    remove (panel: Panel): void {
        // unsubscribe the panel
        ['_opening', '_opened', '_closing', '_closed'].forEach(to => {
            (<any>panel)[to].unsubscribe();
        });

        this._panels = this._panels.filter(x => x !== panel);
    }
}

/**
 * Each map instance contains one ToolTip instance which handles the addition of new tooltips and the event streams
 *
 * TODO: move mouse over/out to layer objects once implemented in the API.
 */
class ToolTip {
    _mouseOver: Subject<Event> = new Subject();
    _mouseOut: Subject<Event> = new Subject();
    _added: Subject<Object> = new Subject();

    mouseOver: Observable<Event>;
    mouseOut: Observable<Event>;
    added: Observable<Object>;

    constructor() {
        this.mouseOver = this._mouseOver.asObservable();
        this.mouseOut = this._mouseOut.asObservable();
        this.added = this._added.asObservable();
    }

    /**
     * Adds tooltip at specified position, and follows the map strategy.
     *
     * @param screenPosition    {x: number, y: number} for placement
     * @param content           string content or jQuery element
     */
    add(screenPosition: ScreenPosition, content: JQuery<HTMLElement>) {
        const tt = {
            screenPosition,
            content,
            toolTip: null
        };

        this._added.next(tt);
        return tt.toolTip;
    }
}

/**
 * A basemap instance is created automatically for every basemap in the viewers configuration. You can also create them outside the config.
 *
 * @example Listen for basemap to change its active property (basemap either hidden or shown on map) <br><br>
 *
 * ```js
 * myBasemap.activeChanged.subscribe(function (isActive) {
 *  if (isActive) {
 *      console.log('Our basemap is now the active basemap on the map');
 *      // basemap active, do stuff here
 *  }
 * });
 *
 * mapInstance.ui.basemaps.setActive('0');  // set the basemap with id '0' to active
 * ```
 */
export class Basemap {
    /** @ignore */
    _mapInstance: any;

    /** @ignore */
    _id: string;

    /** @ignore */
    _layers: Array<JSON>;

    /** @ignore */
    _isActive: boolean;
    _activeChanged: Subject<boolean>;

    /** @ignore */
    _description: string;
    _descriptionChanged: Subject<string>;

    /** @ignore */
    _name: string;
    _nameChanged: Subject<string>;

    constructor(id: string, name: string, layers: Array<JSON>, description: string, mapInstance: any) {
        this._mapInstance = mapInstance;

        this._id = id;
        this._name = name;
        this._layers = layers;
        this._description = description || '';
        this._isActive = false;

        this._activeChanged = new Subject();
        this._descriptionChanged = new Subject();
        this._nameChanged = new Subject();
    }

    /** Returns the ID of the basemap. */
    get id(): string {
        return this._id;
    }

    /** Returns the name of the basemap. */
    get name(): string {
        return this._name;
    }

    /** Sets the name of the basemap. This updates the name in the viewer basemap panel. */
    set name(name: string) {
        const oldName: string = this._name;

        if (oldName !== name) {
            this._name = name;
            const viewerBasemap = this._mapInstance.basemaps.find((basemap: any) => basemap.id === this.id);
            viewerBasemap.name = name;
            this._nameChanged.next(name);
        }
    }

    /**
     * Emits whenever a basemap name is changed.
     * @event nameChanged
     */
    get nameChanged(): Observable<string> {
        return this._nameChanged.asObservable();
    }

    /** Returns the description of the basemap. */
    get description(): string {
        return this._description;
    }

    /** Sets the description of the basemap. This updates the description in the viewer basemap panel. */
    set description(description: string) {
        const oldDescription: string = this._description;

        if (oldDescription !== description) {
            this._description = description;
            const viewerBasemap = this._mapInstance.basemaps.find((basemap: any) => basemap.id === this.id);
            viewerBasemap.description = description;
            this._descriptionChanged.next(description);
        }
    }

    /**
     * Emits whenever a basemap description is changed.
     * @event descriptionChanged
     */
    get descriptionChanged(): Observable<string> {
        return this._descriptionChanged.asObservable();
    }

    /** Returns true if the basemap is currently shown on the map. */
    get isActive(): boolean {
        return this._isActive;
    }

    /**
     * Emits whenever a basemap is toggled between selected and unselected.
     * @event activeChanged
     */
    get activeChanged(): Observable<boolean> {
        return this._activeChanged.asObservable();
    }

    /** Returns the JSON snippets for the layers in the basemap. */
    get layers(): Array<JSON> {
        return this._layers;
    }
}

/**
 * A basemap group created for every map instance consisting of all basemaps on that map. Basemaps can be added through the viewers configuration and
 * also externally through the API.
 *
 * @example
 *
 * ```js
 * mapInstance.ui.basemaps.addBasemap({
 *     "id": "apiBasemap",
 *     "name": "API Added Basemap",
 *     "description": "This basemap was added through the API.",
 *     "altText": "altText - API Basemap",
 *     "layers": [
 *         {
 *             "id": "CBMT",
 *              "layerType": "esriFeature",
 *              "url": "http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer"
 *         }
 *     ],
 *     "tileSchemaId": "EXT_NRCAN_Lambert_3978#LOD_NRCAN_Lambert_3978"
 * }, true);
 * var myBasemap = mapInstance.ui.basemaps.getLayersById('apiBasemap');
 * if (myBasemap.isActive) { // check if active (displayed on the map) - it should be active since basemap was added above with active parameter as true
 *     // basemap added and is active, do stuff here
 * }
 * ```
 */
export class BasemapGroup {
    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _basemapsArray: Array<Basemap> = [];

    _basemapAdded: Subject<Basemap>;
    _basemapRemoved: Subject<Basemap>;

    _click: Subject<Basemap>;

    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;

        mapInstance.basemaps.forEach((basemap: any) => {
            const id = basemap.id;
            const name = basemap.name;
            const layers = basemap.layers;
            const description = basemap.description;
            const active = basemap.isSelected;

            this._basemapsArray.push(new Basemap(id, name, layers, description, this._mapInstance));
            if (active) {
                const basemap = this.getBasemapById(id);
                if (basemap) {
                    basemap._isActive = true;
                }
            }
        });

        this._basemapAdded = new Subject();
        this._basemapRemoved = new Subject();

        this._click = new Subject();
    }

    /** Returns all basemaps in the group. */
    get allBasemaps(): Array<Basemap> {
        return this._basemapsArray;
    }

    /**
     * Emits whenever a basemap is added to the group.
     * @event basemapAdded
     */
    get basemapAdded(): Observable<Basemap> {
        return this._basemapAdded.asObservable();
    }

    /**
     * Emits whenever a basemap is removed from the group.
     * @event basemapRemoved
     */
    get basemapRemoved(): Observable<Basemap> {
        return this._basemapRemoved.asObservable();
    }

    /**
     * Emits whenever a basemap is clicked from the side panel.
     * @event click
     */
    get click(): Observable<Basemap> {
        return this._click.asObservable();
    }

    /** Select the basemap to make active using the basemap id provided. */
    setActive(id: string) {
        const basemap: Basemap | undefined = this.getBasemapById(id);
        if (basemap) {
            this._mapInstance.instance.changeBasemap(id);
        }
    }

    /** Creates a `Basemap` using the provided config snippet and if it is initially active (default false). */
    addBasemap(basemapConfig: JSONBasemap, active?: boolean): Basemap | undefined {
        if (this._basemapsArray.find(basemap => basemap.id === basemapConfig.id)) {
            return;
        }

        const newBasemap: Basemap = new Basemap(basemapConfig.id, basemapConfig.name, basemapConfig.layers, basemapConfig.description || '', this._mapInstance);
        this._basemapsArray.push(newBasemap);
        this._mapInstance.instance.appendBasemap(basemapConfig);

        // add to basemap gallery and viewer basemap panel as well
        if (active) {
            this.setActive(basemapConfig.id);
        }
        this._basemapAdded.next(newBasemap);
        return newBasemap;
    }

    /** Removes a basemap from the group. */
    removeBasemap(layer: Basemap): void;

    /** Removes the basemap with the provided id from the group. */
    removeBasemap(id: string | number): void;

    /** Removes the basemap from the group using the provided basemap itself, or by id. */
    removeBasemap(basemapOrId: Basemap | string | number): void {
        let id: string;
        let basemap: Basemap | undefined;
        if (isBasemapObject(basemapOrId)) {
            id = basemapOrId.id;
            basemap = this.getBasemapById(id);
        } else {
            id = basemapOrId.toString();
            basemap = this.getBasemapById(basemapOrId);
        }

        // only remove if there is at least one other basemap remaining in the gallery
        if (basemap && this._basemapsArray.length > 1) {
            this._mapInstance.instance.deleteBasemap(basemap);

            const id = basemap.id;
            const index = this._basemapsArray.findIndex(basemap => basemap.id === id);
            this._basemapsArray.splice(index, 1);

            this._basemapRemoved.next(basemap);
        }
    }

    /** Checks whether the given basemap is in the group. */
    contains(layer: Basemap): boolean;

    /** Checks whether the given basemap by id is in the group. */
    contains(id: string | number): boolean;

    /** Checks whether the given basemap is in the group using the provided basemap itself, or by id. */
    contains(basemapOrId: Basemap | string | number): boolean {
        if (isBasemapObject(basemapOrId)) {
            return this.getBasemapById(basemapOrId.id) !== undefined;
        } else {
            return this.getBasemapById(basemapOrId) !== undefined;
        }
    }

    /** Returns the basemap with the given ID, if it exists in the group. Otherwise returns undefined.
     *
     * Note: IDs 1234 and '1234' are equivalent. Either can be used to look up basemaps.
     */
    getBasemapById(id: number | string): Basemap | undefined {
        return this._basemapsArray.find(basemap => basemap.id === id.toString());
    }
}

/**
 * @example #### Using an anchor point to remove context map
 *
 * ```js
 * RZ.mapInstances[0].ui.anchors.CONTEXT_MAP.remove();
 * ```
 */
export class UI {
    _mapI: Map;
    _panels: PanelRegistry;
    _tooltip: ToolTip = new ToolTip();
    _basemaps: BasemapGroup;

    constructor(mapInstance: Map) {
        this._mapI = mapInstance;
        this._panels = new PanelRegistry();
    }

    get panels(): PanelRegistry {
        return this._panels;
    }

    get tooltip(): ToolTip {
        return this._tooltip;
    }

    get anchors(): anchorPoints {
        return {
            CONTEXT_MAP: this._mapI.div.find('div.esriOverviewMap')
        };
    }

    get basemaps(): BasemapGroup {
        return this._basemaps;
    }
}

function isBasemapObject(basemapOrId: Basemap | string | number): basemapOrId is Basemap {
    return basemapOrId instanceof Basemap;
}

interface ScreenPosition {
    x: number,
    y: number
}

interface anchorPoints {
    /**
     * The contextual map found in the top right corner of the viewer.
     */
    CONTEXT_MAP: JQuery<HTMLElement>
}

interface JSONBasemap {
    id: string;
    name: string;
    description: string;
    layers: Array<JSON>;
}