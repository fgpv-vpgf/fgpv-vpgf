"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html_assets_1 = require("./html-assets");
var AreasOfInterest = /** @class */ (function () {
    function AreasOfInterest() {
    }
    AreasOfInterest.prototype.preInit = function (pluginConfig) {
        var _this = this;
        this.config = pluginConfig;
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
        AreasOfInterest.instances[this.api.id] = this;
        var topElement = $('<ul style="overflow-y:auto;" class="rv-list rv-basemap-list"></ul>');
        this.config.areas.forEach(function (area, i) {
            var areaHTML = _this.config.noPicture ? html_assets_1.noPic : html_assets_1.hasPic;
            areaHTML = areaHTML.replace(/{areaIndex}/, i);
            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || html_assets_1.pinImg);
            topElement.append(areaHTML);
            var currBtn = topElement.find('button').last();
            currBtn.click(function () { return (_this.api.extent = area); });
        });
        this.button = this.api.mapI.addPluginButton(AreasOfInterest.prototype.translations[this._RV.getCurrentLang()].title, this.onMenuItemClick());
        this.makePanel(topElement);
    };
    AreasOfInterest.prototype.onMenuItemClick = function () {
        var _this = this;
        return function () {
            _this.button.isActive ? _this.panel.close() : _this.panel.open();
        };
    };
    AreasOfInterest.prototype.makePanel = function (bodyElement) {
        var _this = this;
        // panel is already made
        if (this.panel) {
            return;
        }
        this.panel = this.api.createPanel('area-of-interest');
        this.panel.opening.subscribe(function () {
            _this.button.isActive = true;
        });
        this.panel.closing.subscribe(function () {
            _this.button.isActive = false;
        });
        this.panel.position([420, 0], [720, this.api.div.height() - (48 + 20)], true);
        if (!this.config.noPicture) {
            this.panel.panelBody.css('padding', '0px');
        }
        var closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');
        this.panel.setControls([
            "<h2 style=\"font-weight: normal;display:inline;vertical-align:middle\">{{ 't.title' | translate }}</h2>",
            closeBtn
        ]);
        this.panel.setBody(bodyElement);
        this.panel.open();
    };
    // A store of the instances of areasOfInterest, 1 per map
    AreasOfInterest.instances = {};
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
window.areasOfInterest = AreasOfInterest;
