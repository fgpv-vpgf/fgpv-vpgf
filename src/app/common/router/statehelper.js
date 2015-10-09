(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name statehelperConfig
     * @module app.common.router
     * @description
     *
     * The `statehelperConfig` provider is used to configure `statehelper` before it's initialized.
     *
     * Must configure via the statehelperConfigProvider in core.config.js
     */
    /**
     * @ngdoc service
     * @name statehelper
     * @module app.common.router
     * @description
     *
     * The `statehelper` services supports adding additional states to the global state tree from other modules.
     * It is also responsible for handling routing errors (coming soon).
     */
    angular
        .module('app.common.router')
        .provider('statehelperConfig', statehelperConfig)
        .factory('statehelper', statehelper);

    function statehelperConfig() {
        /* jshint validthis:true */
        this.config = {
            // These are the properties we need to set
            // $stateProvider: undefined
            // resolveAlways: {ready: function(){ } }
        };

        this.$get = function () {
            return {
                config: this.config
            };
        };
    }

    // TODO: add routing error handling
    /* @ngInject */
    function statehelper(statehelperConfig) {
        var $stateProvider = statehelperConfig.config.$stateProvider;

        var service = {
            configureStates: configureStates,
            getStates: getStates,
            stateCounts: stateCounts
        };

        return service;

        ////////////////

        function configureStates(states) {
            states.forEach(function (state) {
                //state.config.resolve =
                //    angular.extend(state.config.resolve || {}, statehelperConfig.config.resolveAlways);
                $stateProvider.state(state.name, state.config);
            });

            //$stateProvider.otherwise({redirectTo: '/'});
        }

        function getStates() {

        }

        function stateCounts() {

        }
    }
})();
