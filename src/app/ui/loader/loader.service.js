(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name Loader
     * @module app.ui.loader
     *
     * @description
     * The `Loader` service provides ....
     *
     */
    angular
        .module('app.ui.loader')
        .factory('loader', Loader);

    function Loader($q, geoService) {
        const self = this;

        self.data = null;
        self.type = null;
        self.configuration = null;

        self.setSource = setSource;
        self.validateData = validateData;
        self.configurateLayer = configurateLayer;

        /**
         * Stores data source from the layer import component and calls geoApi for details.
         * @param {String|Object} dataSource data source can be a string (service url or file url) or a local file object loaded by `flow` library
         * @returns {Promise} resolving to a guessed data type or null if can't guess
         */
        function setSource(dataSource) {
            // a call to geoApi to try and guess what this is
            // returns a promise resolbing to a string with a data type (user will need to confirm the guess); null if cannot determine (user will need to select manually)
            return geoService.guessDataType(dataSource)
                .then((data, guessedType) => {
                    self.data = data;
                    self.type = guessedType; // store guess on service so it can be bound to

                    return $q.resolve(self.type);
                });
        }

        /**
         * Provides type to the stored data source and calls geoApi to get more details like row headers, etc.
         * `self.type` indicates the type of the data source (csv, geojson, shapefile, esri feature service, etc.)
         * @returns {Promise} resolving to `true` if the provided data source is valid and of specified type; `false`, otherwise
         */
        function validateData() {
            if (!self.data || !self.type) {
                return $q.reject('Data or its type is not specified');
            }

            // based on datatype, call validateData for files; and interrogate services if type changed from before

            return geoService.validateData(self.data, self.type)
                .then((isValid, otherStuff) => {
                    return $q.resolve(isValid, otherStuff);
                });

            /*
             cals geoapi to get stuff like row headers;
             */
        }

        function configurateLayer() {

        }

    }
})();
