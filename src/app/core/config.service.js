(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name configService
     * @module app.core
     * @requires $q
     * @requires $rootElement
     * @requires $timeout
     * @requires $http
     * @requires configDefaults
     * @description
     *
     * The `configService` is responsible for loading and parsing the supplied configuration.
     *
     * Config file is either specified inline, by a url or is referencing a global variable:
     * ```html
     * <div rv-map rv-cfg='{"layout": { "title": "Granpa"}}'></div>
     * ```
     * ```html
     * <div rv-map rv-cfg="config.en.json"></div>
     * ```
     * ```html
     * <div rv-map rv-cfg="configOpts"></div>
     * <script>configOpts = {}</script>
     * ```
     * The main core run block (core.run.js) kicks in the initialization process by calling initialize on the `configService`. `configService` is responsible for parsing (inline) or loading (url) of the config. This service preserves the configuration in its pristine state (after applying all the defaults) - it will not be modified.
     * After the main config service retrieved the configuration, all other services are initialized. Until then, the application is covered by a loading overlay to hide unstyled content.
     *
     * Config service body returns the service object with the following:
     * - data: config data
     * - initialize: initialize function; call from core.run
     * - ready: checks if the service is ready to use
     *
     */
    angular
        .module('app.core')
        .factory('configService', configService);

    function configService($q, $rootElement, $timeout, $http, configDefaults) {
        let initializePromise;
        let isInitialized = false;

        const service = {
            data: {},
            initialize: initialize,
            ready: ready
        };

        return service;

        ////////////////

        /**
         * Initializes `configService` by fetching and parsing `config` object.
         */
        function initialize() {
            if (initializePromise) {
                return initializePromise;
            }

            // store the promise and return it on all future calls; this way initialize can be called one time only
            initializePromise = $q(function (fulfill, reject) {
                const configAttr = $rootElement.attr('th-config');
                let configJson;

                // This function can only be called once.
                if (isInitialized) {
                    return fulfill();
                }

                // check if config attribute exist
                if (configAttr) {
                    // check if it's a valid JSON
                    try {
                        configJson = angular.fromJson(configAttr);
                        configInitialized(configJson);
                    } catch (e) {
                        console.log('Not valid JSON, attempting to load a file with this name');
                    }

                    // try to load config file
                    if (!configJson) {
                        $http
                            .get(configAttr)
                            .then(function (data) {
                                if (data.data) {
                                    configJson = data.data;
                                }

                                // simulate delay to show loading splash
                                return $timeout(function () {
                                    configInitialized(configJson);
                                }, 2000);
                            })
                            .catch(function (error) {
                                console.error('Config initialization failed');
                                console.log(error);
                                reject();
                            });
                    }
                } else {
                    configInitialized({});
                }

                /**
                 * Initialization complete handler
                 * @param  {object} config config object
                 */
                function configInitialized(config) {
                    // apply any defaults from layoutConfigDefaults, then merge config on top
                    // TODO: this is an exampe; actual merging of the defaults is more complicated
                    angular.merge(service.data, configDefaults, config);

                    isInitialized = true;

                    return fulfill();
                }
            });

            return initializePromise;
        }

        /**
         * Checks if the service is ready to use.
         * @param  {object} nextPromises optional promises to be resolved before returning
         * @return {object}              promise to be resolved on config service initialization
         */
        function ready(nextPromises) {
            return initializePromise
                .then(function () {
                    console.log('Ready promise resolved.');
                    return $q.all(nextPromises);
                })
                .catch(function () {
                    console.log('"ready" function failed');
                });
        }
    }
})();
