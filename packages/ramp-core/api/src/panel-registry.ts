import Map from 'api/map';
import { Panel, CLOSING_CODES, PanelTypes } from './panel';
import { Subject } from 'rxjs';

/**
 * Handles the coordination of panels.
 *
 * Used to get a list of panels (all, opened, closed), to create panels, etc.
 */
export class PanelRegistry {
    /** @ignore */
    private _mapI: Map;
    /** @ignore */
    private _panels: Panel[] = [];
    /** @ignore */
    private _openPanels: Panel[] = [];
    /** @ignore */
    private _reopenList: Panel[] = [];
    /** @ignore */
    private _panelOpening = new Subject();
    /** @ignore */
    private _panelClosing = new Subject();

    PANEL_TYPES = PanelTypes;

    legend: Panel;
    details: Panel;
    settings: Panel;
    metadata: Panel;
    fileLoader: Panel;
    serviceLoader: Panel;
    geoSearch: Panel;

    constructor(mapInstance: Map) {
        this._mapI = mapInstance;

        $(window).resize(() => {
            this.reopenOverlay();
        });
    }

    reopenOverlay() {
        this._reopenList.forEach((p) => p.reopen());
    }
    /** @ignore */
    _init() {
        // create the core panels
        this.legend = this.getById('mainToc') ? <Panel>this.getById('mainToc') : this.create('mainToc');
        this.details = this.getById('mainDetails') ? <Panel>this.getById('mainDetails') : this.create('mainDetails');
        this.settings = this.getById('sideSettings')
            ? <Panel>this.getById('sideSettings')
            : this.create('sideSettings');
        this.metadata = this.getById('sideMetadata')
            ? <Panel>this.getById('sideMetadata')
            : this.create('sideMetadata');
        this.fileLoader = this.getById('fileLoader') ? <Panel>this.getById('fileLoader') : this.create('fileLoader');
        this.serviceLoader = this.getById('serviceLoader')
            ? <Panel>this.getById('serviceLoader')
            : this.create('serviceLoader');
        this.geoSearch = this.getById('mainGeosearch')
            ? <Panel>this.getById('mainGeosearch')
            : this.create('mainGeosearch');
    }

    /**
     * Returns the panel that has id `id`
     * @param id - the ID of the panel to search for
     * @return {Panel | undefined} the matching panel, or if there is none; `undefined`
     */
    getById(id: string): Panel | undefined {
        id += `-${this._mapI.id}`;
        return this._panels.find((panel) => panel.id === id);
    }

    /**
     * Returns the list of Panels on this map instance.
     * @return {Panel[]} the list of Panels on this Map instance.
     */
    get all(): Panel[] {
        return this._panels;
    }

    /* Returns the list of Panels that are opened, in the order of which
     * they were opened.
     * @return {Panel[]} list of open panels in the order of which they were opened.
     */
    get open(): Panel[] {
        return this._openPanels;
    }

    /* Returns a list of open panels. The order of the panels in the list do not necessarily
     * match the order in which they were opened.
     * @return {Panel[]} list of open panels
     */
    get opened() {
        return this.all.filter((p) => p.isOpen);
    }

    /**
     * Creates a new panel with the ID provided.
     *
     * @param id a unique id for the panel element
     * @param isDialog set to true if panel should be a dialog
     */
    create(id: string, panelType: PanelTypes = PanelTypes.Panel) {
        // Passed through to the constructor to set a css class on the panel
        // id is used as it should be unique to the instance but will match the "same" panel in other instances for styling purposes
        const cssClass = id;
        id += `-${this._mapI.id}`;

        if ($(`#${id}`).length >= 1) {
            throw new Error(
                `API(panels): an element with ID ${id} already exists. A panel ID must be unique to the page.`
            );
        }

        const panel = new Panel(id, this._mapI, panelType, cssClass);

        panel.opening.subscribe((p) => {
            this._panelOpening.next(p);

            const alreadyInList = this._reopenList.findIndex((x) => x === panel);
            if (alreadyInList > -1) {
                this._reopenList.splice(alreadyInList, 1);
            }
        });

        panel.closing.subscribe((p) => {
            this._panelClosing.next(p);

            const alreadyInList = this._reopenList.findIndex((x) => x === panel);
            if (alreadyInList > -1) {
                this._reopenList.splice(alreadyInList, 1);
            }

            this.reopenOverlay();

            if (panel.reopenAfterOverlay && p.code === CLOSING_CODES.OVERLAID) {
                this._reopenList.unshift(panel);
            }
        });

        this._panels.push(panel);

        return panel;
    }

    /**
     * Emits the corresponding panel instance whenever a panel is opened.
     */
    get opening() {
        return this._panelOpening.asObservable();
    }

    /**
     * Emits the corresponding panel instance whenever a panel is closed.
     */
    get closing() {
        return this._panelClosing.asObservable();
    }

    get panelOffset() {
        // calculate what portion of the screen the main and filter panels take
        const mainOpen =
            this.legend.isOpen ||
            this.details.isOpen ||
            this.fileLoader.isOpen ||
            this.serviceLoader.isOpen ||
            this.geoSearch.isOpen;
        // TODO: If/When simpleTable becomes a thing, enhance this line with simple-ness
        const tableOpen = this.getById('enhancedTable') && this.getById('enhancedTable')!.isOpen;

        const offsetFraction = {
            x: (mainOpen ? this.legend.element.width()! : 0) / this._mapI.mapDiv.width()! / 2,
            y: (tableOpen ? this.getById('enhancedTable')!.element.height()! : 0) / this._mapI.mapDiv.height()! / 2,
        };

        return offsetFraction;
    }
}
