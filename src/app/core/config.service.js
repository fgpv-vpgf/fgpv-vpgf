(() => {
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

    function configService($q, $rootElement, $timeout, $http, configDefaults, $translate) {
        let initializePromise;
        let isInitialized = false;

        const basicLayerDefaults = {
            visibility: {
                enabled: true,
                value: 'on'
            },
            opacity: {
                enabled: true,
                value: 1
            },
            metadata: {
                enabled: true,
            },
            settings: {
                enabled: true,
            },
            refresh: {
                enabled: true,
            },
            remove: {
                enabled: true,
            },
            boundingBox: {
                enabled: true,
                value: true
            }
        };

        const service = {
            data: { },
            getCurrent,
            applyBasicDefaults, // silence JSHint since we might want this later after all the hacks are removed
            initialize,
            ready
        };

        const partials = {}; // partial config promises, one array per language entry

        return service;

        /***************/

        /**
         * Initializes `configService` by fetching and parsing `config` object.
         */
        function initialize() {
            if (initializePromise) {
                return initializePromise;
            }

            // store the promise and return it on all future calls; this way initialize can be called one time only
            initializePromise = $q((fulfill, reject) => {
                const configAttr = $rootElement.attr('rv-config');
                const langAttr = $rootElement.attr('rv-langs');
                const svcAttr = $rootElement.attr('rv-service-endpoint');
                const keysAttr = $rootElement.attr('rv-keys');
                let configJson;
                let langs;

                // This function can only be called once.
                if (isInitialized) {
                    return fulfill();
                }

                // check if config attribute exist
                if (configAttr) {
                    // check if it's a valid JSON
                    try {
                        configJson = angular.fromJson(configAttr);
                        addConfig($q.resolve(configJson), 'en');
                    } catch (e) {
                        console.log('Not valid JSON, attempting to load a file with this name');
                    }

                    if (langAttr) {
                        try {
                            langs = angular.fromJson(langAttr);
                        } catch (e) {
                            console.log('Could not parse langs, defaulting to en and fr');

                            // TODO: better way to handle when no languages are specified?
                            langs = ['en', 'fr'];
                        }
                    }

                    langs.forEach(lang => partials[lang] = []);

                    if (svcAttr) {
                        rcsInit(svcAttr, keysAttr, langs);
                    }

                    // start loading every config file
                    if (!configJson) {
                        fileInit(configAttr, langs);
                    }

                    langs.forEach(lang => {
                        service.data[lang] = $q.all(partials[lang]).then(configParts => {
                            const config = { layers: [] };

                            // FIXME ugly hack for temporary merging of layers
                            configParts.forEach(part => {
                                Object.keys(part).forEach(key => {
                                    if (key === 'layers') {
                                        config[key] = config[key].concat(part[key]);
                                    } else {
                                        config[key] = part[key];
                                    }
                                });
                            });
                            console.info(config);
                            return config;
                        });

                    });

                    // initialize the app once the default language's config is loaded
                    // FIXME: replace with getCurrent().then / service.data[Default language] if we have a way to check
                    service.data[langs[0]]
                        .then(() => {
                            isInitialized = true;
                            fulfill();
                        })
                        .catch(error => {
                            reject(error);
                            console.error(error);
                        });
                }
            });

            return initializePromise;
        }

        /**
         * Adds a config (promise) to the registry
         * @param  {Promise}    configPromise  promise that will resolve with config object
         * @param  {string}     lang    the language to tie the config object to
         */
        function addConfig(configPromise, lang) {
            service.data[lang] = configPromise
                    .then(data => {
                        if (data.data) {
                            // apply any defaults from layoutConfigDefaults, then merge config on top
                            // TODO: this is an example; actual merging of the defaults is more complicated
                            return angular.merge({}, configDefaults, data.data);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
        }

        function applyBasicDefaults(fragmentPromise) {
            return fragmentPromise
                .then(fragment => {
                    const d = angular.merge({}, basicLayerDefaults, fragment);
                    console.info(d);
                    return {
                        data: d
                    };
                })
                .catch(error => {
                    console.error(error);
                });
        }

        function fileInit(configAttr, langs) {
            langs.forEach(lang => {
                // try to load config file
                const p = $http.get(configAttr.replace('${lang}', lang)).then(xhr => xhr.data);
                partials[lang].push(p);
            });
        }

        /**
         * Returns the currently used config. Language is determined by asking $translate.
         * @return {object}     The config object tied to the current language
         */
        function getCurrent() {
            const currentLang = ($translate.proposedLanguage() || $translate.use()).split('-')[0];
            return service.data[currentLang];
        }

        function rcsInit(svcAttr, keysAttr, langs) {
            const endpoint = svcAttr.endsWith('/') ? svcAttr : svcAttr + '/';
            let keys;
            if (keysAttr) {
                try {
                    keys = angular.fromJson(keysAttr);
                } catch (e) {
                    console.error(e);
                    console.error('RCS key retrieval failed');
                }

                langs.forEach(lang => {
                    const p = $http.get(`${endpoint}v2/docs/${lang}/${keys.join(',')}`).then(resp => {
                        const result = {};
                        result.layers = resp.data.map(layerEntry =>
                            angular.merge({}, basicLayerDefaults, layerEntry.layers[0]));
                        return result;
                    });
                    partials[lang].push(p);
                });
            } else {
                console.warn('RCS endpoint set but no keys were specified');
            }
        }
        /**
         * Checks if the service is ready to use.
         * @param  {object} nextPromises optional promises to be resolved before returning
         * @return {object}              promise to be resolved on config service initialization
         */
        function ready(nextPromises) {
            return initializePromise
                .then(() => {
                    console.log('Ready promise resolved.');
                    return $q.all(nextPromises);
                })
                .catch(() => {
                    console.log('"ready" function failed');
                });
        }
    }
})();
