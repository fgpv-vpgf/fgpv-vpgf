(() => {
    'use strict';

    /**
     * @module rvDetailsRecordHTML
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordHTML` directive renders the data content of details.
     *
     */
    angular
        .module('app.ui')
        .directive('rvDetailsRecordHTML', rvDetailsRecordHTML);

    /**
     * `rvDetailsRecordHTML` directive body.
     *
     * @function rvDetailsRecordHTML
     * @return {object} directive body
     */
    function rvDetailsRecordHTML() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record-html.html',
            scope: {
                item: '='
            },
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($scope, events, mapService) {
        'ngInject';
        const self = this;

        $scope.$on(events.rvHighlightFeature, (event, item) => {
            if (item !== self.item) {
                return;
            }

            // adding marker highlight the click point because the layer doesn't support feature highlihght (not discernible geometry)
            mapService.addMarkerHighlight(self.item.requester.mapPoint, true);
        });
    }
})();
