/**
 * @module LayerBlueprintFactory
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * The `LayerBlueprint` service returns `LayerBlueprint` class which abstracts common elements of layer creating (either from file or online servcie).
 * The `LayerServiceBlueprint` service returns `LayerServiceBlueprint` class to be used when creating layers from online services (supplied by config, RCS or user added).
 * The `LayerFileBlueprint` service returns `LayerFileBlueprint` class to be used when creating layers from user-supplied files.
 *
 */
angular
    .module('app.geo')
    .factory('LayerBlueprint', LayerBlueprintFactory);

function LayerBlueprintFactory($q, $http, LayerBlueprintUserOptions, gapiService, Geo,
    layerDefaults, LayerRecordFactory, ConfigObject, common) {

    let idCounter = 0; // layer counter for generating layer ids

    // destructure Geo into `layerTypes` and `serviceTypes`
    const { Layer: { Types: layerTypes }, Service: { Types: serviceTypes } } = Geo;

    class LayerBlueprint {
        /**
         * Creates a new LayerBlueprint.
         * @param  {Object} initialConfig partial config, can be an empty object.
         * @param  {Function} epsgLookup a function which takes and EPSG code and returns a projection definition (see geoService for the exact signature)
         */
        constructor() { }

        set config(value) {
            if (this._config) {
                console.warn('config is already set');
                return;
            }
            this._config = value;
        }
        get config() { return this._config; }

        /**
         * @returns {Object} layer node source config object with applied defaults
         */
        get source() { return this._source; }
        set source(value) {
            if (this._source) {
                console.warn('source is already set');
                return;
            }

            this._source = value;
            this.config = new LayerBlueprint.LAYER_TYPE_TO_LAYER_NODE[this._source.layerType](this._source);
        }

        /**
         * Sets layer type.
         * @param  {String} value layer type as String
         */
        set layerType(value) {
            // apply config defaults when setting layer type
            this.config.layerType = value;
            this._applyDefaults();

            // generate id if missing when generating layer
            if (typeof this.config.id === 'undefined') {
                this.config.id = `${this.layerType}#${idCounter++}`;
            }
        }

        /**
         * Generates a layer object. This is a stub function to be fully implemented by subcalasses.
         * @return {Object} "common config" ? witch contains layer id
         */
        generateLayer() {
            throw new Error('Call generateLayer on a subclass instead.');
        }

        static get LAYER_TYPE_TO_LAYER_NODE() {
            return {
                [layerTypes.ESRI_TILE]: ConfigObject.layers.BasicLayerNode,
                [layerTypes.ESRI_FEATURE]: ConfigObject.layers.FeatureLayerNode,
                [layerTypes.ESRI_IMAGE]: ConfigObject.layers.BasicLayerNode,
                [layerTypes.ESRI_DYNAMIC]: ConfigObject.layers.DynamicLayerNode,
                [layerTypes.OGC_WMS]: ConfigObject.layers.WMSLayerNode
            }
        };

        static get LAYER_TYPE_TO_LAYER_RECORD() {
            const gapiLayer = gapiService.gapi.layer;

            return {
                [layerTypes.ESRI_TILE]: gapiLayer.createTileRecord,
                [layerTypes.ESRI_FEATURE]: gapiLayer.createFeatureRecord,
                [layerTypes.ESRI_IMAGE]: gapiLayer.createImageRecord,
                [layerTypes.ESRI_DYNAMIC]: gapiLayer.createDynamicRecord,
                [layerTypes.OGC_WMS]: gapiLayer.createWmsRecord
            }
        }
    }

    class LayerServiceBlueprint extends LayerBlueprint {
        /**
         * Creates a new LayerServiceBlueprint.
         * @param  {Object|LayerSourceInfo} source fully-formed layer config object coming from the config file, or the layerSourceInfo object coming from thel layer loader
         */
        constructor(configFileSource = null, userAddedSource = null) {

            super();

            if (configFileSource) {
                this.source = configFileSource;
            } else if (userAddedSource) {
                this.config = userAddedSource.config;
            }

            return;
        }

        /**
         * Generates a layer from an online service based on the layer type.
         * Takes a layer in the config format and generates an appropriate layer object.
         * @param {Object} layerConfig a configuration fragment for a single layer
         * @return {Promise} resolving with a LayerRecord object matching one of the esri/layers objects based on the layer type
         */
        generateLayer() {

            return LayerBlueprint.LAYER_TYPE_TO_LAYER_RECORD[this.config.layerType](
                this.config, undefined, epsgLookup);
        }
    }

    /**
     * Create a LayerFileBlueprint.
     * Retrieves data from the file. The file can be either online or local.
     * @param  {Function} epsgLookup a function which takes and EPSG code and returns a projection definition (see geoService for the exact signature)
     * @param  {Number} targetWkid wkid of the current map object
     * @param  {String} path      either file name or file url; if it's a file name, need to provide a HTML5 file object
     * @param  {File} file      optional: HTML5 file object
     * @return {Function} progressCallback        optional: function to call on progress events druing when reading file
     * @return {String}           service type: 'csv', 'shapefile', 'geojson'
     */
    class LayerFileBlueprint extends LayerBlueprint {
        constructor(layerSource) {
            super();
            this._layerSource = layerSource;
            this.config = this._layerSource.config;
        }

        validateFileLayerSource() {
            // clone data because the makeSomethingLayer functions mangle the config data
            const formattedDataCopy = angular.copy(this._layerSource.formattedData);

            // HACK: supply epsgLookup here;
            // TODO: find a better place for it
            this._layerSource.epsgLookup = epsgLookup;

            const layerFileGenerators = {
                [Geo.Service.Types.CSV]: () =>
                    gapiService.gapi.layer.makeCsvLayer(formattedDataCopy, this._layerSource),
                [Geo.Service.Types.GeoJSON]: () =>
                    gapiService.gapi.layer.makeGeoJsonLayer(formattedDataCopy, this._layerSource),
                [Geo.Service.Types.Shapefile]: () =>
                    gapiService.gapi.layer.makeShapeLayer(formattedDataCopy, this._layerSource)
            };

            const layerPromise = layerFileGenerators[this._layerSource.type]();

            layerPromise.then(layer =>
                (this.__layer__ = layer));

            return layerPromise;
        }

        /**
         * Generate actual esri layer object from the file data, config and user options.
         * @return {Promise} promise resolving with the esri layer object
         */
        generateLayer() {
            // TODO: provide epsgLookup to builder function
            return LayerBlueprint.LAYER_TYPE_TO_LAYER_RECORD[this.config.layerType](this.config, this.__layer__);
        }
    }

    /**
     * Lookup a proj4 style projection definition for a given ESPG code.
     * @function epsgLookup
     * @param {string|number} code the EPSG code as a string or number
     * @return {Promise} a Promise resolving to proj4 style definition or null if the definition could not be found
     */
    function epsgLookup(code) {
        // FIXME this should be moved to a plugin; it is hardcoded to use epsg.io

        const urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
        const epsgRegex = /EPSG:(\d+)/;
        let lookup = code;
        if (typeof lookup === 'number') {
            lookup = String(lookup);
        }
        const urnMatches = lookup.match(urnRegex);
        if (urnMatches) {
            lookup = urnMatches[1];
        }
        const epsgMatches = lookup.match(epsgRegex);
        if (epsgMatches) {
            lookup = epsgMatches[1];
        }

        return $http.get(`http://epsg.io/${lookup}.proj4`)
            .then(response =>
                response.data)
            .catch(err => {
                RV.logger.warn('geoService', 'proj4 style projection lookup failed with error', err);
                // jscs check doesn't realize return null; returns a promise
                return null; // jscs:ignore jsDoc
            });
    }

    const service = {
        service: LayerServiceBlueprint,
        file: LayerFileBlueprint
    };

    return service;
}
