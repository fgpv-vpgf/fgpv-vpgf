import EPSG from '../intention/epsg/epsg.intention';
import { FgpvConfigSchema } from 'api/schema';

const iDict: any = {
    epsg: EPSG,
    table: {} // TODO: replace with simpleTable
};

// Each map instance will make a Loader instance
export default class Loader {
    private config: FgpvConfigSchema;
    private mapElem: JQuery<HTMLElement>;
    private preInitPromises: Promise<void>[] = []; // all preInit promises must resolve prior to map loading
    
    pluginList : Array<any> = []; // a list of all intentions and extensions

    constructor(config: FgpvConfigSchema, mapElem: JQuery<HTMLElement>) {
        this.config = Object.freeze(config); // no changes permitted 
        this.mapElem = mapElem;

        this.loadIntentions();
        this.loadExtensions();

        // call all plugins pre-init method (if present)
        this.preInit();
    }

    /**
     * Intentions are strictly loaded from the config. If `default` is set we use the imported (proper) intention.
     * If not `none` we expect the string value to be present on the global window object which points to the (custom) intention.
     */
    loadIntentions() {
        const configI: any = this.config.intentions;
        for (const prop in configI) {
            const val: string = configI[prop];
            if (val === 'default' || val !== 'none') {
                let i = val === 'default' ? iDict[prop] : (<any>window)[val];

                // can contain a constructor, if so initialize. This is useful for multi-map support
                try {
                    i = new i();
                } catch(e) {
                    // do nothing
                }

                i.intention = prop; // indicate this is an intention and it's type
                this.pluginList.push(i);
            }
        }
    }

    /**
     * Extensions are strictly loaded from the `rz-extensions` map element property. 
     * We expect the string value, possibly comma-separated, to be present on the global window object which points to the extension.
     */
    loadExtensions() {
        const rvExtAttr = this.mapElem.attr('rz-extensions');
        const extList = rvExtAttr ? rvExtAttr.split(',') : [];
        extList.forEach(ext => this.pluginList.push((<any>window)[ext]));
    }

    /**
     * Checks each plugin for a preInit method. If set, calls the method and passes the entire config.
     * If a promise is returned, adds it to the `preInitPromises` list.
     */
    preInit() {
        this.pluginList.forEach((p, i, a) => {
            
            a[i] = typeof p === 'function' ? new p() : p;
            p = a[i];

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
        this.pluginList.forEach(p => {
            if (p.init) {
                p.init(api);
            }
        });
    }

    loadTranslations(translationService: any) {
        this.pluginList.forEach(p => {
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