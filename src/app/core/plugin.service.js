(() => {
    'use strict';

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

    function pluginService(translationService) {
        const service = {
            onCreate,
            register
        };

        const pluginList = [];
        const _onCreate = {};

        return service;

        /**
         * Registers a plugin instance with this viewer instance. Triggers any onCreate callbacks registered
         * to this plugin type.
         *
         * @function    register
         * @param       {Object}    plugin    the plugin instance being registered to this viewer
         */
        function register(plugin, api) {
            // initalize the plugin and give it api scope
            plugin = plugin();
            plugin.api = api;

            // check if the plugin already exists or shares an id with another plugin
            if (pluginList.find(pi => pi === plugin || pi.id === plugin.id)) {
                throw new Error('A plugin with the same instance or ID has already been registered.');
            }

            // add plugin id to translations to avoid conflicts
            Object.keys(plugin.translations).forEach(lang => {
                plugin.translations[lang] = {
                    plugin: { [plugin.id]: plugin.translations[lang] }
                };
            });

            // modify existing translations to include the plugin translations
            translationService(plugin.translations);
            pluginList.push(plugin);

            // call all onCreate callbacks for this plugin
            if (_onCreate[plugin.constructor.name]) {
                _onCreate[plugin.constructor.name].forEach(cb => cb(plugin));
            }
        }

        /**
         * Registers a callback function that is executed whenever a specific type of plugin is created as defined by pluginType
         *
         * @function    onCreate
         * @param       {Function}    pluginType    pointer to the plugin class
         * @param       {Function}    cb            callback function to execute on plugin creation
         */
        function onCreate(pluginType, cb) {
            _onCreate[pluginType] = _onCreate[pluginType] ? _onCreate[pluginType] : [];
            // register the plugin onCreate callback
            _onCreate[pluginType].push(cb);
            // trigger this callback for any plugin already created
            pluginList.filter(pi => pi.constructor.name === pluginType).forEach(cb);
        }
    }
})();
