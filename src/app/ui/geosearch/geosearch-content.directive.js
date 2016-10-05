(() => {
    'use strict';

    /**
     * @module rvGeosearchContent
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvGeosearchContent` directive to manage geosearch tool content.
     *
     */
    angular
        .module('app.ui.geosearch')
        .directive('rvGeosearchContent', rvGeosearchContent);

    /**
     * `rvGeosearchContent` directive body.
     *
     * @function rvGeosearchContent
     * @return {object} directive body
     */
    function rvGeosearchContent() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/geosearch/geosearch-content.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(stateManager, geosearchService, $scope) {
        'ngInject';
        const self = this;

        self.stateManager = stateManager;
        self.geosearchService = geosearchService;

        // watch modification for the results from the query and show them
        self.items = [];
        $scope.$watch(() => { return geosearchService.results; }, () => {
            self.items = geosearchService.results.values;
        }, true);
    }
})();
