(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDetails
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetails` directive to display point data and wms query results.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetails', rvDetails);

    function rvDetails() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link() { //scope, el, attr, ctrl) {

        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;
        self.closeDetails = closeDetails;

        activate();

        ///////////

        function activate() {

        }

        function closeDetails() {
            stateManager.set({ side: false }, 'mainToc');
        }
    }
})();
