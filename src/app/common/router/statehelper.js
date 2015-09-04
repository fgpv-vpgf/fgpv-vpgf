(function() {
    'use strict';

    angular
        .module('common.router')
        .provider('statehelperConfig', statehelperConfig)
        .factory('statehelper', statehelper);

    // Must configure via the statehelperConfigProvider in core.config.js
    function statehelperConfig() {
        /* jshint validthis:true */
        this.config = {
            // These are the properties we need to set
            // $stateProvider: undefined
            // resolveAlways: {ready: function(){ } }
        };

        this.$get = function() {
            return {
                config: this.config
            };
        };
    }

    statehelper.$inject = ['statehelperConfig'];

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
            states.forEach(function(state) {
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
