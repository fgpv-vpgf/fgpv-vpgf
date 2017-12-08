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

function configService($q, $rootElement, $timeout, $http, $translate, $mdToast, events, gapiService, ConfigObject, stateManager) {
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
    let configList = [];

    /**
     * Each language has an instance of this class. However, it is only populated when you call `configInstance.promise`. At this point
     * it fetches any external configs and loads RCS for that language.
     */
    class Config {
        constructor(configAttr, rcsEndpoint, language) {
            this.language = language;
            this.rcsEndpoint = rcsEndpoint;
            this.configAttr = configAttr;
            this._rcsKeys = [];
        }

        /**
         * Attempt to populate the config as a JSON object or a global window object
         *
         * @return  {boolean}   true if config was populated, false indicates an exteral config
         */
        parseSync() {
            return this.parseAsJson() || this.parseAsGlobalObject();
        }

        /**
         * Attempts to populate the config as a JSON object
         *
         * @return  {boolean}   true if config was populated, false otherwise
         */
        parseAsJson() {
            try {
                this.config = JSON.parse(this.configAttr);
            } catch (e) {
                // do nothing
            }
            return !!this.config;
        }

        /**
         * Attempts to populate the config from a global window object
         *
         * @return  {boolean}   true if config was populated, false otherwise
         */
        parseAsGlobalObject() {
            if (window.hasOwnProperty(this.configAttr)) {
                this.config = window[this.configAttr];
            }
            return !!this.config;
        }

        /**
         * Given a config object, this converts it into a useable form for the viewer.
         *
         * @param   conf    {object}    a vanilla javascript object of the configuration
         */
        set config(conf) {
            if (schemaUpgrade.isV1Schema(conf.version)) {
                conf = schemaUpgrade.oneToTwo(conf);
            }

            conf.language = this.language;
            conf.languages = languages;
            conf.services.rcsEndpoint = this.rcsEndpoint;
            this._config = new ConfigObject.ConfigObject(conf);
        }

        get config() { return this._config; }

        set rcsKeys(keys) { this._rcsKeys = keys; this.processRCS(); }

        /**
         * Processes RCS keys if any are present
         *
         * @return  {Promise}   resolves with config object when rcs lookup is complete
         */
        processRCS() {
            if (this._rcsKeys.length === 0) {
                return this.config;
            }

            if (typeof this.rcsEndpoint === 'undefined') {
                throw new Error('RCS keys provided with no endpoint. Set on HTML element through rv-service-endpoint property');
            }

            const endpoint = this.rcsEndpoint.endsWith('/') ? this.rcsEndpoint : this.rcsEndpoint + '/';
            const results = {};
            let rcsLang = this.language.split('-')[0];

            // rcs can only handle english and french
            // TODO: update if RCS supports more languages
            // TODO: make this language array a configuration option
            if (['en', 'fr'].indexOf(rcsLang) === -1) {
                rcsLang = 'en';
            }

            return $http.get(`${endpoint}v2/docs/${rcsLang}/${this._rcsKeys.join(',')}`).then(resp => {
                const result = [];

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
                        result.push(layer);
                    }
                });

                this.config.map.layers.push(...result);
                events.$broadcast(events.rvCfgUpdated, result);

                return this.config;
            });
        }

        /**
         * This is what starts the loading process. Before this, the config object is "empty".
         *
         * @return  {Promise}   Resolves when the configuration is ready (and RCS is loaded)
         */
        get promise () {
            // prevent creating multiple promises, if one is in progress just return it.
            if (!this._promise) {
                this._promise = new Promise(resolve => {
                    if (typeof this.config === 'object' || this.parseSync()) {
                        resolve(this.config);
                    } else {
                        $http
                            .get(this.configAttr.replace('[lang]', this.language))
                            .then(r => {
                                this.config = r.data;
                                resolve(this.config)
                            });
                    }
                }).then(() => this.processRCS());
            }
            return this._promise;
        }

    }

    class ConfigService {
        get remoteConfig() { return _remoteConfig; }
        get loadingState() { return _loadingState; }
        get getSync() {
            if (_loadingState < States.LOADED) {
                throw new Error('Attempted to access config synchronously before loading completed.  Either use the promise based API or wait for rvReady.');
            }
            return getConfigByLanguage(currentLang()).config;
        }
        get getAsync() { return getConfigByLanguage(currentLang()).promise; }

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
            configList.forEach(conf => { conf.rcsKeys = keys; });
        }

        /**
         * Reset the map by removing all layers after the map has been instantiated.
         *
         * @memberof app.core
         * @function resetMap
         */
        resetMap() {
            configList.forEach(conf => {
                if (conf.config) {
                    const map = conf.config.map;

                    // remove all layers from legend
                    while (map.legendBlocks.entries.length > 0) {
                        map.legendBlocks.removeEntry(map.legendBlocks.entries[0]);
                    }

                    map.legendMappings = {};

                    // remove all layers from map
                    map.layerRecords.forEach(layerRecord => {
                        map.instance.removeLayer(layerRecord._layer);
                    });

                    map.layerRecords = [];
                    map.layerBlueprints = [];
                    map.layers = [];

                    // remove all bounding boxes
                    map.boundingBoxRecords.forEach(boundingRecord => {
                        map.instance.removeLayer(boundingRecord);
                    });

                    map.boundingBoxRecords = [];

                    // close any open panels
                    stateManager.setActive({ tableFulldata: false } , { sideMetadata: false }, { sideSettings: false });
                }
            });
        }

        /**
         * Sets the current language to the supplied value and broadcasts config initialization event, since this is a new config object.
         * @param {String} lang language value to be set
         */
        setLang(lang) {
            $translate.use(lang);
            // only broadcast when config is ready
            getConfigByLanguage(lang).promise.then(() => {
                events.$broadcast(events.rvCfgInitialized);
            });
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
                listener(getConfigByLanguage(currentLang()).config);
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
                this.listeners.forEach(l => l(
                    getConfigByLanguage(currentLang()).config)
                );
            });
        }

    }

    return new ConfigService();

    /***************/

    function getConfigByLanguage(lang) {
        return configList.find(c => c.language === lang);
    }

    /**
     * Loads the primary config based on the tagged attribute. the primary config based on the tagged attribute. This can be from a file, local variable or inline JSON.
     *
     * @param {String} configAttr the value of `rv-config`
     * @param {Array} langs an array of locales used to load and parse the config data
     * @return {Void}
     */
    function configLoader(configAttr, svcAttr, langs) {
        _loadingState = States.LOADING;
        configList = [];    // empty previous configs

        // create initial config objects
        langs.forEach(lang => {
            configList.push(new Config(configAttr, svcAttr, lang));
        });

        // load first config once gapi is ready, other configs will be loaded as needed
        $q.all([gapiService.isReady, configList[0].promise]).then(() => {
            _loadingState = States.LOADED;
            events.$broadcast(events.rvCfgInitialized);
        });

        // For switching Config
        gapiService.isReady.then(function() {
            _loadingState = States.LOADED;
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
                    configList.forEach(conf => { conf.rcsKeys = keys; });
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
}
