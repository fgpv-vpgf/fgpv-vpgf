import RColor from 'rcolor';
import to from 'await-to-js';
import angular from 'angular';

// TODO: move mixin constructors into the util file
// NOTE: do not user async/await with Angular $q promises - they don't work always correctly and debugging such errors is a huge pain

type Constructor<T> = new (...args: any[]) => T;

// this a function for creating complex classes using mixins and avoiding the direct inheritance
// given a number of classes, a new class is created and all the properties from the supplied classes are copied into it (in cases of name collision, the last mixin with the same property wins)
// unfortunatelly, this method does not allow for `getters/setters` on the mixin classes (they will be copied as simple named properties, not functions)
// he original mixin approach (https://www.typescriptlang.org/docs/handbook/mixins.html) is more verboase and has more overhead
// the Deep Dive's mixin approach (https://basarat.gitbooks.io/typescript/docs/types/mixins.html) applies mixins outside of the class declaration making it hard to use mixins function/properties inside the decorated class
// adopted from: https://stackoverflow.com/questions/48372465/type-safe-mixin-decorator-in-typescript
function mixins<A>(CtorA: Constructor<A>): Constructor<A>;
function mixins<A, B>(CtorA: Constructor<A>, CtorB: Constructor<B>): Constructor<A & B>;
function mixins<A, B, C>(CtorA: Constructor<A>, CtorB: Constructor<B>, CtorC: Constructor<C>): Constructor<A & B & C>;
function mixins<A, B, C, D>(
    CtorA: Constructor<A>,
    CtorB: Constructor<B>,
    CtorC: Constructor<C>,
    CtorD: Constructor<D>
): Constructor<A & B & C & D>;
function mixins<A, B, C, D, E>(
    CtorA: Constructor<A>,
    CtorB: Constructor<B>,
    CtorC: Constructor<C>,
    CtorD: Constructor<D>,
    CtorE: Constructor<E>
): Constructor<A & B & C & D & E>;
function mixins<T>(...Ctors: Constructor<T>[]): Constructor<T> {
    class Class { }

    Ctors.forEach(Ctor => {
        Object.getOwnPropertyNames(Ctor.prototype).forEach(name => {
            (<any>Class).prototype[name] = Ctor.prototype[name];
        });
    });

    return Class as Constructor<T>;
}

type LayerRecordFactory = (config: any, esriLayer: any, epsgLookup: any) => Promise<any>;
type LayerFactory = (data: any, options: any) => Promise<any>;

type WFSResponse = {
    data: { numberMatched: number; features: any[] };
};
type WFSData = { type: string; features: any[] };

type ValidationResult = {
    fields: any[];
    smartDefaults: { lat: any; long: any; primary: any };
    latFields: any[];
    longFields: any[];
};

type QueryMap = { [name: string]: string };

/**
 * @module LayerBlueprint
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * LayerBlueprint is a construct which can load data (for WFS right now; need to implement file loading through the config), valide it, and create LayerRecords.
 * It also support additional options (through mixins) like layer and field options need for the layer wizard (when the user can select the primary field).
 *
 */
angular.module('app.geo').factory('LayerBlueprint', LayerBlueprint);

LayerBlueprint.$inject = ['$http', '$q', 'Geo', 'gapiService', 'ConfigObject', 'appInfo', 'configService'];

function LayerBlueprint($http: any, $q: any, Geo: any, gapiService: any, ConfigObject: any, appInfo: any, configService: any) {

    /**
     * The base class for the mixins. This just declares what base properties are available across mixins.
     *
     * @class LayerBlueprintMixin
     */
    class LayerBlueprintMixin {
        config: any;
        type: string;
        layerRecordFactory: LayerRecordFactory;
    }

    /**
     * The mixin handling layers with client side-data (file-based layers and WFS).
     *
     * @class ClientSideData
     * @extends {LayerBlueprintMixin}
     */
    class ClientSideData extends LayerBlueprintMixin {
        _layer: any;

        _rawData: any;
        _formattedData: any;

        _validationResult: any;
        _isDataValid: any;

        /**
         * Specifies if layer data can be reloaded. If the user imported a file from his local filesystem, there is no mechanism to automatically reload such a file.
         * In such cases, when `_makeLayer` is called with `force`, raw layer data will not be reset.
         *
         * @type {boolean}
         * @memberof ClientSideData
         */
        _isDataPreloaded: boolean;

        // function to create an ESRI layer object
        layerFactory: LayerFactory;

        /**
         * Sets raw layer's raw data. Using this function assumes there is no mechanism to reload the raw layer data.
         *
         * @memberof ClientSideData
         */
        setRawData(value: any = null) {
            this._rawData = value;
            this._isDataPreloaded = true;
        }

        // WFS layer overrides this since it has a special loading behaviour
        async loadData(): Promise<any> {
            // TODO: change type 'any' here if possible
            const [error, response] = await to<any>($http.get(this.config.url, {
                responseType: 'blob'
            }));

            if (!response) {
                console.error(`File data failed to load for "${this.config.id}"`, error);
                return Promise.reject(error);
            }

            const reader = new FileReader();

            return $q((resolve: any, reject: any) => {
                reader.onerror = error => {
                    console.error(`File data failed to load for "${this.config.id}"`, error);
                    reject({ reason: 'error', message: 'Failed to read file' });
                };
                reader.onload = () =>
                    resolve(reader.result);

                reader.readAsArrayBuffer(response.data);
            });
        }

        /**
         * Loads (if necessary) and validates the layer's data.
         *
         * @param {string} [type=this.type]
         * @param {boolean} [isEncoded=true] if `true`, the layer data is encoded and passed as a byte array
         * @returns {Promise<any>} a promise of the validation result
         * @memberof ClientSideData
         */
        async validate(type: string = this.type, isEncoded: boolean = true): Promise<any> {
            // is already validation, return the stored validation result
            if (this._isDataValid) {
                return Promise.resolve(this._validationResult);
            }
            let error;

            // load data only once
            if (!this._rawData) {
                [error, this._rawData] = await to(this.loadData());

                if (error) {
                    console.error(`Layer data failed to load for "${this.config.id}"`, error);
                    return Promise.reject(error);
                }
            }

            // validate the file data and store it
            [error, this._validationResult] = await to(
                gapiService.gapi.layer.validateFile(type, this._rawData, isEncoded)
            );

            if (!this._validationResult) {
                console.error(`Layer data is not valid for "${this.config.id}"`, error);
                return Promise.reject(error);
            }

            this._formattedData = this._validationResult.formattedData;
            this._isDataValid = true;

            return this._validationResult;
        }

        /**
         * Creates an ESRI layer object from the config and formatted data.
         *
         * @param {LayerFactory} layerFactory a GeoAPI function to create an ESRI layer of a certain type (CSV, GeoJSON, Shapefile, etc)
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @param {*} config a layer definition config object
         * @returns {Promise<any>}
         * @memberof ClientSideData
         */
        async _makeLayer(force: boolean = false): Promise<any> {
            if (this._layer && !force) {
                return Promise.resolve(this._layer);
            }

            // reset valid data flag and the raw data when force-reloading
            // during the validation step, raw data will be re-downloaded
            if (force && !this._isDataPreloaded) {
                [this._isDataValid, this._rawData] = [false, null];
            }

            await this.validate();

            // TODO: targetWkid property should be added to the WFS layer config node
            this.config.targetWkid = configService.getSync.map.instance.spatialReference.wkid;

            // clone data because the makeSomethingLayer functions mangle the config data
            const clonedFormattedData = angular.copy(this._formattedData);

            const [error, layer] = await to(this.layerFactory(clonedFormattedData, this.config));

            if (!layer) {
                console.error(`ESRI Layer creation failed for "${this.config.id}"`, error);
                return Promise.reject(error);
            }

            this._layer = layer;

            return this._layer;
        }
    }

    /**
     * The mixin handling layers with server-side data.
     *
     * @class ServerSideData
     * @extends {LayerBlueprintMixin}
     */
    class ServerSideData extends LayerBlueprintMixin {
        /**
         * All service-based layers with server-data do not need any validation.
         * WFS layers are local-data layers since it needs to be downloaded and punched into the map as a GeoJSON layer.
         *
         * @returns {Promise<void>}
         * @memberof ServerSideData
         */
        validate(): Promise<void> {
            return Promise.resolve();
        }
    }

    /**
     * The base mixin of all LayerBlueprints. Because JS doesn't allow multiple inheritance, mixins are used. The base mixin provides/defines common functions across all blueprints like `makeLayerRecord`.
     *
     * @class BlueprintBase
     * @extends {LayerBlueprintMixin}
     */
    class BlueprintBase extends LayerBlueprintMixin {
        _originalConfig: any;
        _layerRecord: any;

        /**
         * Takes in the raw JSON layer config definition, types it and stores it.
         *
         * @param {*} rawConfig
         * @param {new (config: any) => void} ConfigClass
         * @memberof BlueprintBase
         */
        _setConfig(rawConfig: any, ConfigClass: new (config: any) => void): void {
            this.config = new ConfigClass(rawConfig);
            this.config.epsgLookup = appInfo.features.epsg.lookup;

            // if there was a bookmark with enhancements for this layer, apply them.
            if (rawConfig.bookmarkData) {
                this.config.applyBookmark(rawConfig.bookmarkData);
            }

            // hack fix for broken cors support
            // FIXME sometimes there is no map instance ready at this point (usually during initial language change). figure out if our timing is wrong
            if (this.config.url && configService.getSync.map.instance) {
                // if ESRI JSAPI fixes it's CORS bug this can be removed
                configService.getSync.map.instance.checkCorsException(this.config.url);
            }

            this.backup();
            this.reset();
        }

        /**
         * Backups the original config to it can be restored. Used in the layer wizard to reset user-made changes to the layer configuration.
         *
         * @memberof ServiceSourceBase
         */
        backup() {
            this._originalConfig = angular.copy(this.config);
        }

        /**
         * Restores the original config replacing the current config.
         *
         * @memberof ServiceSourceBase
         */
        reset() {
            this._layerRecord = null;
            this.config = angular.copy(this._originalConfig);
        }

        /**
         * Creates and returns a promise resolving with a LayerRecord instance.
         * When a layer is added through the wizard, the its LayerRecord object is made as the last step during the import process. This is done to catch any possible errors before actually adding the layer to the map.
         * After this, the LayerBlueprint is passed to the layer registry which will call the `makeLayerRecord` function again as it normally does when loading layers from the config. In such cases, the already created LayerRecord is returned.
         * When a layer is reloaded, the LayerRecord needs to be made anew.
         *
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @param {*} [esriLayer=null]
         * @returns {Promise<any>}
         * @memberof BlueprintBase
         */
        makeLayerRecord(force: boolean = false, esriLayer: any = null): Promise<any> {
            // if the LayerRecord was generated (during wizard's last validation step for example), just return that
            if (this._layerRecord && !force) {
                return Promise.resolve(this._layerRecord);
            }

            this._layerRecord = this.layerRecordFactory(this.config, esriLayer, this.config.epsgLookup);

            return Promise.resolve(this._layerRecord);
        }
    }

    /**
     * Provides support for lat/long field option on the layer config. Used in the layer wizard.
     *
     * @class LatLongOption
     * @extends {LayerBlueprintMixin}
     */
    class LatLongOption extends LayerBlueprintMixin {
        latFields: any[];
        longFields: any[];

        setLatLongOptions(validationResult: ValidationResult): void {
            this.latFields = validationResult.latFields;
            this.longFields = validationResult.longFields;

            // if the latField is already set once (through UI/config option), do not reset it to the default latitude
            if (!this.config.latfield) {
                this.config.latfield = validationResult.smartDefaults.lat;
            }

            // if the lonfield is already set once (through UI/config option), do not reset it to the default longitude
            if (!this.config.lonfield) {
                this.config.lonfield = validationResult.smartDefaults.long;
            }
        }
    }

    /**
     * Provides support for fields options on the layer config. Used in the layer wizard.
     *
     * @class FieldsOption
     * @extends {LayerBlueprintMixin}
     */
    class FieldsOption extends LayerBlueprintMixin {
        fields: any[];

        setFieldsOptions(validationResult: ValidationResult): void {
            // TODO: need to explicitly set this in the config object on creation
            // TODO: this won't be needed after proper typed configs are made for the file-based layers
            // if the nameField is already set once (through UI/config option), do not reset it to the default primary
            if (!this.config.nameField) {
                this.config.nameField = validationResult.smartDefaults.primary;
            }
            this.fields = validationResult.fields;

            // number all the fields, so even fields with equal names can be distinguished by the md selector
            this.fields.forEach((field, index) => (field.index = index));
        }
    }

    /**
     * Provides support for layers options on the layer config. Used in the layer wizard.
     *
     * @class LayersOption
     * @extends {LayerBlueprintMixin}
     */
    class LayersOption extends LayerBlueprintMixin {
        layers: any[];

        setLayersOptions(layers: any[]): void {
            this.layers = layers;
        }
    }

    // #region [True Services]

    /**
     * Feature layer blueprint.
     *
     * @class FeatureServiceSource
     * @extends {mixins(BlueprintBase, ServerSideData, FieldsOption)}
     */
    class FeatureServiceSource extends mixins(BlueprintBase, ServerSideData, FieldsOption) {
        /**
         * Creates an instance of FeatureServiceSource.
         * @param {*} rawConfig a JSON object represing a layer config taken either from the config file or from the LayerSource service.
         * @memberof FeatureServiceSource
         */
        constructor(rawConfig: any) {
            super();

            // type the config object and apply defaults
            this._setConfig(rawConfig, ConfigObject.layers.FeatureLayerNode);
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createFeatureRecord;
        }

        /**
         * The service type.
         *
         * @readonly
         * @memberof FeatureServiceSource
         */
        get type() {
            return Geo.Service.Types.FeatureLayer;
        }
    }

    /**
     * Dynamic layer blueprint.
     *
     * @class DynamicServiceSource
     * @extends {mixins(BlueprintBase, ServerSideData, LayersOption)}
     */
    class DynamicServiceSource extends mixins(BlueprintBase, ServerSideData, LayersOption) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.DynamicLayerNode);
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createDynamicRecord;
        }

        get type() {
            return Geo.Service.Types.DynamicService;
        }
    }

    /**
     * WMS layer blueprint.
     *
     * @class WMSServiceSource
     * @extends {mixins(BlueprintBase, ServerSideData, LayersOption)}
     */
    class WMSServiceSource extends mixins(BlueprintBase, ServerSideData, LayersOption) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.WMSLayerNode);
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createWmsRecord;
        }

        get type() {
            return Geo.Service.Types.WMS;
        }
    }

    /**
     * Image layer blueprint.
     *
     * @class ImageServiceSource
     * @extends {mixins(BlueprintBase, ServerSideData)}
     */
    class ImageServiceSource extends mixins(BlueprintBase, ServerSideData) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.BasicLayerNode);
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createImageRecord;
        }

        get type() {
            return Geo.Service.Types.ImageService;
        }
    }

    /**
     * Tile layer blueprint.
     *
     * @class TileServiceSource
     * @extends {mixins(BlueprintBase, ServerSideData)}
     */
    class TileServiceSource extends mixins(BlueprintBase, ServerSideData) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.BasicLayerNode);
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createTileRecord;
        }

        get type() {
            return Geo.Service.Types.TileService;
        }
    }

    /**
     * WFS layer blueprint.
     *
     * @class WFSServiceSource
     * @extends {mixins(BlueprintBase, ClientSideData)}
     */
    class WFSServiceSource extends mixins(BlueprintBase, ClientSideData, FieldsOption) {
        _urlWrapper: UrlWrapper;

        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.WFSLayerNode);
        }

        /**
         * Creates an ESRI layer first (since WFS is based on the local data) and passes it to the base mixin's `makeLayerRecord` function.
         *
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @returns {Promise<any>}
         * @memberof WFSServiceSource
         */
        async makeLayerRecord(force: boolean = false): Promise<any> {
            const layer = await super._makeLayer(force);
            return super.makeLayerRecord(force, layer);
        }

        /**
         * Loads WFS data.
         *
         * @returns {Promise<any>}
         * @memberof WFSServiceSource
         */
        async loadData(): Promise<any> {
            this._urlWrapper = new UrlWrapper(this.config.url);

            // get start index and limit set on the url
            const { startindex, limit } = this._urlWrapper.queryMap;

            return this._getWFSData(-1, parseInt(startindex) || 0, parseInt(limit) || 1000);
        }

        /**
         * Validates WFS layer as GeoJSON. Default validation uses the service type, and there is no explicit validation function for WFS.
         *
         * @returns any
         * @memberof WFSServiceSource
         */
        validate(): any {
            // WFS layer data is not encoded as a byte array, it's pure JSON
            return super.validate(Geo.Service.Types.GeoJSON, false).then(validationResult => {
                this.setFieldsOptions(validationResult);
                return validationResult;
            });
        }

        get layerFactory(): LayerFactory {
            return gapiService.gapi.layer.makeGeoJsonLayer;
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createFeatureRecord;
        }

        get type() {
            return Geo.Service.Types.WFS;
        }

        /**
         *
         *
         * @param {number} [totalCount=-1] the total number of items available on that service
         * @param {number} [startindex=0] the index to start the querying from. default 0
         * @param {number} [limit=1000] the limit of how many results we want returned. default 10
         * @param {WFSData} [wfsData={
         *                 type: 'FeatureCollection',
         *                 features: []
         *             }] the resulting GeoJSON being populated as we receive layer information
         * @returns {Promise<any>} a promise resolving with the layer GeoJSON
         * @memberof WFSServiceSource
         */
        async _getWFSData(
            totalCount: number = -1,
            startindex: number = 0,
            limit: number = 1000,
            wfsData: WFSData = {
                type: 'FeatureCollection',
                features: []
            }
        ): Promise<any> {
            let newQueryMap: QueryMap = { startindex: startindex.toString(), limit: limit.toString() };

            // it seems that some WFS services do not return the number of matched records with every request
            // so, we need to get that explicitly first
            if (totalCount === -1) {
                // get the total number of records
                newQueryMap = {
                    request: 'GetFeature',
                    resultType: 'hits',
                    limit: '0'
                };
            }

            const requestUrl = this._urlWrapper.updateQuery(newQueryMap);

            // use angular to make web request, instead of esriRequest. this is because we can't rely on services having jsonp
            const [error, response] = await to<WFSResponse>($http.get(requestUrl));

            if (!response) {
                console.error(`WFS data failed to load for "${this.config.id}"`, error);
                return Promise.reject(error);
            }

            const data = response.data;

            // save the total number of records and start downloading the data
            if (totalCount === -1) {
                totalCount = response.data.numberMatched;
                return this._getWFSData(totalCount, startindex, limit, wfsData);
            }

            wfsData.features = [...wfsData.features, ...data.features]; // update the received features array

            // check if all the requested features are downloaded
            if (data.features.length < totalCount - startindex) {
                // the limit is either 1k or the number of remaining features
                const limit = Math.min(1000, totalCount - startindex - data.features.length);
                return this._getWFSData(totalCount, data.features.length + startindex, limit, wfsData);
            } else {
                if (
                    this.config.xyInAttribs &&
                    wfsData.features.length > 0 &&
                    wfsData.features[0].geometry.type === 'Point'
                ) {
                    // attempt copy of points to attributes.
                    // if we extend this logic to all feature based layers (not just wfs),
                    // suggest porting this block to geoApi.
                    // for now, easier to modify as early as possible in the transformation

                    wfsData.features.forEach(f => {
                        const p = f.geometry.coordinates;
                        f.properties.rvInternalCoordX = p[0];
                        f.properties.rvInternalCoordY = p[1];
                    });
                }
                return wfsData;
            }
        }
    }

    // #endregion

    // #region [True Files]

    /**
     * CSV layer blueprint.
     *
     * @class CSVSource
     * @extends {mixins(BlueprintBase, ClientSideData, LatLongOption, FieldsOption)}
     */
    class CSVSource extends mixins(BlueprintBase, ClientSideData, LatLongOption, FieldsOption) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.FileLayerNode);
        }

        /**
         * Creates an ESRI layer first (since file-based layer are based on the local data) and passes it to the base mixin's `makeLayerRecord` function.
         *
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @returns {Promise<any>}
         * @memberof CSVSource
         */
        async makeLayerRecord(force: boolean = false): Promise<any> {
            const layer = await super._makeLayer(force);
            return super.makeLayerRecord(force, layer);
        }

        /**
         * Valides the file data and set up available options.
         *
         * @returns {Promise<any>}
         * @memberof CSVSource
         */
        async validate(): Promise<any> {
            const validationResult = await super.validate();
            this.setLatLongOptions(validationResult);
            this.setFieldsOptions(validationResult);

            return Promise.resolve(true);
        }

        get layerFactory(): LayerFactory {
            return gapiService.gapi.layer.makeCsvLayer;
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createFeatureRecord;
        }

        get type() {
            return Geo.Service.Types.CSV;
        }
    }

    class GeoJSONSource extends mixins(BlueprintBase, ClientSideData, FieldsOption) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.FileLayerNode);
        }

        /**
         * Creates an ESRI layer first (since file-based layer are based on the local data) and passes it to the base mixin's `makeLayerRecord` function.
         *
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @returns {Promise<any>}
         * @memberof GeoJSONSource
         */
        async makeLayerRecord(force: boolean = false): Promise<any> {
            const layer = await super._makeLayer(force);
            return super.makeLayerRecord(force, layer);
        }

        /**
         * Valides the file data and set up available options.
         *
         * @returns {Promise<any>}
         * @memberof GeoJSONSource
         */
        async validate(): Promise<any> {
            const validationResult = await super.validate();
            this.setFieldsOptions(validationResult);

            return Promise.resolve(true);
        }

        get layerFactory(): LayerFactory {
            return gapiService.gapi.layer.makeGeoJsonLayer;
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createFeatureRecord;
        }

        get type() {
            return Geo.Service.Types.GeoJSON;
        }
    }

    class ShapefileSource extends mixins(BlueprintBase, ClientSideData, FieldsOption) {
        constructor(rawConfig: any) {
            super();

            this._setConfig(rawConfig, ConfigObject.layers.FileLayerNode);
        }

        /**
         * Creates an ESRI layer first (since file-based layer are based on the local data) and passes it to the base mixin's `makeLayerRecord` function.
         *
         * @param {boolean} [force=false] if `true`, the layer will be made even if it was already made earlier
         * @returns {Promise<any>}
         * @memberof ShapefileSource
         */
        async makeLayerRecord(force: boolean = false): Promise<any> {
            const layer = await super._makeLayer(force);
            return super.makeLayerRecord(force, layer);
        }

        /**
         * Valides the file data and set up available options.
         *
         * @returns {Promise<any>}
         * @memberof ShapefileSource
         */
        async validate(): Promise<any> {
            const validationResult = await super.validate();
            this.setFieldsOptions(validationResult);

            return Promise.resolve(true);
        }

        get layerFactory(): LayerFactory {
            return gapiService.gapi.layer.makeGeoJsonLayer;
        }

        get layerRecordFactory(): LayerRecordFactory {
            return gapiService.gapi.layer.createFeatureRecord;
        }

        get type() {
            return Geo.Service.Types.Shapefile;
        }
    }

    // #endregion

    // #region [Util]

    /**
     * This is a helper class to handle getting and setting query parameters on a url easy.
     *
     * @class UrlWrapper
     */
    class UrlWrapper {
        _url: string;
        _base: string;
        _query: string;
        _queryMap: QueryMap = {};

        constructor(url: string) {
            this._url = url;
            // split the base and query
            [this._base, this._query] = url.split('?').concat('');

            // convert the query part into a mapped object
            this._queryMap = this._query.split('&').reduce((map: QueryMap, parameter: string) => {
                const [key, value] = parameter.split('=');
                map[key] = value;
                return map;
            }, {});
        }

        get query(): string {
            return this._query;
        }

        get base(): string {
            return this._base;
        }

        get queryMap(): QueryMap {
            return this._queryMap;
        }

        /**
         * Updates the query part of the url with passed in values.
         *
         * For example:
         *  - orginal url: http://example?flag=red&demohell=true
         *  - queryMapUpdate: {
         *     flag: undefined,
         *     demohell: false,
         *     acid: cat
         * }
         * - resulting url: http://example?demohell=false&acid=cat
         *
         *
         * @param {QueryMap} queryMapUpdate an object of values to be added or replaced on the query of the url; if any values are undefined, their corresponding keys will be removed from the query.
         * @returns {string}
         * @memberof UrlWrapper
         */
        updateQuery(queryMapUpdate: QueryMap): string {
            const requestQueryMap: QueryMap = angular.merge({}, this.queryMap, queryMapUpdate);
            const requestUrl = `${this.base}${Object.entries(requestQueryMap)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value], index) => `${index === 0 ? '?' : ''}${key}=${value}`)
                .join('&')}`;

            return requestUrl;
        }
    }

    // #endregion

    function makeBlueprint(rawConfig: any): BlueprintBase {
        const constructors = {
            [Geo.Layer.Types.ESRI_DYNAMIC]: DynamicServiceSource,
            [Geo.Layer.Types.ESRI_IMAGE]: ImageServiceSource,
            [Geo.Layer.Types.ESRI_TILE]: TileServiceSource,
            [Geo.Layer.Types.OGC_WMS]: WMSServiceSource,
            [Geo.Layer.Types.OGC_WFS]: WFSServiceSource,
            [Geo.Layer.Types.ESRI_FEATURE]: FeatureServiceSource,

            // service types used for loading file-layers through config
            [Geo.Service.Types.CSV]: CSVSource,
            [Geo.Service.Types.GeoJSON]: GeoJSONSource,
            [Geo.Service.Types.Shapefile]: ShapefileSource
        };

        // if 'fileType' is a property, then we know we are dealing with a file based layer.
        // the layerType for these will still be 'esriFeature' but we need to know which type of file it is using 'fileType'
        const serviceSource = new constructors[rawConfig.fileType ? rawConfig.fileType : rawConfig.layerType](rawConfig);
        return serviceSource;
    }

    const service = {
        FeatureServiceSource,
        DynamicServiceSource,
        WMSServiceSource,
        WFSServiceSource,
        ImageServiceSource,
        TileServiceSource,

        CSVSource,
        GeoJSONSource,
        ShapefileSource,

        makeBlueprint,

        UrlWrapper
    };

    return service;
}
