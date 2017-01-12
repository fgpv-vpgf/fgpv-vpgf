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

    function pluginService() {
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
        function register(plugin) {
            if (pluginList.find(pi => pi === plugin || pi.id === plugin.id)) {
                throw new Error('A plugin with the same instance or ID has already been registered.');
            }

            // register the plugin with this viewer
            pluginList.push(plugin);
            console.info(`Registering ${plugin.constructor.name}`);

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
            _onCreate[pluginType.name] = _onCreate[pluginType.name] ? _onCreate[pluginType.name] : [];
            // register the plugin onCreate callback
            _onCreate[pluginType.name].push(cb);
            console.info(`oncreate call for ${pluginType.name}`);
            // trigger this callback for any plugin already created
            pluginList.filter(pi => pi instanceof pluginType).forEach(cb);
        }
    }
})();
