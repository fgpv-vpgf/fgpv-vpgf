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

    function geoService() {

        //TODO update how the layerOrder works with the UI
        //Make the property read only. All angular bindings will be a one-way binding to read the state of layerOrder
        //Add a function to update the layer order. This function will raise a change event so other interested
        //pieces of code can react to the change in the order

        const service = {
            layers: {},
            layerOrder: [],
            registerLayer,
            registerAttributes
        };

        // FIXME: need to find a way to have the dojo URL set by the config
        service.promise = geoapi('http://js.arcgis.com/3.14/', window)
            .then(initializedGeoApi => service.gapi = initializedGeoApi);

        return service;

        /**
         * Adds a layer object to the layers registry
         * @param  {object} layer the API layer object
         */
        function registerLayer(layer) {
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
            //TODO add the config snippet for the layer as a third property for quick access?
            service.layers[layer.id] = {
                layer: layer,
                attribs: null
            };

            //TODO update the layerOrder here as well? or do that at same time we call map.addLayer

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
    }
})();
