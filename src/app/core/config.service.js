/* global RV */

import schemaUpgrade from './schema-upgrade.service.js';

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

function configService($q, $rootElement, $timeout, $http, $translate, $mdToast, events, gapiService, ConfigObject) {
    // let initializePromise;
    // let isInitialized = false;

    const DEFAULT_LANGS = ['en-CA', 'fr-CA'];

    const States = {
        NEW: 0,
        LOADING: 1,
        LOADED: 2,
        UPDATING: 3
    };

    let _loadingState = States.NEW;
    let _remoteConfig = false;
    let languages;

    const jsonConfigs = {};
    let bookmarkConfig;
    const startupRcsLayers = {}; // partial config promises, one array per language entry

    const configs = {};
    const rcsLayerData = {};
    const configObjects = {};
    const initialPromises = {}; // only the initial configurations (i.e. whatever comes in config attribute)

    class ConfigService {
        get remoteConfig() { return _remoteConfig; }
        get loadingState() { return _loadingState; }
        get getSync() {
            if (_loadingState < States.LOADED) {
                throw new Error('Attempted to access config synchronously before loading completed.  Either use the promise based API or wait for rvReady.');
            }
            return configs[currentLang()];
        }
        get getAsync() { return initialPromises[currentLang()].then(() => configs[currentLang()]); }

        initialize() {
            _initialize();
        }

        /**
         * reinitial when a new config file is loaded
         * @function  reInitialize
         */
        reInitialize() {
            _loadingState = States.NEW;
            _initialize();
        }

        rcsAddKeys(keys) {
            const endpoint = this.getSync.services.rcsEndpoint;
            const rcsData = rcsLoad(endpoint, keys, languages);
            languages.forEach(lang => {
                if (!rcsLayerData[lang]) {
                    rcsLayerData[lang] = [];
                }
                rcsData[lang].then(data => {
                    const layers = data.layers;
                    rcsLayerData[lang].push(...layers);
                    if (lang === currentLang()) {
                        events.$broadcast(events.rvCfgUpdated, layers);
                    }
                });
            });
        }

        /**
         * Sets the current language to the supplied value and broadcasts config initialization event, since this is a new config object.
         * @param {String} value language value to be set
         */
        setLang(value) {
            $translate.use(value);
            events.$broadcast(events.rvCfgInitialized);
        }

        /**
         * Get the language to the supplied value
         * @function  getLang
         * @returns  {function}    function tha returns the current language
         */
        getLang() {
            return currentLang();
        }

        /**
         * NOTE this has different semantics from most events as it will trigger if a listener is registered,
         * but the config is already in a loaded state
         * @param {Function} listener an event handler to be triggered on config changes
         */
        onEveryConfigLoad(listener) {
            if (_loadingState >= States.LOADED) {
                listener(configs[currentLang()]);
            }
            this.listeners.push(listener);
            return () => {
                const idx = this.listeners.indexOf(listener);
                if (idx < 0) {
                    throw new Error('Attempting to remove a listener which is not registered.');
                }
                this.listeners.splice(idx, 1);
            };
        }

        constructor() {
            this.listeners = [];
            events.$on(events.rvCfgInitialized, () => {
                this.listeners.forEach(l => l(configs[currentLang()]));
            });
        }

    }

    return new ConfigService();

    /***************/

    /**
     * Loads the primary config based on the tagged attribute. This can be from a file, local variable or inline JSON.
     *
     * @param {String} configAttr the value of `rv-config`
     * @param {Array} langs an array of locales used to load and parse the config data
     * @return {Void}
     */
    function configLoader(configAttr, svcAttr, langs) {
        _loadingState = States.LOADING;
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
                _remoteConfig = true;
                langs.forEach(lang => {
                    initialPromises[lang] = $http.get(configAttr.replace('[lang]', lang)).then(r => r.data);
                });
            }
        }

        // unwrap the async value, since this should be accessed after rvCfgInitialized
        langs.forEach(lang => {
            initialPromises[lang] = $q.all([gapiService.isReady, initialPromises[lang]])
                .then(([,cfg]) => {
                    if (schemaUpgrade.isV1Schema(cfg.version)) {
                        cfg = schemaUpgrade.oneToTwo(cfg);
                    }
                    jsonConfigs[lang] = cfg;
                    cfg.language = lang;
                    cfg.languages = langs;
                    cfg.services.rcsEndpoint = svcAttr;
                    configs[lang] = new ConfigObject.ConfigObject(cfg);
                    RV.logger.log('configService', 'config object created', configs[lang]);
                    return configs[lang];
                });
            if (lang === langs[0]) {
                initialPromises[lang].then(cfg => {
                    _loadingState = States.LOADED;
                    events.$broadcast(events.rvCfgInitialized);
                });
            }
        });

    }

    function rcsLoader(svcAttr, keysAttr, languages) {
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
                    // configs[lang] = newConfig;
                    events.$broadcast(events.rvCfgUpdated, keys);
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
     * @function _initialize
     */
    function _initialize() {
        if (_loadingState !== States.NEW) {
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
        const svcAttr = $rootElement.attr('rv-service-endpoint');
        const keysAttr = $rootElement.attr('rv-keys');

        $translate.use(languages[0]);
        configLoader(configAttr, svcAttr, languages);

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
        const langs =  Object.keys(jsonConfigs);

        // get array of promises containing RCS bundles per language
        const rcsDataSet = rcsLoad(configs[currentLang()].services.rcsEndpoint, keys, langs);

        return $q(resolve => {
            const currLang = currentLang();

            langs.forEach(lang => {
                // wait for rcs data to finish loading
                rcsDataSet[lang].then(rcsConfig => {

                    // store list of layer ids, so we can identify new items in the config later
                    const newIds = rcsConfig.layers.map(layer => layer.id);

                    initialPromises[lang].then(fullConfig => {
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
