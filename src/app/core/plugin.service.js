import Viewer from './api/viewer.class';
import Layers from './api/layers.class';

/**
 * @name pluginService
 * @module app.core
 * @description
 *
 * The `pluginService` service provides access to all viewer plugins. You can optionally provide a callback for specific
 * types of plugins which is triggered when a plugin is created.
 */
angular
    .module('app.core')
    .factory('pluginService', pluginService);

function pluginService($injector, events, $rootScope, translationService, appInfo) {
    const service = {
        onCreate
    };

    const pluginList = []; // an array of registered plugin instances
    const onCreateList = []; // an array of object pairs in the form {class, callback}.
    const API = buildAPI();

    // Attaches a promise to the appRegistry which resolves with apiService
    $rootScope.$on(events.rvApiReady, register_plugins);

    return service;

    /**
     * Invokes all plugin constructors found in window.rvPlugins.add. Triggers any onCreate callbacks registered
     * to this plugin type.
     *
     * @function    register_plugins
     */
    function register_plugins() {

        window.rvPlugins.add.forEach((pluginLoader, i) => {

            let pluginBuilder = pluginLoader;

            if (typeof pluginLoader === 'function') {
                pluginBuilder = pluginLoader({viewerID: appInfo.id});

                if (!pluginBuilder) {
                    return;
                }
            }

            let pluginID;
            if (typeof pluginBuilder[1] === 'string') {
                pluginID = pluginBuilder[1];
            } else if (pluginBuilder.length === 3) {
                pluginID = pluginBuilder[2];
            } else {
                pluginID = i;
            }

            // check if the plugin already exists or shares an id with another plugin
            if (pluginList.find(pi => pi.id === pluginID)) {
                console.error('A plugin with the same instance or ID has already been registered.');
                return;
            }

            API.plugin = {
                id: pluginID,
                options: pluginBuilder.length >= 2 ? pluginBuilder[1] : null
            };

            const p = new pluginBuilder[0](API);

            if (typeof p.init === 'function') {
                p.init();
            }

            // add plugin id to translations to avoid conflicts
            Object.keys(p.translations).forEach(lang => {
                p.translations[lang] = {
                    plugin: { [API.plugin.id]: p.translations[lang] }
                };
            });

            // modify existing translations to include the plugin translations
            translationService(p.translations);
            pluginList.push(p);

            // execute onCreate callbacks for this plugin type
            onCreateList.filter(x => p instanceof x.pluginType).forEach(x => x.cb(p));
        });
    }

    /**
     * Registers a callback function that is executed whenever a specific type of plugin is created as defined by pluginType
     *
     * @function    onCreate
     * @param       {Function}    pluginType    pointer to the plugin class
     * @param       {Function}    cb            callback function to execute on plugin creation
     */
    function onCreate(pluginType, cb) {
        // save to list which is checked whenever a new plugin is registered
        onCreateList.push({
            pluginType,
            cb
        });

        // trigger this callback for any plugin already created
        pluginList.filter(pi => pi instanceof pluginType).forEach(cb);
    }

    function buildAPI() {
        return {
            viewer: $injector.invoke(Viewer),
            layers: $injector.instantiate(Layers)
        };
    }
}
