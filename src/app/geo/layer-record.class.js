(() => {
    /**
     * LayerRecordFactory is a lightweight wrapper around the LayerRecord class hierarchy.
     * It exposes various builder functions to create LayerRecord classes.
     * FIXME this can move into geoapi
     * @module LayerRecordFactory
     * @memberof app.geo
     */
    angular.module('app.geo').factory('LayerRecordFactory', LayerRecordFactory);

    function LayerRecordFactory(Geo, gapiService, $q) {
        const gapi = () => gapiService.gapi;

        /**
         * @class LayerRecord
         */
        class LayerRecord {
            get layerClass () { throw new Error('This should be overridden in subclasses'); }
            get config () { return this.initialConfig; } // TODO: add a live config reference if needed
            get legendEntry () { return this._legendEntry; } // legend entry class corresponding to those defined in legend entry service
            set legendEntry (value) { this._legendEntry = value; }
            get bbox () { return this._bbox; } // bounding box layer
            get state () { return this._state; }
            get layerId () { return this.config.id; }
            get _layerPassthroughBindings () { return ['setOpacity', 'setVisibility']; } // TODO when jshint parses instance fields properly we can change this from a property to a field
            get _layerPassthroughProperties () { return ['visibleAtMapScale', 'visible', 'spatialReference']; } // TODO when jshint parses instance fields properly we can change this from a property to a field

            /**
             * Generate a bounding box for the layer on the given map.
             */
            createBbox (map) {
                if (this._bbox) {
                    throw new Error('Bbox is already setup');
                }
                this._bbox = gapi().layer.bbox.makeBoundingBox(`bbox_${this._layer.id}`,
                                                               this._layer.fullExtent,
                                                               map.extent.spatialReference);
                map.addLayer(this._bbox);
            }

            /**
             * Destroy bounding box
             */
            destroyBbox (map) {
                map.removeLayer(this._bbox);
                this._bbox = undefined;
            }

            bindEvents (layer) {
                gapi().events.wrapEvents(layer, {
                    // wrapping the function calls to keep `this` bound correctly
                    load: () => this.onLoad(),
                    error: e => this.onError(e),
                    'update-start': () => this.onUpdateStart(),
                    'update-end': () => this.onUpdateEnd()
                });
            }

            constructLayer () {
                this._layer = this.layerClass(this.config.url, this.makeLayerConfig());
                this.bindEvents(this._layer);
                return this._layer;
            }

            _stateChange (newState) {
                this._state = newState;
                console.log(`State change for ${this.layerId} to ${newState}`);
                // if we don't copy the array we could be looping on an array
                // that is being modified as it is being read
                this._stateListeners.slice(0).forEach(l => l(this._state));
            }

            addStateListener (listenerCallback) {
                this._stateListeners.push(listenerCallback);
                return listenerCallback;
            }

            removeStateListener (listenerCallback) {
                const idx = this._stateListeners.indexOf(listenerCallback);
                if (idx < 0) {
                    throw new Error('Attempting to remove a listener which is not registered.');
                }
                this._stateListeners.splice(idx, 1);
            }

            onLoad () {
                if (this.legendEntry && this.legendEntry.removed) { return; }
                console.info(`Layer loaded: ${this._layer.id}`);
                let lookupPromise = Promise.resolve();
                if (this._epsgLookup) {
                    const check = gapi().proj.checkProj(this.spatialReference, this._epsgLookup);
                    if (check.lookupPromise) {
                        lookupPromise = check.lookupPromise;
                    }
                }
                lookupPromise.then(() => this._stateChange(Geo.Layer.States.LOADED));
            }

            onError (e) {
                console.warn(`Layer error: ${e}`);
                console.warn(e);
                this._stateChange(Geo.Layer.States.ERROR);
            }

            onUpdateStart () {
                this._stateChange(Geo.Layer.States.REFRESH);
            }

            onUpdateEnd () {
                this._stateChange(Geo.Layer.States.LOADED);
            }

            makeLayerConfig () {
                return {
                    id: this.config.id,
                    opacity: this.config.options.opacity.value,
                    visible: this.config.options.visibility.value
                };
            }

            /**
             * Creates a bookmark snippet for the layer
             *
             * @returns {String}    bookmark snippet containing info and state for the layer
             */
            makeLayerBookmark () { throw new Error('This should be overridden in subclasses'); }

            /**
             * Creates a config snippet (containing options) given a list of properties and values.
             *
             * @param {Array} props     The property names
             * @param {Array} info      The values for the properties
             * @param {String} version  Version of the bookmark data
             * @returns {Object}        config snippet for the layer
             */
            static parseData (props, info, version) {

                const lookup = {
                    opacity: value => {
                        if (version !== 'A' && value === '99') {
                            value = 100;
                        }
                        return parseInt(value) / 100;
                    },
                    visibility: value => {
                        if (version === 'A') {
                            return value === '1' ? true : null;
                        } else {
                            return value === '1';
                        }
                    },
                    boundingBox: value => value === '1',
                    snapshot: value => value === '1',
                    query: value => value === '1'
                };

                const result = { options: {} };

                props.forEach((prop, index) => {
                    result.options[prop] = { value: lookup[prop](info[index]) };
                });
                return result;
            }

            /**
             * Create a layer record with the appropriate geoApi layer type.  Layer config
             * should be fully merged with all layer options defined (i.e. this constructor
             * will not apply any defaults).
             * @param {Object} config layer config values
             * @param {Object} esriLayer an optional pre-constructed layer
             * @param {Function} epsgLookup an optional lookup function for EPSG codes (see geoService for signature)
             */
            constructor (config, esriLayer, epsgLookup) {
                this.initialConfig = config;
                this._stateListeners = [];
                this._epsgLookup = epsgLookup;
                this._layerPassthroughBindings.forEach(bindingName =>
                    this[bindingName] = (...args) => this._layer[bindingName](...args));
                this._layerPassthroughProperties.forEach(propName => {
                    const descriptor = {
                        enumerable: true,
                        get: () => this._layer[propName]
                    };
                    Object.defineProperty(this, propName, descriptor);
                });
                if (esriLayer) {
                    this.constructLayer = () => { throw new Error('Cannot construct pre-made layers'); };
                    this._layer = esriLayer;
                    this.bindEvents(this._layer);
                    this.state = Geo.Layer.States.LOADED;
                } else {
                    this.constructLayer(config);
                    this.state = Geo.Layer.States.LOADING;
                }

                // NOTE layer registry is responsible for adding the layer to the map
                // this avoids LayerRecord having an explicit dependency on the map object
            }

        }

        /**
         * @class AttrRecord
         */
        class AttrRecord extends LayerRecord {
            get attributeBundle () { return this._attributeBundle; }
            // FIXME clickTolerance is not specific to AttrRecord but rather Feature and Dynamic
            get clickTolerance () { return this.config.tolerance; }

            constructor (config, esriLayer, epsgLookup) {
                super(config, esriLayer, epsgLookup);
                this._formattedAttributes = {};
            }

            onLoad () {
                this._attributeBundle = gapi().attribs.loadLayerAttribs(this._layer);
                super.onLoad();
            }

            /**
             * Formats raw attributes to the form consumed by the datatable
             * @param  {Object} attributes raw attribute data returned from geoapi
             * @return {Object} layerData  layer data returned from geoApi
             * @return {Object}               formatted attribute data { data: Array, columns: Array, fields: Array, oidField: String, oidIndex: Object}
             */
            formatAttributes (attributes, layerData) {
                // create columns array consumable by datables
                const fieldNameArray = [];
                const columns = layerData.fields
                    .filter(field =>
                        // assuming there is at least one attribute - empty attribute budnle promises should be rejected, so it never even gets this far
                        // filter out fields where there is no corresponding attribute data
                        attributes.features[0].attributes.hasOwnProperty(field.name))
                    .map(field => {
                        // check if date type; append key to fieldNameArray if so
                        if (field.type === 'esriFieldTypeDate') {
                            fieldNameArray.push(field.name);
                        }
                        return {
                            data: field.name,
                            title: field.alias || field.name
                        };
                    });

                // extract attributes to an array consumable by datatables
                const rows = attributes.features.map(feature => feature.attributes);

                // convert each date cell to ISO format
                fieldNameArray.forEach(fieldName => {
                    rows.forEach(row => {
                        const date = new Date(row[fieldName]);
                        row[fieldName] = date.toISOString().substring(0, 10);
                    });
                });

                return {
                    columns,
                    rows,
                    fields: layerData.fields, // keep fields for reference ...
                    oidField: layerData.oidField, // ... keep a reference to id field ...
                    oidIndex: attributes.oidIndex, // ... and keep id mapping array
                    renderer: layerData.renderer
                };
            }

            /**
             * Retrieves attributes from a layer for a specified feature index
             * @param  {Number} featureIdx feature id on the service endpoint
             * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
             */
            getAttributes (featureIdx) {
                const formAtt = this._formattedAttributes;

                if (formAtt.hasOwnProperty(featureIdx)) {
                    return formAtt[featureIdx];
                }

                const layerPackage = this._attributeBundle[featureIdx];
                const attributePromise = $q.all([layerPackage.getAttribs(), layerPackage.layerData])
                    .then(([attributes, layerData]) => this.formatAttributes(attributes, layerData))
                    .catch(() => {
                        delete this._formattedAttributes[featureIdx]; // delete cached promise when the geoApi `getAttribs` call fails, so it will be requested again next time `getAttributes` is called;
                        throw new Error('Attrib loading failed');
                    });
                return (this._formattedAttributes[featureIdx] = attributePromise);
            }

        }

        /**
         * @class ImageRecord
         */
        class ImageRecord extends LayerRecord {
            get layerClass () { return gapi().layer.ArcGISImageServiceLayer; }

            /**
             * @see layerRecord.makeLayerBookmark
             */
            makeLayerBookmark () {
                const opacity = padOpacity(this._legendEntry.getOpacity());
                const viz = this._legendEntry.getVisibility() ? '1' : '0';
                const bb = this._legendEntry.options.boundingBox.value ? '1' : '0';

                const bookmark = '04' + this.config.id + opacity + viz + bb;
                return bookmark;
            }

            /**
             * Creates a config snippet (containing options) given the dataString portion of the layer bookmark.
             *
             * @param {String} dataString   a partial layer bookmark (everything after the id)
             * @param {String} version      version of the bookmark
             * @returns {Object}            config snippet for the layer
             */
            static parseData (dataString, version) {

                // ( opacity )( viz )( boundingBox )( query )
                // vA uses 3-char opacity

                const format = {
                    A: /^(\d{3})(\d{1})(\d{1})$/,
                    B: /^(\d{2})(\d{1})(\d{1})$/
                };

                const info = dataString.match(format[version]);

                if (info) {
                    return super.parseData([, 'opacity', 'visibility', 'boundingBox'], info); // jshint ignore:line
                }
            }
        }

        /**
         * @class DynamicRecord
         */
        class DynamicRecord extends AttrRecord {
            get _layerPassthroughBindings () {
                return ['setOpacity', 'setVisibility', 'setVisibleLayers', 'setLayerDrawingOptions'];
            }
            get _layerPassthroughProperties () {
                return ['visibleAtMapScale', 'visible', 'spatialReference', 'layerInfos', 'supportsDynamicLayers'];
            }
            get layerClass () { return gapi().layer.ArcGISDynamicMapServiceLayer; }

            /**
             * @see layerRecord.makeLayerBookmark
             */
            makeLayerBookmark () {
                const leg = this._legendEntry;
                const opacity = padOpacity(leg.getOpacity());
                const viz = leg.getVisibility() ? '1' : '0';
                const bb = leg.options.boundingBox.value ? '1' : '0';
                const query = leg.options.query.value ? '1' : '0';

                const makeChildSetting = legItem => {
                    const opC = legItem.options.opacity ? padOpacity(legItem.getOpacity()) : '99';
                    const vizC = legItem.getVisibility() ? '1' : '0';
                    const qC = legItem.options.query.value ? '1' : '0';
                    const idx = legItem.featureIdx;
                    return opC + vizC + qC + idx;
                };

                // grab stuff on children.  we can't use walkItems because it returns a flat list.
                // we need to preserve heirarchy here.
                // loop over top-level children of the layer. these are the ones that have
                // entries defined in .layerEntries in the config.
                // these get serialized, and delimited by a ;
                const childSettings = leg.items.map(item => {
                    // store the top first (important!)
                    const topLevelSetting = [makeChildSetting(item)];

                    // tack on any children, which would have been auto-generated
                    // we can use walkItems here, as we have the parent.
                    if (item.type === 'group') {
                        topLevelSetting.splice(1, 0, ...item.walkItems(subItem => {
                            return makeChildSetting(subItem);
                        }));
                    }

                    // mash this cluster (all belong to the topLevel parent) into a string,
                    // with child entries delimeted using a `
                    return topLevelSetting.join('`');
                }).join(';');
                const bookmark = '03' + this.config.id + ';' + childSettings + opacity + viz + bb + query;
                return bookmark;
            }

            /**
             * Creates a config snippet (containing options) given the dataString portion of the layer bookmark.
             *
             * @param {String} dataString   a partial layer bookmark (everything after the id)
             * @param {String} version      version of the bookmark
             * @returns {Object}            config snippet for the layer
             */
            static parseData (dataString, version) {
                // vA: ( opacity )( viz )( boundingBox )( query )
                // vB: ( sublayer info )( opacity )( viz )( boundingBox )( query )
                const format = {
                    A: /^(\d{3})(\d{1})(\d{1})(\d{1})$/,
                    B: /^(.+?)(\d{2})(\d{1})(\d{1})(\d{1})$/
                };

                const info = dataString.match(format[version]);

                if (info) {

                    const snippet = {};

                    if (version !== 'A') {
                        // process info for child layers
                        // ( opacity ) ( viz ) ( query ) ( sublayer index )
                        const cFormat = /^(\d{2})(\d{1})(\d{1})(.+?)$/;
                        const childData = info[1].substr(1); // drop leading ;
                        info.splice(1, 1); // remove child info from array, normalizing it with version A

                        const makeEntryNode = bmData => {
                            // we make use of super.parseData, but need to pull the data up out of the
                            // .options subobject in this case.
                            const cInfo = bmData.match(cFormat);
                            const result = super.parseData([, 'opacity', 'visibility', 'query'], cInfo, version); // jshint ignore:line
                            result.options.index = cInfo[4];
                            return result.options;
                        };

                        // splitting on ; gives us chunks of data for each top-level index in the layer.
                        // i.e. each chunk defines an object that goes in .layerEntries
                        snippet.layerEntries = childData.split(';').map(cData => {
                            // for a single top level index, we can also have auto-generated child settings along with it.
                            // these values are separated by ` chars. The first one is always the parent.
                            const subChildData = cData.split('`');

                            // make parent entry, then remove it from source array
                            const lEntry = makeEntryNode(subChildData[0]);
                            subChildData.splice(0, 1);

                            // if any child data remains, add it to the children property of the parent.
                            if (subChildData.length > 0) {
                                lEntry.children = subChildData.map(scd => makeEntryNode(scd));
                            }

                            return lEntry;
                        });
                    }

                    // merge child config data with top level config data
                    const topDat = super.parseData([, 'opacity', 'visibility', 'boundingBox', 'query'], info, version); // jshint ignore:line
                    angular.merge(snippet, topDat);
                    return snippet;
                }
            }
        }

        /**
         * @class TileRecord
         */
        class TileRecord extends LayerRecord {
            get layerClass () { return gapi().layer.TileLayer; }

            /**
             * @see layerRecord.makeLayerBookmark
             */
            makeLayerBookmark () {
                const opacity = padOpacity(this._legendEntry.getOpacity());
                const viz = this._legendEntry.getVisibility() ? '1' : '0';
                const bb = this._legendEntry.options.boundingBox.value ? '1' : '0';

                const bookmark = '02' + this.config.id + opacity + viz + bb;
                return bookmark;
            }

            /**
             * Creates a config snippet (containing options) given the dataString portion of the layer bookmark.
             *
             * @param {String} dataString   a partial layer bookmark (everything after the id)
             * @param {String} version      version of the bookmark
             * @returns {Object}            config snippet for the layer
             */
            static parseData (dataString, version) {
                // ( opacity )( viz )( boundingBox )
                // vA uses 3-char opacity

                const format = {
                    A: /^(\d{3})(\d{1})(\d{1})$/,
                    B: /^(\d{2})(\d{1})(\d{1})$/
                };

                const info = dataString.match(format[version]);

                if (info) {
                    return super.parseData([, 'opacity', 'visibility', 'boundingBox'], info); // jshint ignore:line
                }
            }
        }

        /**
         * @class WmsRecord
         */
        class WmsRecord extends LayerRecord {
            get layerClass () { return gapi().layer.ogc.WmsLayer; }

            makeLayerConfig () {
                const cfg = super.makeLayerConfig();
                cfg.visibleLayers = this.config.layerEntries.map(le => le.id);
                return cfg;
            }

            /**
             * @see layerRecord.makeLayerBookmark
             */
            makeLayerBookmark () {
                const opacity = padOpacity(this._legendEntry.getOpacity());
                const viz = this._legendEntry.getVisibility() ? '1' : '0';
                const bb = this._legendEntry.options.boundingBox.value ? '1' : '0';
                const query = this._legendEntry.options.query.value ? '1' : '0';

                const bookmark = '01' + this.config.id + opacity + viz + bb + query;
                return bookmark;
            }

            /**
             * Creates a config snippet (containing options) given the dataString portion of the layer bookmark.
             *
             * @param {String} dataString   a partial layer bookmark (everything after the id)
             * @param {String} version      version of the bookmark
             * @returns {Object}            config snippet for the layer
             */
            static parseData (dataString, version) {
                // ( opacity )( viz )( boundingBox )( query )
                // vA uses 3-char opacity

                const format = {
                    A: /^(\d{3})(\d{1})(\d{1})(\d{1})$/,
                    B: /^(\d{2})(\d{1})(\d{1})(\d{1})$/
                };

                const info = dataString.match(format[version]);

                if (info) {
                    return super.parseData([, 'opacity', 'visibility', 'boundingBox', 'query'], info); // jshint ignore:line
                }
            }
        }

        /**
         * @class FeatureRecord
         */
        class FeatureRecord extends AttrRecord {
            get layerClass () { return gapi().layer.FeatureLayer; }

            makeLayerConfig () {
                const cfg = super.makeLayerConfig();
                cfg.mode = this.config.options.snapshot.value ? this.layerClass.MODE_SNAPSHOT
                                                              : this.layerClass.MODE_ONDEMAND;
                this.config.options.snapshot.enabled = !this.config.options.snapshot.value;
                return cfg;
            }

            /**
             * @see layerRecord.makeLayerBookmark
             */
            makeLayerBookmark () {
                const opacity = padOpacity(this._legendEntry.getOpacity());
                const viz = this._legendEntry.getVisibility() ? '1' : '0';
                const bb = this._legendEntry.options.boundingBox.value ? '1' : '0';
                const snap = this._legendEntry.options.snapshot.value ? '1' : '0';
                const query = this._legendEntry.options.query.value ? '1' : '0';

                const bookmark = '00' + this.config.id + opacity + viz + bb + snap + query;
                return bookmark;
            }

            /**
             * Creates a config snippet (containing options) given the dataString portion of the layer bookmark.
             *
             * @param {String} dataString   a partial layer bookmark (everything after the id)
             * @param {String} version      version of the bookmark
             * @returns {Object}            config snippet for the layer
             */
            static parseData (dataString, version) {
                // ( opacity )( viz )( boundingBox )( snapshot )( query )
                // vA uses 3-char opacity

                const format = {
                    A: /^(\d{3})(\d{1})(\d{1})(\d{1})(\d{1})$/,
                    B: /^(\d{2})(\d{1})(\d{1})(\d{1})(\d{1})$/
                };

                const info = dataString.match(format[version]);

                if (info) {
                    return super.parseData([, 'opacity', 'visibility', 'boundingBox', 'snapshot', 'query'], info); // jshint ignore:line
                }
            }
        }

        /**
         * Create a LayerRecord based on a config fragment
         * @function makeServiceRecord
         * @param {Object} config A configuration fragment for the layer to be created
         * @param {Function} epsgLookup An optional lookup function for unknown projections
         * @return {Object} A LayerRecord object of the appropriate type
         */
        function makeServiceRecord(config, epsgLookup) {
            const types = Geo.Layer.Types;
            const typeToClass = {
                [types.ESRI_TILE]: TileRecord,
                [types.ESRI_FEATURE]: FeatureRecord,
                [types.ESRI_IMAGE]: ImageRecord,
                [types.ESRI_DYNAMIC]: DynamicRecord,
                [types.OGC_WMS]: WmsRecord
            };
            return new typeToClass[config.layerType](config, undefined, epsgLookup);
        }

        /**
         * Create a LayerRecord from an existing layer (used for file based layers).
         * @function makeFileRecord
         * @param {Object} config A configuration fragment for the layer to be created
         * @param {Object} layer An ESRI layer object which has already been setup
         * @return {FeatureRecord} A FeatureRecord (currently all files use FeatureLayers internally)
         */
        function makeFileRecord(config, layer) {
            return new FeatureRecord(config, layer);
        }

        /**
         * Creates a config snippet for the layer described by dataString.
         * Maps to the correct layerRecord class using layerType.
         *
         * @function parseLayerData
         * @param {String} dataString   a partial layer bookmark (everything after the id)
         * @param {Number} layerType    Layer type taken from the layer bookmark
         * @param {String} version      Version of the bookmark format
         * @returns {Object}            config snippet for the layer
         */
        function parseLayerData(dataString, layerType, version) {
            const classes = [
                FeatureRecord,
                WmsRecord,
                TileRecord,
                DynamicRecord,
                ImageRecord
            ];

            return classes[layerType].parseData(dataString, version);
        }

        function padOpacity(value) {
            // sometimes we get weird decimal numbers coming in, like 0.5599999999999 instead of 0.56
            value = String(Math.round(value * 100));

            // save a char, yo
            if (value === '100') {
                value = '99';
            }
            return ('00' + value).substring(value.length);
        }

        return { makeServiceRecord, makeFileRecord, parseLayerData };
    }
})();
