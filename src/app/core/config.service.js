(() => {
    'use strict';

    /**
     * @module configService
     * @memberof app.core
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

    function configService($q, $rootElement, $timeout, $http, $translate, $mdToast) {
        let initializePromise;
        let isInitialized = false;

        const service = {
            currentLang,
            getCurrent,
            getOriginal,
            initialize,
            ready,
            rcsAddKeys,
            rcsUrl: '',
            setCurrent,
            getLanguages
        };

        const originalConfigs = {};
        let bookmarkConfig;

        const partials = {}; // partial config promises, one array per language entry
        const configFile = {};
        let languages;

        return service;

        /***************/

        /**
         * Initializes `configService` by fetching and parsing `config` object.
         * @function initialize
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
                            console.warn('Could not parse langs, defaulting to en-CA and fr-CA');

                            // TODO: better way to handle when no languages are specified?
                            langs = ['en-CA', 'fr-CA'];
                        }
                    } else {
                        langs = ['en-CA', 'fr-CA'];
                    }

                    // set avialable languages
                    languages = langs;

                    // set the language right away and not wait the initialization to be fullfilled
                    $translate.use(langs[0]);

                    langs.forEach(lang => partials[lang] = []);

                    if (svcAttr) {
                        service.rcsUrl = svcAttr;  // store for future RCS loads
                        rcsInit(svcAttr, keysAttr, langs);
                    }

                    // start loading every config file
                    fileInit(configAttr, langs);

                    langs.forEach(lang => {
                        originalConfigs[lang] = $q.all(partials[lang])
                            .then(configParts => {
                                // generate a blank config, merge in all the stuff we have loaded
                                // the merged config is our promise result for all to use
                                const newConfig = {
                                    layers: []
                                };
                                mergeConfigParts(newConfig, configParts);
                                return newConfig;
                            })
                            .catch(() => {
                                // TODO: possibly retry rcsLoad?
                                console.warn('RCS failed, starting app with file-only config.');
                                const toast = $mdToast.simple()
                                    .textContent($translate.instant('config.service.rcs.error'))
                                    .action($translate.instant('config.service.rcs.action'))
                                    .highlightAction(true)
                                    .hideDelay(0)
                                    .position('bottom rv-flex-global');
                                $mdToast.show(toast);
                                return configFile[lang];
                            });
                    });

                    // initialize the app once the default language's config is loaded
                    // FIXME: replace with getCurrent().then / originalConfigs[Default language] if we have a way to check
                    originalConfigs[langs[0]]
                        .then(() => {
                            isInitialized = true;
                            fulfill(originalConfigs[langs[0]]);
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
         * Config initialization block for file-based configs
         * @function fileInit
         * @param {string}  configAttr  the file path tied to the config attribute
         * @param {array}   langs       array of languages which have configs
         */
        function fileInit(configAttr, langs) {
            langs.forEach(lang => {
                // try to load config file
                const p = $http.get(configAttr.replace('${lang}', lang))
                    .then(xhr => xhr.data);
                partials[lang].push(p);
                configFile[lang] = p;
            });
        }

        /**
         * Returns the current language.
         * @function currentLang
         * @return {String} the current language string
         */
        function currentLang() {
            return ($translate.proposedLanguage() || $translate.use());
        }

        /**
         * Returns the currently used config. If a bookmark-modified config is stored it is returned,
         * otherwise the original config for the language is returned.
         *
         * @function getCurrent
         * @return {Promise}     The config promise object as described above
         */
        function getCurrent() {
            return bookmarkConfig || originalConfigs[currentLang()];
        }

        /**
         * Stores configPromise to be returned using getCurrent.
         *
         * @function setCurrent
         * @param {Promise} configPromise   A promise resolving with a config (usually modified by a bookmark)
         */
        function setCurrent(configPromise) {
            bookmarkConfig = configPromise;
        }

        /**
         * Returns the original config for the current language.
         *
         * @function getOriginal
         * @return {Promise}    The config promise resolving with the lang's original config
         */
        function getOriginal() {
            return originalConfigs[currentLang()];
        }

        /**
         * Returns the array of available languages.
         *
         * @function getLanguages
         * @return {array}    The available languages
         */
        function getLanguages() {
            return languages;
        }

        /**
         * Modifies a config by merging in separate config chunks.
         * @function mergeConfigParts
         * @private
         * @param {object} targetConfig  the config object to merge things into. Object will be modified
         * @param {array}   configParts  array of config chunks to merge
         */
        function mergeConfigParts(targetConfig, configParts) {
            configParts.forEach(part => {
                Object.entries(part).forEach(([key, value]) => {
                    // if this section is an array just concat, e.g. layers, basemaps
                    // otherwise merge into existing section
                    if (Array.isArray(targetConfig[key])) {
                        targetConfig[key] = targetConfig[key].concat(value);
                    } else {
                        targetConfig[key] = value;
                    }
                });
            });
        }

        /**
         * Config initialization block for rcs retrieved config snippets
         * @function rcsInit
         * @private
         * @param {string}  svcAttr     the server path tied to the config attribute
         * @param {string}  keysAttr    list of keys marking which layers to retrieve
         * @param {array}   langs       array of languages which have configs
         */
        function rcsInit(svcAttr, keysAttr, langs) {
            let keys;
            if (keysAttr) {
                try {
                    keys = angular.fromJson(keysAttr);
                } catch (e) {
                    console.error(e);
                    console.error('RCS key retrieval failed');
                }

                const rcsData = rcsLoad(svcAttr, keys, langs);
                langs.forEach(lang => {
                    // add the rcs data promises to our partials set
                    partials[lang].push(rcsData[lang]);
                });
            } else {
                console.warn('RCS endpoint set but no keys were specified');
            }
        }

        /**
         * Add RCS config layers to configuration after startup has finished
         * @function rcsAddKeys
         * @param {Array}  keys    list of keys marking which layers to retrieve
         * @return {Promise} promise of full config nodes for newly added layers
         */
        function rcsAddKeys(keys) {

            // strip languages out of data object.
            const langs =  Object.keys(originalConfigs);

            // get array of promises containing RCS bundles per language
            const rcsDataSet = rcsLoad(service.rcsUrl, keys, langs);

            return $q(resolve => {
                const currLang = currentLang();
                let newIds;

                langs.forEach(lang => {
                    // wait for rcs data to finish loading
                    rcsDataSet[lang].then(rcsConfig => {
                        if (lang === currLang) {
                            // store list of layer ids, so we can identify new items in the config later
                            newIds = rcsConfig.layers.map(layer => layer.id);
                        }

                        originalConfigs[lang].then(fullConfig => {
                            // call the merge into config, passing result and targeting innards of config service (all languages)
                            // make rcs value an array, as it will be a singleton with all things mooshed into .layers
                            mergeConfigParts(fullConfig, [rcsConfig]);

                            if (lang === currLang) {
                                // pull fully populated layer config nodes out the main config
                                const newConfigs = fullConfig.layers.filter(layerConfig => {
                                    return newIds.indexOf(layerConfig.id) > -1;
                                });

                                // return the new configs to the caller
                                resolve(newConfigs);
                            }
                        });
                    });
                });

            });
        }

        /**
         * Retrieve a set of config snippets from RCS
         * @function rcsLoad
         * @param {string}  svcPath     the server path of RCS
         * @param {array}  keys    array of keys marking which layers to retrieve
         * @param {array}   langs       array of languages which have configs
         * @return {Object}  mapping of language to promise that resolves in RCS config object
         */
        function rcsLoad(svcPath, keys, langs) {
            const endpoint = svcPath.endsWith('/') ? svcPath : svcPath + '/';
            const results = {};

            langs.forEach(lang => {
                // hit RCS for each language

                // remove country code
                let rcsLang = lang.split('-')[0];

                // rcs can only handle english and french
                // TODO: update if RCS supports more languages
                // TODO: make this language array a configuration option
                if (['en', 'fr'].indexOf(rcsLang) === -1) {
                    rcsLang = 'en';
                }

                const p = $http.get(`${endpoint}v2/docs/${rcsLang}/${keys.join(',')}`)
                    .then(resp => {
                        const result = { layers: [] };

                        // there is an array of layer configs in resp.data.
                        // moosh them into one single layer array on the result
                        // FIXME may want to consider a more flexible approach than just assuming RCS
                        // always returns nothing but a single layer per key.  Being able to inject any
                        // part of the config via would be more robust
                        resp.data.forEach(layerEntry => {
                            // if the key is wrong rcs will return null
                            if (layerEntry) {
                                const layer = layerEntry.layers[0];
                                layer.origin = 'rcs';
                                result.layers.push(layer);
                            }
                        });

                        return result;
                    });
                results[lang] = p;
            });

            return results;
        }

        /**
         * Checks if the service is ready to use.
         * @function ready
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
