"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html_assets_1 = require("./html-assets");
var AreasOfInterest = /** @class */ (function () {
    function AreasOfInterest() {
    }
    AreasOfInterest.prototype.preInit = function () {
        var _this = this;
        this.config = Object.assign({}, window.aioConfig);
        // standardize the configuration language titles for translation
        this.config.areas.forEach(function (area, i) {
            Object.keys(area).forEach(function (key) {
                var matchResult = key.match(/title-(.*)/);
                if (matchResult) {
                    var translation = _this.translations[matchResult[1]];
                    translation.areaTitles = translation.areaTitles ? translation.areaTitles : {};
                    translation.areaTitles[i] = area[key];
                    delete area[key];
                }
                else if (key === 'wkid') {
                    area.spatialReference = { wkid: area[key] };
                    delete area[key];
                }
            });
        });
    };
    AreasOfInterest.prototype.init = function (api) {
        var _this = this;
        this.api = api;
        var topElement = $('<ul style="overflow-y:auto;" class="rv-list rv-basemap-list"></ul>');
        this.config.areas.forEach(function (area, i) {
            var areaHTML = _this.config.noPicture ? html_assets_1.noPic : html_assets_1.hasPic;
            areaHTML = areaHTML.replace(/{areaIndex}/, i);
            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || html_assets_1.pinImg);
            topElement.append(_this.api.$(areaHTML));
            var currBtn = topElement.find('button').last();
            currBtn.click(function () { return (_this.api.extent = area); });
        });
        this.makePanel(topElement);
    };
    AreasOfInterest.prototype.makePanel = function (bodyElement) {
        // panel is already made
        if (this.panel) {
            return;
        }
        this.panel = this.api.createPanel('area-of-interest');
        this.panel.position([420, 0], [720, this.api.div.height() - 62]);
        if (!this.config.noPicture) {
            this.panel.panelBody.css('padding', '0px');
        }
        var closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');
        this.panel.open();
        this.panel.setControls(["<h2 style=\"font-weight: normal;display:inline;vertical-align:middle\">{{ 't.title' | translate }}</h2>", closeBtn]);
        this.panel.setBody(bodyElement);
    };
    return AreasOfInterest;
}());
AreasOfInterest.prototype.translations = {
    'en-CA': {
        title: 'Areas of Interest'
    },
    'fr-CA': {
        title: "Zones d'int\u00E9r\u00EAt"
    }
};
window.areaOfInterest = AreasOfInterest;
