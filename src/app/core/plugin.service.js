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
        const onCreateList = [];

        return service;

        /**
         * Registers a plugin instance with this viewer instance. Triggers any onCreate callbacks registered
         * to this plugin type.
         *
         * @function    register
         * @param       {Object}    plugin    the plugin instance being registered to this viewer
         */
        function register() {
            // initalize the plugin and give it api scope
            const params = [...arguments];
            const Plugin = params.splice(0, 1)[0];
            const pluginId = params.splice(0, 1)[0];
            const api = params.pop();

            const p = new Plugin(pluginId, api);

            if (typeof p.init === 'function') {
                p.init(...params);
            }

            // check if the plugin already exists or shares an id with another plugin
            if (pluginList.find(pi => pi === p || pi.id === p.id)) {
                throw new Error('A plugin with the same instance or ID has already been registered.');
            }

            // add plugin id to translations to avoid conflicts
            Object.keys(p.translations).forEach(lang => {
                p.translations[lang] = {
                    plugin: { [p.id]: p.translations[lang] }
                };
            });

            // modify existing translations to include the plugin translations
            translationService(p.translations);
            pluginList.push(p);

            // execute onCreate callbacks for this plugin type
            onCreateList.forEach(x => p instanceof x.pluginType ? x.cb(p) : null);
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
    }
})();
