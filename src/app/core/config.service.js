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

    function configService($q, $rootElement, $timeout, $http, $translate, layerDefaults, layerTypes) {
        let initializePromise;
        let isInitialized = false;

        const service = {
            data: { },
            getCurrent,
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
                    if (langAttr) {
                        try {
                            langs = angular.fromJson(langAttr);
                        } catch (e) {
                            console.log('Could not parse langs, defaulting to en and fr');

                            // TODO: better way to handle when no languages are specified?
                            langs = ['en', 'fr'];
                        }
                    } else {
                        langs = ['en', 'fr'];
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
                            return applyLayerDefaults(mergeConfigParts(configParts));
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
         * Applies the appropriate layer defaults to a config object
         * @param  {object}  config     base config object
         * @return {object}             config object with modified layer entries
         */
        function applyLayerDefaults(config) {
            const newConfig = config;
            newConfig.layers = config.layers.map(layerEntry => {
                return angular.merge({}, layerDefaults[layerTypes[layerEntry.layerType]], layerEntry);
            });
            return newConfig;
        }

        /**
         * Config initialization block for file-based configs
         * @param {string}  configAttr  the file path tied to the config attribute
         * @param {array}   langs       array of languages which have configs
         */
        function fileInit(configAttr, langs) {
            langs.forEach(lang => {
                // try to load config file
                const p = $http.get(configAttr.replace('${lang}', lang)).then(xhr => xhr.data);
                partials[lang].push(p);
            });
        }

        /**
         * Returns the currently used config. Language is determined by asking $translate.
         * @return {Promise}     The config promise object tied to the current language resolving with that config
         */
        function getCurrent() {
            const currentLang = ($translate.proposedLanguage() || $translate.use()).split('-')[0];
            return service.data[currentLang];
        }

        /**
         * Returns a config built by merging separate config chunks.
         * @param {array}   configParts  array of config chunks to merge
         * @return {object} config       the merged config object
         */
        function mergeConfigParts(configParts) {
            const config = { layers: [] }; // angular.merge({}, { layers: [] }, configDefaults);

            configParts.forEach(part => {
                angular.forEach(part, (value, key) => {
                    // if this section is an array just concat, e.g. layers, basemaps
                    // otherwise merge into existing section
                    if (Array.isArray(config[key])) {
                        config[key] = config[key].concat(value);
                    } else {
                        config[key] = value;
                    }
                });
            });
            return config;
        }

        /**
         * Config initialization block for rcs retrieved config snippets
         * @param {string}  svcAttr     the server path tied to the config attribute
         * @param {string}  keysAttr    list of keys marking which layers to retrieve
         * @param {array}   langs       array of languages which have configs
         */
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
                        result.layers = resp.data.map(layerEntry => {
                            return layerEntry.layers[0];
                        });
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
         * @param  {Promise|Array} nextPromises optional promises to be resolved before returning
         * @return {Promise}              promise to be resolved on config service initialization
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
