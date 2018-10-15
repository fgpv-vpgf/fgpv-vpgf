import { Grid } from 'ag-grid/main';
import { SEARCH_TEMPLATE, MENU_TEMPLATE } from './templates';
import 'ag-grid/dist/styles/ag-grid.css';
import './main.scss';

/**
 * Creates and manages one api panel instance to display the table in the ramp viewer. One panelManager is created for each map instance on the page.
 *
 * This class also contains custom angular controllers to enable searching, printing, exporting, and more from angular material panel controls.
 */
export class PanelManager {
    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.tableContent = $(`<div rv-focus-exempt></div>`);
        this.panel = this.mapApi.createPanel(this.id);

        this.setSize();
        this.panel.panelBody.addClass('ag-theme-material');
        this.panel.content = new this.panel.container(this.tableContent);
    }

    open(tableOptions: any, layer: any) {
        this.tableOptions = tableOptions;
        const controls = this.header;
        controls.push(new this.panel.container(`<h2>Features: ${layer.name}</h2>`));
        this.panel.controls = controls;

        this.tableContent.empty();
        new Grid(this.tableContent[0], tableOptions);
        this.panel.open();
    }

    onBtnExport() {
        this.tableOptions.api.exportDataAsCsv();
    }

    onBtnPrint() {
        this.panel.panelBody.css({
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: this.tableOptions.api.getPreferredWidth() + 2,
            'z-index': '5',
            height: 'auto'
        });

        this.tableOptions.api.setGridAutoHeight(true);
        this.panel.panelBody.prependTo('body');

        setTimeout(() => {
            window.print();
            this.panel.panelBody.appendTo(this.panel.panelContents);
            this.panel.panelBody.css({
                position: '',
                top: '',
                left: '',
                width: '',
                'z-index': '',
                height: 'calc(100% - 38px)'
            });
            this.setSize();
            this.tableOptions.api.setGridAutoHeight(false);
        }, 650);
    }

    setSize() {
        this.panel.panelContents.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: this.maximized ? '0px' : '50%'
        });
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }

    get header(): any[] {
        this.angularHeader();

        const menuBtn = new this.panel.container(MENU_TEMPLATE);
        menuBtn.element.css('float', 'right');

        const closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');

        const searchBar = new this.panel.container(SEARCH_TEMPLATE);
        searchBar.element.css('float', 'right');

        return [closeBtn, menuBtn, searchBar];
    }

    angularHeader() {
        const that = this;
        this.mapApi.agControllerRegister('SearchCtrl', function() {
            this.searchText = '';
            this.updatedSearchText = function() {
                that.tableOptions.api.setQuickFilter(this.searchText);
            };
            this.clearSearch = function() {
                this.searchText = '';
                this.updatedSearchText();
            };
        });

        this.mapApi.agControllerRegister('MenuCtrl', function() {
            this.appID = that.mapApi.id;
            this.maximized = that.maximized ? 'true' : 'false';

            // sets the table size, either split view or full height
            this.setSize = function(value) {
                that.maximized = value === 'true' ? true : false;
                that.setSize();
            };

            // print button has been clicked
            this.print = function() {
                that.onBtnPrint();
            };

            // export button has been clicked
            this.export = function() {
                that.onBtnExport();
            };
        });
    }
}

export interface PanelManager {
    panel: any;
    mapApi: any;
    tableContent: JQuery<HTMLElement>;
    _id: string;
    maximized: boolean;
    tableOptions: any;
}

PanelManager.prototype.maximized = false;
