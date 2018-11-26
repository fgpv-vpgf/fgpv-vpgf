import Table from '../intention/table/table.intention';
import EPSG from '../intention/epsg/epsg.intention';
import geoSearch from '../intention/geosearch/geosearch.intention';

import { FgpvConfigSchema } from 'api/schema';

const loadIntentions: any = {
    epsg: EPSG,
    table: Table,
    geoSearch
};

// Each map instance will make a Loader instance
export default class Loader {
    private config: FgpvConfigSchema;
    private mapElem: JQuery<HTMLElement>;
    private preInitPromises: Promise<void>[] = []; // all preInit promises must resolve prior to map loading

    extensions: Array<any> = [];
    intentions: any = {};

    constructor(config: FgpvConfigSchema, mapElem: JQuery<HTMLElement>) {
        this.config = Object.freeze(config); // no changes permitted
        this.mapElem = mapElem;

        this.loader();

        // call all plugins pre-init method (if present)
        this.preInit();
    }

    /**
     * Plugins are strictly loaded from the `rv-plugins` map element property.
     * We expect the string value, possibly comma-separated, to be present on the global window object which points to the plugin.
     */
    loader() {
        const rvPluginAttr = this.mapElem.attr('rv-plugins');
        const pluginList = rvPluginAttr ? rvPluginAttr.split(',').map(x => x.trim()) : [];

        pluginList
            .forEach((p: any) => {
                const plugin = this.initialize((<any>window)[p]);

                if (plugin.intention && loadIntentions[plugin.intention]) {
                    delete loadIntentions[plugin.intention];
                    this.intentions[plugin.intention] = plugin;
                } else {
                    this.extensions.push(plugin);
                }
            });

        // Load remaining intentions that have not been replaced.
        Object
            .keys(loadIntentions)
            .forEach((k: string) => {
                const plugin = this.initialize(loadIntentions[k]);
                this.intentions[plugin.intention] = plugin;
            });
    }

    initialize(plugin: any) {
        try {
            plugin = new plugin();
        } catch(e) {
            // do nothing
        }

        return plugin;
    }

    /**
     * Checks each plugin for a preInit method. If set, calls the method and passes the entire config.
     * If a promise is returned, adds it to the `preInitPromises` list.
     */
    preInit() {
        this.extensions
            .concat(Object.values(this.intentions))
            .forEach((p) => {
                if (p.preInit) {
                    let returnedValue = p.preInit(this.config);

                    // check if a promise like object is returned
                    if (returnedValue && returnedValue.then) {
                        this.preInitPromises.push(returnedValue);
                    }
                }
            });
    }

    /**
     * Checks each plugin for an init method. If set, calls the method and passes the maps api.
     */
    init(api: any) {
        this.extensions
            .concat(Object.values(this.intentions))
            .forEach(p => {
                if (p.init) {
                    p.init(api);
                }
            });
    }

    loadTranslations(translationService: any) {
        this.extensions
            .concat(Object.values(this.intentions))
            .forEach(p => {
                if (p.translations) {
                    translationService(p.translations);
                }
            });
    }

    /**
     * Returns a promise which resolves to true when all plugin preInit promises have resolved.
     */
    get isReady() {
        return Promise.all(this.preInitPromises);
    }
}
