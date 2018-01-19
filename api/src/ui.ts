import { Observable, Subject } from 'rxjs/Rx';
import { PanelEvent } from 'api/events';
import Map from 'api/map';
import { ObserveOnMessage } from 'rxjs/operators/observeOn';

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