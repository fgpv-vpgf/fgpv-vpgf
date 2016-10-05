(() => {
    'use strict';

    /**
     * @module rvGeosearch
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvGeosearch` directive let user enter text for a geolocation search.
     *
     */
    angular
        .module('app.ui.geosearch')
        .directive('rvGeosearch', rvGeosearch);

    /**
     * `rvGeosearch` directive body.
     *
     * @function rvGeosearch
     * @return {object} directive body
     */
    function rvGeosearch() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager, geosearchService) {
        'ngInject';
        const self = this;

        self.stateManager = stateManager;
        self.geosearchService = geosearchService;
    }
})();
