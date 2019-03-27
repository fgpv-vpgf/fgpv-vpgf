import { Table } from './table.feature';
import { Panel, PanelTypes } from 'api/panel';

/**
 * Handles the creation and logic of generic panel setup, positioning, and styling.
 */
export class PanelManager extends Panel {
    constructor(table: Table) {
        super('tblID', table.mapApi, PanelTypes.Panel);
        this.tableContent = $(`<div></div>`);
        this.element.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: '50%'
        });
        // this.setBody(this.tableContent);
        this.body.css({'overflow-x': 'scroll', padding: 'initial'});

        // const closeBtn = new this.button('X');
        // closeBtn.element.css('float', 'right');
        // this.setControls([closeBtn]);
    }
}

export interface PanelManager {
    tableContent: JQuery<HTMLElement>;
}