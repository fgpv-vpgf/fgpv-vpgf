/* global RV */
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

    function configService($q, $rootScope, $rootElement, $timeout, $http, $translate, $mdToast, events, schemaUpgrade) {
        // let initializePromise;
        // let isInitialized = false;

        const DEFAULT_LANGS = ['en-CA', 'fr-CA'];

        const States = {
            NEW: 0,
            LOADING: 1,
            LOADED: 2,
            UPDATING: 3
        };

        let loadingState = States.NEW;

        const configs = {};

        const service = {
            _sharedConfig_: null,

            configs,
            loadingState,
            currentLang,
            getCurrent,
            getOriginal,
            initialize,
            rcsAddKeys,
            rcsUrl: '',
            setCurrent,
            getLanguages
        };

        const originalConfigs = {};
        let bookmarkConfig;

        const startupRcsLayers = {}; // partial config promises, one array per language entry
        // const configFile = {};
        const initialPromises = {}; // only the initial configurations (i.e. whatever comes in config attribute)
        let remoteConfig = false;
        let languages;

        return service;

        /***************/

        function configLoader(configAttr, langs) {
            loadingState = States.LOADING;
            try {
                const config = JSON.parse(configAttr);
                config.forEach(lang =>
                    (initialPromises[lang] = $q.resolve(config[lang])));
            } catch (e) {
                if (window.hasOwnProperty(configAttr)) {
                    const config = window[configAttr];
                    langs.forEach(lang =>
                        (initialPromises[lang] = $q.resolve(config[lang])));
                } else {
                    remoteConfig = true;
                    langs.forEach(lang => {
                        initialPromises[lang] = $http.get(configAttr.replace('${lang}', lang)).then(r => r.data);
                    });
                }
            }

            // unwrap the async value, since this should be accessed after rvCfgInitialized
            langs.forEach(lang => {
                initialPromises[lang] = initialPromises[lang].then(cfg => {
                    if (schemaUpgrade.isV1Schema(cfg.version)) {
                        cfg = schemaUpgrade.oneToTwo(cfg);
                    }
                    configs[lang] = cfg;
                    return cfg;
                });
                if (lang === langs[0]) {
                    initialPromises[lang].then((/*cfg*/) => {
                        loadingState = States.LOADED;
                        $rootScope.$broadcast(events.rvCfgInitialized);
                    });
                }
            });

        }

        function rcsLoader(svcAttr, keysAttr, languages) {
            service.rcsUrl = svcAttr;
            const keys = rcsInit(svcAttr, keysAttr, languages);
            languages.forEach(lang => {
                $q.all([startupRcsLayers[lang], initialPromises[lang]])
                .then(configParts => {
                    // generate a blank config, merge in all the stuff we have loaded
                    // the merged config is our promise result for all to use
                    const newConfig = {
                        layers: []
                    };
                    mergeConfigParts(newConfig, configParts);
                    configs[lang] = newConfig;
                    $rootScope.$broadcast(events.rvCfgUpdated, keys);
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
                });
            });
        }

        /**
         * Initializes `configService` by fetching and parsing `config` object.
         * @function initialize
         */
        function initialize() {
            if (loadingState !== States.NEW) {
                return;
            }

            const langAttr = $rootElement.attr('rv-langs');
            languages = DEFAULT_LANGS;
            if (langAttr) {
                try {
                    languages = angular.fromJson(langAttr);
                } catch (e) {
                    console.warn(`Could not parse langs, defaulting to ${DEFAULT_LANGS}`);
                    // TODO: better way to handle when no languages are specified?
                }
            }
            languages.forEach(lang =>
            (startupRcsLayers[lang] = []));

            const configAttr = $rootElement.attr('rv-config');
            $translate.use(languages[0]);
            configLoader(configAttr, languages);

            const svcAttr = $rootElement.attr('rv-service-endpoint');
            const keysAttr = $rootElement.attr('rv-keys');
            if (svcAttr) {
                rcsLoader(svcAttr, keysAttr, languages);
            }
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
            return $q(resolve => {
                if (loadingState < States.LOADED) {
                    $rootScope.$on(events.rvCfgInitialized, () => resolve(configs[currentLang()]));
                } else {
                    resolve(configs[currentLang()]);
                }
            });
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
            return getCurrent();
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
         * @return {array}              the list of keys used for the RCS request (parsed from keysAttr)
         */
        function rcsInit(svcAttr, keysAttr, langs) {
            let keys;
            if (keysAttr) {
                try {
                    keys = angular.fromJson(keysAttr);
                } catch (e) {
                    RV.logger.error('configService', 'RCS key retrieval failed with error', e);
                }

                const rcsData = rcsLoad(svcAttr, keys, langs);
                langs.forEach(lang => {
                    // add the rcs data promises to our partials set
                    startupRcsLayers[lang].push(rcsData[lang]);
                });
            } else {
                RV.logger.warn('configService', 'RCS endpoint set but no keys were specified');
            }
            return keys;
        }

        /**
         * Add RCS config layers to configuration after startup has finished
         * @function rcsAddKeys
         * @param {Array} keys                list of keys marking which layers to retrieve
         * @param {Boolean} [fromApi=true]    determines if we are adding keys from the api. false if from internal reloads
         * @return {Promise} promise of full config nodes for newly added layers
         */
        function rcsAddKeys(keys, fromApi = true) {

            // strip languages out of data object.
            const langs =  Object.keys(originalConfigs);

            // get array of promises containing RCS bundles per language
            const rcsDataSet = rcsLoad(service.rcsUrl, keys, langs);

            return $q(resolve => {
                const currLang = currentLang();

                langs.forEach(lang => {
                    // wait for rcs data to finish loading
                    rcsDataSet[lang].then(rcsConfig => {

                        // store list of layer ids, so we can identify new items in the config later
                        const newIds = rcsConfig.layers.map(layer => layer.id);

                        originalConfigs[lang].then(fullConfig => {
                            if (!fromApi) {
                                // it is possible the rcs keys we are adding already exist in the current
                                // config object. we want to remove those keys prior to doing the merge below
                                newIds.forEach(newId => {
                                    const oldLayer = fullConfig.layers.find(c => c.id === newId);
                                    if (oldLayer) {
                                        fullConfig.layers.splice(fullConfig.layers.indexOf(oldLayer), 1);
                                    }
                                });
                            }

                            // call the merge into config, passing result and targeting innards of config service (all languages)
                            // make rcs value an array, as it will be a singleton with all things mooshed into .layers
                            mergeConfigParts(fullConfig, [rcsConfig]);

                            if (lang === currLang) {
                                // pull fully populated layer config nodes out the main config
                                const newConfigs = fullConfig.layers.filter(layerConfig =>
                                    newIds.indexOf(layerConfig.id) > -1);

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
                                let layer = layerEntry.layers[0];
                                layer = schemaUpgrade.layerNodeUpgrade(layer);
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
    }
})();
