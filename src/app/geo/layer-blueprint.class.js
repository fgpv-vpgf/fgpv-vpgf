(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name LayerBlueprint
     * @module app.geo
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

    function LayerBlueprintFactory($q, LayerBlueprintUserOptions, gapiService, Geo, layerDefaults, LayerRecordFactory) {
        let idCounter = 0; // layer counter for generating layer ids

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class LayerBlueprint {
            /**
             * Creates a new LayerBlueprint.
             * @param  {Object} initialConfig partial config, can be an empty object.
             */
            constructor(initialConfig) {
                this.initialConfig = {};
                this.config = {};

                if (typeof initialConfig !== 'undefined') {
                    this.initialConfig = initialConfig;
                    this.config = angular.merge({}, initialConfig);
                }

                this._applyDefaults();

                this._userOptions = {};
            }

            /**
             * Applies layer defaults based on the layer type.
             */
            _applyDefaults() {
                if (this.layerType !== null) {
                    const defaults = layerDefaults[this.layerType];

                    // TODO: add defautls for wms and dynamic layerEntries
                    // this is mostly useless right now since we apply defaults in `legend-entry` service
                    this.config.options = angular.merge({}, defaults.options, this.initialConfig.options);
                    this.config.flags = angular.merge({}, defaults.flags, this.initialConfig.flags);
                }
            }

            /**
             * Returns layer type or null if not set of the blueprint.
             * @return {String|null} layer type as String or null
             */
            get layerType() {
                return (typeof this.config.layerType !== 'undefined') ? this.config.layerType : null;
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
             * Returns user layer options class instance or a plain object if type is not yet set.
             * @return {Object} user options
             */
            get userOptions() {
                return this._userOptions;
            }

            /**
             * Generates a layer object. This is a stub function to be fully implemented by subcalasses.
             * @return {Object} "common config" ? witch contains layer id
             */
            generateLayer() {
                throw new Error('Call generateLayer on a subclass instead.');
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const serviceTypeToLayerType = {
            [Geo.Service.Types.FeatureLayer]: Geo.Layer.Types.ESRI_FEATURE,
            [Geo.Service.Types.DynamicService]: Geo.Layer.Types.ESRI_DYNAMIC,
            [Geo.Service.Types.TileService]: Geo.Layer.Types.ESRI_TILE,
            [Geo.Service.Types.ImageService]: Geo.Layer.Types.ESRI_IMAGE,
            [Geo.Service.Types.WMS]: Geo.Layer.Types.OGC_WMS
        };

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class LayerServiceBlueprint extends LayerBlueprint {
            /**
             * Creates a new LayerServiceBlueprint.
             * @param  {initialConfig} initialConfig partical config, __must__ contain a service `url`.
             */
            constructor(initialConfig) {
                if (typeof initialConfig.url === 'undefined') {
                    // TODO: throw error ?
                    console.error('Service layer needs a url.');
                    return;
                } else {
                    // `replace` strips trailing slashes
                    initialConfig.url = initialConfig.url.replace(/\/+$/, '');
                }

                super(initialConfig);

                this._serviceInfo = null;
                this._constructorPromise = $q.resolve();

                // empty blueprint is not valid by default
                this._validPromise = $q.reject();

                // if layerType is no specified, this is likely a user added layer
                // call geoApi to predict its type
                if (this.layerType === null) {
                    this._constructorPromise = this._fetchServiceInfo();

                    /*.catch(error => {
                        console.error('Something happened', error);
                    });*/
                }
            }

            _fetchServiceInfo() {
                const hint = this._serviceInfo !== null ? this._serviceInfo.serviceType : undefined;

                // due to #702, wms detection is problematic; here are some workarounds
                // TODO: refactor when abovementioned issue is resolved
                return $q.resolve(gapiService.gapi.layer.ogc.parseCapabilities(this.config.url))
                    .then(data => {
                        if (data.layers.length > 0) { // if there are layers, it's a wms layer
                            console.log(`${this.config.url} is a WMS, yak!`);

                            // return an object resembing fileInfo object returned by GeoAPi
                            return {
                                serviceType: Geo.Service.Types.WMS,
                                name: this.config.url,
                                layers: flattenLayers(data.layers)
                            };

                        } else {
                            console.log(`${this.config.url} is not a WMS, running more checks.`);
                            return gapiService.gapi.layer.predictLayerUrl(this.config.url, hint);
                        }
                    })
                    .then(fileInfo => {
                        console.log(fileInfo);

                        // this is not a service URL;
                        if (fileInfo.serviceType === Geo.Service.Types.Error) {
                            return $q.reject(fileInfo); // reject promise if the provided url cannot be accessed
                        }

                        this._serviceInfo = fileInfo;
                        this.serviceType = this._serviceInfo.serviceType;
                        this.config.name = this._serviceInfo.name;

                        // some custom processing of Dynamic layers to let the user option to pick sublayers
                        if (this.serviceType === Geo.Service.Types.DynamicService) {
                            // TODO: this is temporary to get the relative level of dynamic layer sublayers
                            // something like this will be needed when an option provided to the user to pick dynamic sublayer which should be added to the map
                            // right now just add everything
                            /*this._serviceInfo.layers.forEach(layer => {
                                const level = calculateLevel(layer, this._serviceInfo);
                                layer.level = level;
                                layer.indent = Array.from(Array(level)).map(() => '-').join('');
                            });

                            function calculateLevel(layer, serviceInfo) {
                                if (layer.parentLayerId === -1) {
                                    return 0;
                                } else {
                                    return calculateLevel(serviceInfo.layers[layer.parentLayerId], serviceInfo) + 1;
                                }
                            }*/

                            // TODO: refactor
                            // this is to convert layerEntries to a proper config format
                            this.config.layerEntries = this._serviceInfo.layers
                                .filter(layer => layer.parentLayerId === -1) // pick all sub-top level items
                                .map(layer => {
                                    return {
                                        index: layer.id
                                    };
                                });
                        }
                    })
                    .catch(error => {
                        this._serviceInfo = null;
                        return $q.reject(error);
                    });

                function flattenLayers(layers, level = 0) {
                    return [].concat.apply([], layers.map(layer => {
                        layer.indent = Array.from(Array(level)).map(() => '-').join('');
                        if (layer.layers.length > 0) {
                            return [].concat(layer, flattenLayers(layer.layers, ++level));
                        } else {
                            return layer;
                        }
                    }));
                }
            }

            get serviceType() {
                // console.log(this._serviceInfo);

                if (this._serviceInfo !== null) {
                    return this._serviceInfo.serviceType;
                } else {
                    return null;
                }
            }

            set serviceType(value) {
                this._serviceInfo.serviceType = value;
                this.layerType = serviceTypeToLayerType[this._serviceInfo.serviceType];
            }

            // TODO: this needs to changed to display an error
            get valid() {
                // validate provided service type
                return this._constructorPromise
                    .then(() => this._fetchServiceInfo())
                    .then(() => {
                        this.layerType = serviceTypeToLayerType[this.serviceType];
                    })
                    .catch(error => console.error('Invalid selection' + error));
            }

            /**
             * Returns a constructor promise which resolves when service's data is retrieved.
             * @return {Promise} constructor promise
             */
            get ready() {
                return this._constructorPromise;
            }

            /**
             * Returns fields found in the file data.
             * @return {Array|null} array of fields in the form of [{ name: "Long", type: "esriFieldTypeString"}]
             */
            get fields() {
                // console.log(this._formatedFileData);

                if (this._serviceInfo !== null) {
                    return this._serviceInfo.fields;
                } else {
                    return null;
                }
            }

            get serviceInfo() {
                return this._serviceInfo;
            }

            /**
             * Generates a layer from an online service based on the layer type.
             * Takes a layer in the config format and generates an appropriate layer object.
             * @param {Object} layerConfig a configuration fragment for a single layer
             * @return {Promise} resolving with a LayerRecord object matching one of the esri/layers objects based on the layer type
             */
            generateLayer() {
                return $q.resolve(LayerRecordFactory.makeServiceRecord(this.config));
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        /**
         * Create a LayerFileBlueprint.
         * Retrieves data from the file. The file can be either online or local.
         * @param  {Function} epsgLookup epsgLookup function
         * @param  {Number} targetWkid wkid of the current map object
         * @param  {String} path      either file name or file url; if it's a file name, need to provide a HTML5 file object
         * @param  {File} file      optional: HTML5 file object
         * @return {Function} progressCallback        optional: function to call on progress events druing when reading file
         * @return {String}           service type: 'csv', 'shapefile', 'geojson'
         */
        class LayerFileBlueprint extends LayerBlueprint {
            constructor(epsgLookup, targetWkid, path, file, progressCallback = angular.noop) { // , extension) {
                super();

                // when passing file object, path is its name
                this._fileName = typeof file !== 'undefined' ? file.name : path;
                this._fileData = null;
                this._formatedFileData = null;
                this._fileType = null;

                this._epsgLookup = epsgLookup;
                this._targetWkid = targetWkid;

                // empty blueprint is not valid by default
                this._validPromise = $q.reject();

                this._constructorPromise = gapiService.gapi.layer.predictLayerUrl(path)
                    .then(fileInfo => {
                        // fileData is returned only if path is a url; if it's just a file name, only serviceType is returned                            this.fileData = fileInfo.fileData;
                        this.layerType = 'esriFeature';
                        this.fileType = fileInfo.serviceType;

                        if (typeof file !== 'undefined') {
                            // if there is file object, read it and store the data
                            return this._readFileData(file, progressCallback)
                                .then(fileData => this._fileData = fileData);
                        } else if (typeof fileInfo.fileData !== 'undefined') {
                            this._fileData = fileInfo.fileData;
                            return undefined;
                        } else {
                            throw new Error('Cannot retrieve file data');
                        }
                    });
            }

            _applyDefaults() {
                super._applyDefaults();
                if (this.config.options) {
                    this.config.options.reload.enabled = false;
                }
            }

            /**
             * Returns file type.
             * @return {String} file type
             */
            get fileType() {
                return this._fileType;
            }

            /**
             * Sets file type. Setting file type triggers file validation.
             * @param  {String} value file type
             */
            set fileType(value) {
                this._fileType = value;

                // create user options object based on the layer type
                const options = new LayerBlueprintUserOptions.File[this.fileType]
                    (this._epsgLookup, this._targetWkid);
                options.layerName = this._fileName;

                this._validPromise = this._constructorPromise
                    .then(() => gapiService.gapi.layer.validateFile(this.fileType, this._fileData))
                    .then(result => {
                        this._userOptions = options;
                        this._formatedFileData = result;
                    })
                    .catch(error => console.error(error));
            }

            // TODO: this needs to changed to display an error
            get valid() {
                return this._validPromise;
            }

            /**
             * Returns a constructor promise which resolves when file's data is loaded and read in.
             * @return {Promise} constructor promise
             */
            get ready() {
                return this._constructorPromise;
            }

            /**
             * Returns fields found in the file data.
             * @return {Array|null} array of fields in the form of [{ name: "Long", type: "esriFieldTypeString"}]
             */
            get fields() {
                // console.log(this._formatedFileData);

                if (this._formatedFileData !== null) {
                    return this._formatedFileData.fields;
                } else {
                    return null;
                }
            }

            /**
             * Reads HTML5 File object data.
             * @private
             * @param  {File} file [description]
             * @return {Promise}      promise resolving with file's data
             */
            _readFileData(file, progressCallback) {
                const dataPromise = $q((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = () => {
                        console.error('Failed to read a file');
                        reject('Failed to read a file');
                    };
                    reader.onload = () => {
                        console.log('Fully loaded');
                        resolve(reader.result); // ???
                    };
                    reader.onprogress = event => progressCallback(event);

                    reader.readAsArrayBuffer(file);
                });

                return dataPromise;
            }

            /**
             * Generate actual esri layer object from the file data, config and user options.
             * @return {Promise} promise resolving with the esri layer object
             */
            generateLayer() {
                // TODO: throw error if layer type is not defined

                // generator functions for different file types
                const layerFileGenerators = {
                    [Geo.Service.Types.CSV]: () =>
                        gapiService.gapi.layer.makeCsvLayer(this._formatedFileData.formattedData, this.userOptions),
                    [Geo.Service.Types.GeoJSON]:  () =>
                        gapiService.gapi.layer.makeGeoJsonLayer(this._formatedFileData.formattedData, this.userOptions),
                    [Geo.Service.Types.Shapefile]:  () =>
                        gapiService.gapi.layer.makeShapeLayer(this._fileData, this.userOptions),
                };

                // set layer id to the config id; this is needed when using file layer generator function
                this.userOptions.layerId = this.config.id;

                // apply user selected layer name to the config so it appears in the legend entry
                this.config.name = this.userOptions.layerName;

                console.log(this.userOptions);

                const layerPromise = layerFileGenerators[this.fileType]();
                return layerPromise.then(layer => LayerRecordFactory.makeFileRecord(this.config, layer));
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const service = {
            service: LayerServiceBlueprint,
            file: LayerFileBlueprint
        };

        return service;
    }
})();
