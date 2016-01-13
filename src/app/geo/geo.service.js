/* global geoapi */
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

    function geoService(layerTypes) {

        //TODO update how the layerOrder works with the UI
        //Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        //Add a function to update the layer order. This function will raise a change event so other interested
        //pieces of code can react to the change in the order

        const service = {
            layers: {},
            layerOrder: [],
            buildMap,
            registerLayer,
            registerAttributes,
            setZoom,
            shiftZoom
            setupMap,
            setBasemap
        };

        let map = null; // keep map reference local to geoService

        let mapManager = null;

        // FIXME: need to find a way to have the dojo URL set by the config
        service.promise = geoapi('http://js.arcgis.com/3.14/', window)
            .then(initializedGeoApi => service.gapi = initializedGeoApi);

        return service;

        /**
         * Adds a layer object to the layers registry
         * @param {object} layer the API layer object
         * @param {object} config a configuration fragment used to generate the layer
         * @param {object} attribs an optional object containing the attributes associated with the layer
         * @param {number} position an optional index indicating at which position the layer was added to the map
         * (if supplied it is the caller's responsibility to make sure the layer is added in the correct location)
         */
        function registerLayer(layer, config, attribs, position) {
            //TODO determine the proper docstrings for a non-service function that lives in a service

            if (!layer.id) {
                //TODO replace with proper error handling mechanism
                console.log('Error: attempt to register layer without id property');
            }

            if (service.layers[layer.id]) {
                //TODO replace with proper error handling mechanism
                console.log('Error: attempt to register layer already registered.  id: ' + layer.id);
            }

            //TODO should attribs be defined and set to null, or simply omitted from the object?  some layers will not have attributes. others will be added after they load
            let l = {
                layer
            };
            if (config) {
                l.state = config;
            }
            if (attribs) {
                l.attribs = attribs;
            }
            service.layers[layer.id] = l;

            if (position === undefined) {
                position = service.layerOrder.length;
            }
            service.layerOrder.splice(position, 0, layer.id);
        }

        /**
         * Adds an attribute dataset to the layers registry
         * @param  {object} attribData an attribute dataset
         */
        function registerAttributes(attribData) {
            //TODO determine the proper docstrings for a non-service function that lives in a service

            if (!attribData.layerId) {
                //TODO replace with proper error handling mechanism
                console.log('Error: attempt to register attribute dataset without layerId property');
            }

            if (!service.layers[attribData.layerId]) {
                //TODO replace with proper error handling mechanism
                console.log('Error: attempt to register layer attributes against unregistered layer.  id: ' +
                    attribData.layerId);
            }

            service.layers[attribData.layerId].attribs = attribData;
        }

        /**
         * Takes a layer in the config format and generates an appropriate layer object.
         * @param {object} layerConfig a configuration fragment for a single layer
         * @return {object} a layer object matching one of the esri/layers objects based on the layer type
         */
        function generateLayer(layerConfig) {
            const handlers = {};

            handlers[layerTypes.esriFeature] = config => new service.gapi.layer.FeatureLayer(config.url);

            if (handlers.hasOwnProperty(layerConfig.layerType)) {
                return handlers[layerConfig.layerType](layerConfig);
            } else {
                throw new Error('Your layer type is unacceptable');
            }
        }

        /**
         * Constructs a map on the given DOM node.
         * @param {object} domNode the DOM node on which the map should be initialized
         * @param {object} config the map configuration based on the configuration schema
         */
        function buildMap(domNode, config) {
            map = service.gapi.mapManager.Map(domNode, {
                basemap: 'terrain',
                zoom: 6,
                center: [-100, 50]
            });
            config.layers.forEach(layerConfig => {
                const l = generateLayer(layerConfig);
                registerLayer(l, layerConfig);
                map.addLayer(l);
            });
        }

        /**
         * Construct mapManagerControl
         * TODO: should we move the setupMap in buildMap
         * @param  {object} config the config object that has settings to initialize map; basemaps, scalebar, ..., etc.
         * @return {object} configured mapManager object contains the controls {BasemapControl, Scalbar Control}
         */
        function setupMap(config) {
            mapManager = service.gapi.mapManager.setupMap(map, config);
        }

        /**
         * Switch basemap based on the uid provided.
         * @param {string} uid identifier for a specific basemap layerbower
         */
        function setBasemap(uid) {
            if (typeof (mapManager) === 'undefined') {
                console.log('Map manager is not setup, please setup map manager by calling setupMap().');
            } else {
                mapManager.BasemapControl.setBasemap(uid);
            }
        }

        /**
         * Sets zoom level of the map to the specified level
         * @param {number} value a zoom level number
         */
        function setZoom(value) {
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
            if (map) {
                let newValue = map.getZoom() + byValue;
                map.setZoom(newValue);
            } else {
                console.warn('GeoService: map is not yet created.');
            }
        }
    }
})();
