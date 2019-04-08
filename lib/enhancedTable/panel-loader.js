"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var templates_1 = require("./templates");
/**
 * Creates and manages one api panel instance to display the loading indicator before the `enhancedTable` is loaded.
 */
var PanelLoader = /** @class */ (function () {
    function PanelLoader(mapApi, legendBlock) {
        this.mapApi = mapApi;
        this.legendBlock = legendBlock;
        this.panel = this.mapApi.panels.create('enhancedTableLoader');
        this.panel.element.css({
            top: '0px',
            left: '410px'
        });
        this.panel.allowUnderlay = false;
        this.prepareHeader();
        this.prepareBody();
        this.hidden = true;
    }
    PanelLoader.prototype.setSize = function (maximized) {
        if (maximized) {
            this.panel.element.css({ bottom: '0' });
            ;
        }
        else {
            this.panel.element.css({ bottom: '50%' });
            ;
        }
    };
    PanelLoader.prototype.prepareHeader = function () {
        this.panel.header.title = this.legendBlock.name;
        this.panel.header.closeButton;
    };
    PanelLoader.prototype.open = function () {
        this.panel.open();
        this.hidden = false;
    };
    PanelLoader.prototype.prepareBody = function () {
        var template = templates_1.TABLE_LOADING_TEMPLATE(this.legendBlock);
        this.panel.body = template;
    };
    PanelLoader.prototype.close = function () {
        this.panel.close();
    };
    return PanelLoader;
}());
exports.PanelLoader = PanelLoader;
