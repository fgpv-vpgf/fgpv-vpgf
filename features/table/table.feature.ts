import { PanelManager } from './PanelManager';
import { take } from 'rxjs/internal/operators/take';
import './table.css';

/**
 * Main class for handling the creation of the table HTML and the logic for how to intercept downloaded attribute data on a layer.
 */
export class Table {
    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = new PanelManager(this);

        this.listen();
    }

    /**
     * Listen for layer clicks on the legend, then display the table if attributes are available or wait for them to be downloaded.
     */
    listen() {
        this.mapApi.layers.click.subscribe((baseLayer: any) => {
            const attrs = baseLayer.getAttributes();

            if (attrs.length === 0) {
                this.mapApi.layers.attributesAdded.pipe(take(1)).subscribe((attrs: any) => {
                    this.prep(attrs);
                });
            } else {
                this.prep({
                    attributes: attrs,
                    layer: baseLayer
                });
            }
        });
    }

    /**
     * Generates the HTML for the simple table and creates the panel header title.
     *
     * @param attrBundle attribute data
     */
    prep(attrBundle: AttrBundle) {
        const cols = `<thead><tr>${ Object.keys(attrBundle.attributes[0]).map((c: any) => {
            return `<th>${c}</th>`;
        }).join('') }</tr></thead>`;

        const rows = `<tbody>${ attrBundle.attributes.map((rs: any) => {
            return `<tr>${ Object.values(rs).map((r: any) => {
                return `<td>${r}</td>`;
            }).join('') }</tr>`;
        }).join('') }</tbody>`;

        this.panel.tableContent.html(`<table class="table table-bordered">${cols} ${rows}</table>`);

        //if (this.panel.getControls().length > 1) {
        //    this.panel.getControls().pop();
        //}

        //this.panel.getControls().push(new this.panel.container(`<h2>Features: ${attrBundle.layer.name}</h2>`));
        //this.panel.setControls(this.panel.getControls());

        this.panel.open();
    }
}

export interface Table {
    mapApi: any;
    panel: PanelManager;
}

interface AttrBundle {
    attributes: any[];
    layer: any;
}

export default {
    feature: 'table',

    init(mapApi: any) {
        new Table(mapApi);
    }
}