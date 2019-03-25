import Map from 'api/map';
import { Panel } from './panel';
import { Subject } from 'rxjs';

export class PanelRegistry {
    private _mapI: Map;
    private _panels: Panel[] = [];
    private _panelOpening = new Subject();
    private _panelClosing = new Subject();

    legend: Panel;
    details: Panel;
    settings: Panel;
    metadata: Panel;

    constructor(mapInstance: Map) {
        this._mapI = mapInstance;
    }

    _init() {
        // create the core panels
        this.legend = this.create('mainToc');
        this.details = this.create('mainDetails');
        this.settings = this.create('sideSettings');
        this.metadata = this.create('sideMetadata');
    }

    /**
     * Returns the panel that has id `id`
     * @param id - the ID of the panel to search for
     * @return {Panel | undefined} the matching panel, or if there is none; `undefined`
     */
    getById(id: string) {
        return this._panels.find(panel => panel.id === id);
    }

    /**
     * Returns the list of Panels on this map instance.
     * @return {Panel[]} the list of Panels on this Map instance.
     */
    get all() {
        return this._panels;
    }

    /**
     * Creates a new panel with the ID provided.
     *
     * @param id a unique id for the panel element
     */
    create(id: string) {

        if ($(`#${id}`).length >= 1) {
            throw new Error(`API(panels): an element with ID ${id} already exists. A panel ID must be unique to the page.`);
        }

        const panel = new Panel(id, this._mapI);

        panel.opening.subscribe(p => {
            this._panelOpening.next(p);
        });

        panel.closing.subscribe(p => {
            this._panelClosing.next(p);
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
}
