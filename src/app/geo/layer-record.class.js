(() => {
    angular.module('app.geo').factory('LayerRecordFactory', LayerRecordFactory);

    function LayerRecordFactory(Geo, gapiService, $q) {
        const gapi = gapiService.gapi;

        class LayerRecord {
            get layerClass () { throw new Error('This should be overridden in subclasses'); }
            get attributeBundle () { return this._attributeBundle; }
            get config () { return this.initialConfig; } // TODO: add a live config reference if needed
            get legendEntry () { return this._legendEntry; } // legend entry class corresponding to those defined in legend entry service
            set legendEntry (value) { this._legendEntry = value; }
            get bbox () { return this._bbox; } // bounding box layer
            get state () { return this._state; }

            /**
             * Retrieves attributes from a layer for a specified feature index
             * @param  {Number} featureIdx feature id on the service endpoint
             * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
             */
            getAttributes (featureIdx) {
                if (this._formattedAttributes.hasOwnProperty(featureIdx)) {
                    return this._formattedAttributes[featureIdx];
                }

                const layerPackage = this._attributeBundle[featureIdx];
                const attributePromise =
                    $q.all([
                        layerPackage.getAttribs(),
                        layerPackage.layerData
                    ])
                    .then(([attributes, layerData]) =>
                        this.formatAttributes(attributes, layerData)
                    );
                return (this._formattedAttributes[featureIdx] = attributePromise);
            }

            constructLayer () {
                return new this.layerClass(this.config.url, this.makeLayerConfig());
            }

            _stateChange (newState) {
                this._state = newState;
                this._stateListeners.forEach(l => l(this._state));
            }

            addStateListener (listenerCallback) {
                this._stateListeners.push(listenerCallback);
            }

            onLoad () {
                if (this.legendEntry && this.legendEntry.removed) { return; }
                console.info(`Layer loaded: ${this.layer.id}`);

                // no attributes are set by default, layers with attributes should override
                this._attributeBundle = $q.resolve(null);
                this._stateChange(Geo.Layer.States.LOADING);
            }

            onError () {
                this._stateChange(Geo.Layer.States.ERROR);
            }

            onUpdateStart () {
                this._stateChange(Geo.Layer.States.REFRESH);
            }

            onUpdateEnd () {
                this._stateChange(Geo.Layer.States.LOADED);
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
                    oidIndex: attributes.oidIndex // ... and keep id mapping array
                };
            }

            makeLayerConfig () {
                return { id: this.config.id };
            }

            /**
             * Create a layer record with the appropriate geoApi layer type.  Layer config
             * should be fully merged with all layer options defined (i.e. this constructor
             * will not apply any defaults).
             * @param  {Object} initialState    layer config values
             */
            constructor (initialState) {
                this.initialConfig = initialState;
                this._formattedAttributes = {};
                this._stateListeners = [];
                this.layer = this.constructLayer(initialState);
                this.state = Geo.Layer.States.NEW;

                gapi.events.wrapEvents(this.layer, {
                    load: this.onLoad,
                    error: this.onError,
                    'update-start': this.onUpdateStart,
                    'update-end': this.onUpdateEnd
                });

                // NOTE layer registry is responsible for adding the layer to the map
                // this avoids LayerRecord having an explicit dependency on the map object
            }

        }

        class ImageRecord extends LayerRecord {
            get layerClass () { return gapi.layer.ArcGISImageServiceLayer; }
        }

        class DynamicRecord extends LayerRecord {
            get layerClass () { return gapi.layer.ArcGISImageServiceLayer; }
        }

        class TileRecord extends LayerRecord {
            get layerClass () { return gapi.layer.TileLayer; }
        }

        class WmsRecord extends LayerRecord {
            get layerClass () { return gapi.layer.ogc.WmsLayer; }

            makeLayerConfig () {
                const cfg = super.makeLayerConfig();
                cfg.visibleLayers = this.config.layerEntries.map(le => le.id);
            }
        }

        class FeatureRecord extends LayerRecord {
            get layerClass () { return gapi.layer.FeatureLayer; }

            makeLayerConfig () {
                const cfg = super.makeLayerConfig();
                cfg.mode = this.config.snapshot ? this.layerClass.MODE_SNAPSHOT : this.layerClass.MODE_ONDEMAND;
            }
        }

        function makeRecord(config) {
            const types = Geo.Layer.Types;
            const typeToClass = {
                [types.ESRI_TILE]: TileRecord,
                [types.ESRI_FEATURE]: FeatureRecord,
                [types.ESRI_IMAGE]: ImageRecord,
                [types.ESRI_DYNAMIC]: DynamicRecord,
                [types.OGC_WMS]: WmsRecord,
            };
            return new typeToClass[config.layerType](config);
        }

        return { makeRecord };
    }
})();
