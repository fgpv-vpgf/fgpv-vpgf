(() => {
    'use strict';

    /**
     * @module rvDetailsRecordText
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordText` directive renders the data content of details.
     *
     */
    angular
        .module('app.ui')
        .directive('rvDetailsRecordText', rvDetailsRecordText);

    /**
     * `rvDetailsRecordText` directive body.
     *
     * @function rvDetailsRecordText
     * @return {object} directive body
     */
    function rvDetailsRecordText() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record-text.html',
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
         * Redraws marker highlight for text records.
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
