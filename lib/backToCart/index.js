"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BackToCart = /** @class */ (function () {
    function BackToCart() {
    }
    /**
     * Sets a specific backToCart instance's catalogue url
     *
     * @param {string} mapId         Map ID for the backToCart instance you want to change
     * @param {string} template      The destination URL with '{RV_LAYER_LIST}' marking where the layer keys should go
     */
    BackToCart.setCatalogueUrl = function (mapId, template) {
        BackToCart.instances[mapId].template = template;
    };
    /**
     * Adds a button to RAMP's side menu
     */
    BackToCart.prototype.activateButton = function () {
        this.button = this.api.mapI.addPluginButton(BackToCart.prototype.translations[this._RV.getCurrentLang()], this.onMenuItemClick());
    };
    /**
     * Returns a promise that resolves with the backToCart URL
     */
    BackToCart.prototype.getCatalogueUrl = function () {
        if (!this.template) {
            console.warn('<Back to Cart> Trying to get URL before template is set');
            return;
        }
        return this.template.replace('{RV_LAYER_LIST}', this._RV.getRcsLayerIDs().toString());
    };
    /**
     * Callback for the RAMP button, sets session storage and then redirects the browser to the catalogueUrl
     */
    BackToCart.prototype.onMenuItemClick = function () {
        var _this = this;
        return function () {
            if (!_this.getCatalogueUrl()) {
                return;
            }
            // save bookmark in local storage so it is restored when user returns
            sessionStorage.setItem(_this.api.id, _this._RV.getBookmark());
            window.location.href = _this.getCatalogueUrl();
        };
    };
    /**
     * Auto called by RAMP startup, checks for a catalogueUrl in the config and sets the template if so
     *
     * @param pluginConfig      pluginConfig given by RAMP, contains the catalogue URL
     */
    BackToCart.prototype.preInit = function (pluginConfig) {
        if (pluginConfig && pluginConfig.catalogueUrl) {
            this.template = pluginConfig.catalogueUrl;
        }
    };
    /**
     * Auto called by RAMP startup, stores the map api and puts the instance in BackToCart.instances
     *
     * @param {any} api     map api given by RAMP
     */
    BackToCart.prototype.init = function (api) {
        this.api = api;
        BackToCart.instances[this.api.id] = this;
        this.activateButton();
    };
    // A store of the instances of backToCart, 1 per map
    BackToCart.instances = {};
    return BackToCart;
}());
exports.default = BackToCart;
BackToCart.prototype.translations = {
    'en-CA': 'Back to Cart',
    'fr-CA': 'Retour au panier'
};
window.backToCart = BackToCart;
