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

    const configs = {};
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

        /**
         * Load RCS layers after the map has been instantiated.
         * Triggers an event to update the config when done
         *
         * @memberof app.core
         * @function rcsAddKeys
         * @param {Array}  keys  array of RCS keys (String) to be added
         */
        rcsAddKeys(keys) {
            const endpoint = this.getSync.services.rcsEndpoint;
            _rcsAddKeys(endpoint, keys);

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

        const configAttr = $rootElement.attr('rv-config');
        const svcAttr = $rootElement.attr('rv-service-endpoint');
        const keysAttr = $rootElement.attr('rv-keys');

        $translate.use(languages[0]);
        configLoader(configAttr, svcAttr, languages);

        // handle if any rcs keys were on the html tag.
        if (svcAttr && keysAttr) {
            try {
                const keys = angular.fromJson(keysAttr);

                // TODO small potential for race condition. In all likelyhood, if rvBookmarkDetected
                //      is raised it should happen long before rvApiReady, but nothing is ever guaranteed
                //      with single-thread-asynch.
                let deregisterReadyListener;
                let deregisterBookmarkListener;

                // wait for map to be ready, then trigger the rcs load.
                deregisterReadyListener = events.$on(events.rvApiReady, () => {
                    deregisterReadyListener();
                    deregisterBookmarkListener();
                    _rcsAddKeys(svcAttr, keys);
                });

                // if we have a bookmark, abort loading from the rcs tags.
                // the layers we want will be encoded in the bookmark
                deregisterBookmarkListener = events.$on(events.rvBookmarkDetected, () => {
                    deregisterReadyListener();
                    deregisterBookmarkListener();
                });

            } catch (e) {
                RV.logger.error('configService', 'RCS key retrieval failed with error', e);
            }
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
     * Load RCS layers after the map has been instantiated.
     * Triggers an event to update the config when done
     * @function _rcsAddKeys
     * @param {String} endpoint           RCS server url
     * @param {Array} keys                array of RCS keys (String) to be added
     * @return {Void}
     */
    function _rcsAddKeys(endpoint, keys) {
        const rcsData = rcsLoad(endpoint, keys, languages);
        languages.forEach(lang => {
            rcsData[lang].then(data => {
                const layers = data.layers;
                initialPromises[lang].then(() => {
                    // feed the keys into the config, then tell the map
                    // the config has updated
                    configs[lang].map.layers.push(...layers);
                    if (lang === currentLang()) {
                        events.$broadcast(events.rvCfgUpdated, layers);
                    }
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
