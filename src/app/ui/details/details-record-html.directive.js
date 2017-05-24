(() => {
    'use strict';

    /**
     * @module rvDetailsRecordHtml
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordHtml` directive renders the data content of details.
     *
     */
    angular
        .module('app.ui')
        .directive('rvDetailsRecordHtml', rvDetailsRecordHtml);

    /**
     * `rvDetailsRecordHtml` directive body.
     *
     * @function rvDetailsRecordHtml
     * @return {object} directive body
     */
    function rvDetailsRecordHtml() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record-html.html',
            scope: {
                item: '=',
                mapPoint: '='
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

        $scope.$on(events.rvHighlightDetailsItem, (event, item) => {
            if (item !== self.item) {
                return;
            }

            _redrawHighlight();
        });

        // watch for selected item changes; reset the highlight;
        $scope.$watch('self.item', newValue => {
            if (typeof newValue !== 'undefined') {
                _redrawHighlight();
            }
        });

        /**
         * Redraws marker highlight for html records.
         *
         * @function _redrawHighlight
         * @private
         */
        function _redrawHighlight() {
            // adding marker highlight the click point because the layer doesn't support feature highlihght (not discernible geometry)
            mapService.addMarkerHighlight(self.mapPoint, true);
        }
    }
})();
