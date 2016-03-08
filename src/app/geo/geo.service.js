(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name geoService
     * @module app.geo
     *
     * @description
     * `geoService` wraps all calls to geoapi and also tracks the state of anything map related
     * (ex: layers, filters, extent history).
     */
    angular
        .module('app.geo')
        .factory('geoService', geoService);

    function geoService($http, $q, gapiService, mapService, layerRegistry, configService, identifyService) {

        // TODO update how the layerOrder works with the UI
        // Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        // Add a function to update the layer order. This function will raise a change event so other interested
        // pieces of code can react to the change in the order

        const service = {
            epsgLookup,
            getFormattedAttributes,
            buildMap,
            setZoom,
            shiftZoom,
            selectBasemap,
            setFullExtent,
            zoomToGraphic,
            getFullExtFromExtentSets,
        };

        return service;

        /**
         * Returns nicely bundled attributes for the layer described by layerId.
         * The bundles are used in the datatable.
         *
         * @param   {String} layerId        The id for the layer
         * @param   {String} featureIndex   The index for the feature (attribute set) within the layer
         * @return  {Promise}               Resolves with the column headers and data to show in the datatable
         */
        function getFormattedAttributes(layerId, featureIndex) {
            // FIXME change to new promise format of attributes.  return a promise from this function.

            if (!layerRegistry.layers[layerId]) {
                throw new Error('Cannot get attributes for unregistered layer');
            }

            // waits for attributes to be loaded, then resolves with formatted data
            return layerRegistry.layers[layerId].attribs.then(attribBundle => {
                if (!attribBundle[featureIndex] || attribBundle[featureIndex].features.length === 0) {
                    throw new Error('Cannot get attributes for feature set that does not exist');
                }

                // get the attributes and single out the first one
                const attr = attribBundle[featureIndex];
                const first = attr.features[0];

                // columns for the data table
                const columns = [];

                // data for the data table
                const data = [];

                // used to track order of columns
                const columnOrder = [];

                // get the attribute keys to use as column headers
                Object.keys(first.attributes)
                    .forEach((key, index) => {
                        const title = identifyService.aliasedFieldName(key, attr.fields);

                        columns[index] = {
                            title
                        };
                        columnOrder[index] = key;
                    });

                // get the attribute data from every feature
                attr.features.forEach((feat, index) => {
                    data[index] = [];
                    angular.forEach(feat.attributes, (value, key) => {
                        data[index][columnOrder.indexOf(key)] = value;
                    });
                });

                return {
                    columns,
                    data
                };
            });
        }

        /**
         * Lookup a proj4 style projection definition for a given ESPG code.
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
                .then(response => {
                    return response.data;
                })
                .catch(err => {
                    console.warn(err);

                    // jscs check doesn't realize return null; returns a promise
                    return null; // jscs:ignore jsDoc
                });
        }

        /**
         * Constructs a map on the given DOM node.
         * @param {object} config the map configuration based on the configuration schema
         * TODO: refactor this behemoth
         */
        function buildMap() {
            configService.getCurrent()
                .then(config => {
                    // reset before rebuilding the map
                    if (mapService.map !== null) {
                        // NOTE: Possible to have dom listeners stick around after the node is destroyed
                        mapService.map.destroy();
                        mapService.map.mapManager.OverviewMapControl.destroy();
                        mapService.map.mapManager.ScalebarControl.destroy();
                        mapService.map = null;
                        layerRegistry.layers = {};
                    }

                    // FIXME remove the hardcoded settings when we have code which does this properly
                    mapService.map = gapiService.gapi.mapManager.Map(mapService.mapNode, {
                        basemap: 'gray',
                        zoom: 6,
                        center: [-100, 50]
                    });

                    // keep map reference for sanity
                    let map = mapService.map;

                    if (config.services && config.services.proxyUrl) {
                        gapiService.gapi.mapManager.setProxy(config.services.proxyUrl);
                    }

                    // init idenitfy service when a new map is created
                    identifyService.init();

                    config.layers.forEach(layerConfig => {
                        // TODO: decouple identifyservice from everything
                        const l = layerRegistry.generateLayer(layerConfig);
                        const pAttrib = $q((resolve, reject) => { // handles the asynch loading of attributes

                            // TODO investigate potential issue -- load event finishes prior to this event registration, thus attributes are never loaded
                            gapiService.gapi.events.wrapEvents(l, {
                                load: () => {
                                    // FIXME look at layer config for flags indicating not to load attributes
                                    // FIXME if layer type is not an attribute-having type (WMS, Tile, Image, Raster, more?), resolve an empty attribute set instead

                                    // get the attributes for the layer
                                    const a = gapiService.gapi.attribs.loadLayerAttribs(l);

                                    a
                                        .then(data => {
                                            // registerAttributes(data);
                                            resolve(data);
                                        })
                                        .catch(exception => {
                                            console.error(
                                                'Error getting attributes for ' +
                                                l.name + ': ' +
                                                exception);
                                            console.log(l);

                                            // TODO we may want to resolve with an empty attribute item. depends how breaky things get with the bad layer
                                            reject(exception);
                                        });
                                }
                            });
                        });
                        layerRegistry.registerLayer(l, layerConfig, pAttrib); // https://reviewable.io/reviews/fgpv-vpgf/fgpv-vpgf/286#-K9cmkUQO7pwtwEPOjmK
                        map.addLayer(l);
                    });

                    // setup map using configs
                    // FIXME: I should be migrated to the new config schema when geoApi is updated
                    const mapSettings = {
                        basemaps: [],
                        scalebar: {},
                        overviewMap: {}
                    };
                    if (config.baseMaps) {
                        mapSettings.basemaps = config.baseMaps;
                    }

                    if (config.map.components.scaleBar) {
                        mapSettings.scalebar = {
                            attachTo: 'bottom-left',
                            scalebarUnit: 'dual'
                        };
                    }

                    if (config.map.components.overviewMap && config.map.components.overviewMap.enabled) {

                        // FIXME: overviewMap has more settings
                        mapSettings.overviewMap = config.map.components.overviewMap;
                    }

                    if (config.map.extentSets) {
                        let lFullExtent = getFullExtFromExtentSets(config.map.extentSets);

                        // map extent is not available until map is loaded
                        if (lFullExtent) {
                            gapiService.gapi.events.wrapEvents(map, {
                                load: () => {

                                    // compare map extent and setting.extent spatial-references
                                    // make sure the full extent has the same spatial reference as the map
                                    if (gapiService.gapi.proj.isSpatialRefEqual(map.extent.spatialReference,
                                            lFullExtent.spatialReference)) {

                                        // same spatial reference, no reprojection required
                                        map.fullExtent = gapiService.gapi.mapManager.getExtentFromJson(
                                            lFullExtent);
                                    } else {

                                        // need to re-project
                                        map.fullExtent = gapiService.gapi.proj.projectEsriExtent(
                                            gapiService.gapi.mapManager.getExtentFromJson(
                                                lFullExtent),
                                            map.extent.spatialReference);
                                    }
                                }
                            });
                        }
                    }

                    map.mapManager = gapiService.gapi.mapManager.setupMap(map, mapSettings);

                    // FIXME temp link for debugging
                    window.FGPV = {
                        layers: service.layers
                    };
                });
        }

        /**
         * Switch basemap based on the uid provided.
         * @param {string} id identifier for a specific basemap layerbower
         */
        function selectBasemap(id) {
            const mapManager = mapService.map.mapManager;

            if (typeof mapManager === 'undefined' || !mapManager.BasemapControl) {
                console.error('Error: Map manager or basemap control is not setup,' +
                    ' please setup map manager by calling setupMap().');
            } else {
                mapManager.BasemapControl.setBasemap(id);
            }
        }

        /**
         * Sets zoom level of the map to the specified level
         * @param {number} value a zoom level number
         */
        function setZoom(value) {
            const map = mapService.map;
            if (map) {
                map.setZoom(value);
            } else {
                console.warn('GeoService: map is not yet created.');
            }
        }

        /**
         * Changes the zoom level by the specified value relative to the current level; can be negative
         * @param  {number} byValue a number of zoom levels to shift by
         */
        function shiftZoom(byValue) {
            const map = mapService.map;
            if (map) {
                let newValue = map.getZoom() + byValue;
                map.setZoom(newValue);
            } else {
                console.warn('GeoService: map is not yet created.');
            }
        }

        /**
         * Set the map to full extent
         */
        function setFullExtent() {
            const map = mapService.map;
            if (map) {
                if (map.fullExtent) {
                    map.setExtent(map.fullExtent);
                } else {
                    console.warn('GeoService: fullExtent value is not set.');
                }
            } else {
                console.warn('GeoService: map is not yet created.');
            }
        }

        // only handles feature layers right now. zoom to dynamic/wms layers obj won't work
        /**
         * Fetches a point in a layer given the layerUrl and objId of the object and then zooms to it
         * @param  {layerUrl} layerUrl is the URL that the point to be zoomed to belongs to
         * @param  {objId} objId is ID of object that was clicked on datatable to be zoomed to
         */
        function zoomToGraphic(layerUrl, objId) {
            const map = mapService.map;
            const geo = gapiService.gapi.layer.getFeatureInfo(layerUrl, objId);
            geo.then(geoInfo => {
                if (geoInfo) {
                    map.centerAndZoom(geoInfo.feature.geometry, 10);
                }
            });
        }

        /*
         * Retrieve full extent from extentSets
         */
        function getFullExtFromExtentSets(extentSets) {

            // FIXME: default basemap should be indicated in the config as well
            const currentBasemapExtentSetId = '123456789';

            // In configSchema, at least one extent for a basemap
            const extentSetForId = extentSets.find(extentSet => {
                if (extentSet.id === currentBasemapExtentSetId) {
                    return true;
                }
            });

            // no matching id in the extentset
            if (angular.isUndefined(extentSetForId)) {
                throw new Error('could not find an extent set with matching id.');
            }

            // find the full extent type from extentSetForId
            const lFullExtent = (extentSetForId.full) ? extentSetForId.full :
                (extentSetForId.default) ? extentSetForId.default :
                (extentSetForId.maximum) ? extentSetForId.maximum : null;

            return lFullExtent;
        }
    }
})();
