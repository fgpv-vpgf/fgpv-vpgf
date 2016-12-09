/* global RV */
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

        function register(plugin) {
            if (!(plugin instanceof RV.Plugin.BasePlugin)) {
                throw 'Plugin is not an extension of BasePlugin.';
            } else if (pluginList.find(pi => pi === plugin || pi.id === plugin.id)) {
                throw 'A plugin with the same instance or ID has already been registered.';
            }
            // register the plugin with this viewer
            pluginList.push(plugin);
            // call all onCreate callbacks for this plugin
            if (_onCreate[plugin.constructor.name]) {
                _onCreate[plugin.constructor.name].forEach(cb => cb(plugin));
            }
        }

        function onCreate(pType, cb) {
            _onCreate[pType] = _onCreate[pType] ? _onCreate[pType] : [];
            // register the plugin onCreate callback
            _onCreate[pType].push(cb);
            // trigger this callback for any plugin already created
            pluginList.forEach(pi => pi.constructor.name === pType ? cb(pi) : undefined);
        }
    }
})();
