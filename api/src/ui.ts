import { Observable, Subject } from 'rxjs/Rx';
import { StoppableEvent, PanelEvent } from 'api/events';
import Map from 'api/map';

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

/** Note that opening legend when details is open will close details first. Events will be fired for auto closed panels. */
export class Panel extends BasePanel {

    private _id: string;
    private _node: JQuery<HTMLElement>;

    constructor(id: string, node: JQuery<HTMLElement>) {
        super();

        this._id = id;
        this._node = node;
    }


    /** Returns the panel identifier, can be "featureDetails", "legend", ... */
    get id (): string {
        return this._id;
    }

    get isOpen(): boolean {
        return true;
    }

    /** Returns the dom node of the panel content. */
    get node(): JQuery<HTMLElement> {
        return this._node;
    }

    /** Closes this panel. */
    close () {

    }

    /** Opens this panel. */
    open () {

    }
}

/**
 * @todo Discuss if we should add more panel locations?
 *
 * <br><br>
 * ```text
 * Panel types:
 *  sideMenu    -   Left siding menu panel
 *  legend      -   Legend panel
 *  import      -   Import wizard
 *  details     -   Layer details
 *  basemap     -   Basemap selector slider menu
 *
 * There are also top level types:
 *  left    -   contains legend, import, details
 *  center  -   datatables
 * ```
 */
export class PanelRegistry extends BasePanel {
    _panels: Array<Panel>;

    constructor() {
        super();

        this._panels = [];
    }

    get panels(): Array<Panel> {
        return this._panels;
    }

    byId (id: string): Panel | null {
        const panel = this.panels.find(p => p.id === id);

        return panel ? panel : null;
    }

    add (panel: Panel): void {
        this.closing.merge(panel.closing);
        this.closed.merge(panel.closed);
        this.opening.merge(panel.opening);
        this.opened.merge(panel.opened);
        this._panels.push(panel);
    }
}

export class UI {
    _mapI: Map;
    _panels: PanelRegistry;

    constructor(mapInstance: Map) {
        this._mapI = mapInstance;
        this._panels = new PanelRegistry();

    }

    get panels(): PanelRegistry {
        return this._panels;
    }

}