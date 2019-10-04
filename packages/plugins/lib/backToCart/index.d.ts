export default class BackToCart {
    static instances: {
        [id: string]: BackToCart;
    };
    /**
     * Sets a specific backToCart instance's catalogue url
     *
     * @param {string} mapId         Map ID for the backToCart instance you want to change
     * @param {string} template      The destination URL with '{RV_LAYER_LIST}' marking where the layer keys should go
     */
    static setCatalogueUrl(mapId: string, template: string): void;
    /**
     * Adds a button to RAMP's side menu
     */
    activateButton(): void;
    /**
     * Returns a promise that resolves with the backToCart URL
     */
    getCatalogueUrl(): string | undefined;
    /**
     * Callback for the RAMP button, sets session storage and then redirects the browser to the catalogueUrl
     */
    onMenuItemClick(): () => void;
    /**
     * Auto called by RAMP startup, checks for a catalogueUrl in the config and sets the template if so
     *
     * @param pluginConfig      pluginConfig given by RAMP, contains the catalogue URL
     */
    preInit(pluginConfig: pluginConfig): void;
    /**
     * Auto called by RAMP startup, stores the map api and puts the instance in BackToCart.instances
     *
     * @param {any} api     map api given by RAMP
     */
    init(api: any): void;
}
interface pluginConfig {
    catalogueUrl: string;
}
export default interface BackToCart {
    api: any;
    _RV: any;
    template: string;
    translations: any;
    button: any;
}
export {};
