import Table from '../features/table/table.feature';
import EPSG from '../features/epsg/epsg.feature';
import geoSearch from '../features/geosearch/geosearch.feature';

import { FgpvConfigSchema } from 'api/schema';

const loadFeatures: any = {
    epsg: EPSG,
    table: Table,
    geoSearch
};

// Each map instance will make a Loader instance
export default class Loader {
    private config: FgpvConfigSchema;
    private mapElem: JQuery<HTMLElement>;
    private preInitPromises: Promise<void>[] = []; // all preInit promises must resolve prior to map loading

    plugins: Array<any> = [];
    features: any = {};

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

                if (!plugin) {
                    console.error(`Plugin with name ${p} is not defined at window.${p}. This plugin is ignored.`);
                    return;
                }

                // save the plugin name which is lost once we initialize it.
                plugin._name = p;

                if (plugin.feature && loadFeatures[plugin.feature]) {
                    delete loadFeatures[plugin.feature];
                    this.features[plugin.feature] = plugin;
                } else {
                    this.plugins.push(plugin);
                }
            });

        // Load remaining features that have not been replaced.
        Object
            .keys(loadFeatures)
            .forEach((k: string) => {
                const plugin = this.initialize(loadFeatures[k]);
                this.features[plugin.feature] = plugin;
            });
    }

    initialize(plugin: any) {
        try {
            plugin = new plugin();
        } catch (e) {
            // do nothing
        }

        return plugin;
    }

    /**
     * Checks each plugin for a preInit method. If set, calls the method and passes the entire config.
     * If a promise is returned, adds it to the `preInitPromises` list.
     */
    preInit() {
        this.plugins
            .concat(Object.values(this.features))
            .forEach((p) => {
                if (p.preInit) {
                    // config type is any since plugins property is not schema defined.
                    const pluginConfig = (<any>this.config).plugins ? (<any>this.config).plugins[p._name] : null;
                    const returnedValue = p.preInit(pluginConfig, this.config);

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
    init(api: any, legacy_api: any) {
        this.plugins
            .concat(Object.values(this.features))
            .forEach(p => {
                p._RV = legacy_api;
                if (p.init) {
                    p.init(api);
                }
            });
    }

    loadTranslations(translationService: any) {
        this.plugins
            .concat(Object.values(this.features))
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
