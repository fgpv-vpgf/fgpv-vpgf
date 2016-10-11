(() => {
    'use strict';

    /**
     * @module rvDetailsExpand
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsExpand` directive allows details to be expanded into a modal box when
     * the expand button is clicked.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsExpand', rvDetailsExpand);

    /**
     * `rvDetailsExpand` directive body.
     *
     * @function rvDetailsExpand
     * @return {object} directive body
     */
    function rvDetailsExpand() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-expand.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(detailService) {
        'ngInject';
        const self = this;

        self.expandPanel = detailService.expandPanel;
    }
})();
