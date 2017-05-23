(() => {
    'use strict';

    /**
     * @module rvDetailsRecordEsrifeature
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordEsrifeature` directive renders the data content of details.
     *
     */
    angular
        .module('app.ui')
        .directive('rvDetailsRecordEsrifeature', rvDetailsRecordEsrifeature);

    /**
     * `rvDetailsRecordEsrifeature` directive body.
     *
     * @function rvDetailsRecordEsrifeature
     * @return {object} directive body
     */
    function rvDetailsRecordEsrifeature() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record-esrifeature.html',
            scope: {
                item: '=item'
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

        self.highlightFeature = highlightFeature;

        $scope.$on(events.rvHighlightFeature, (event, item) => {
            if (item !== self.item) {
                return;
            }

            self.item.data.forEach(({ oid }) =>
                highlightFeature(oid));
        });

        return;

        /**
         * Highlights the feature with oid specified by adding it to the highlight layer.
         *
         * @function highlightFeature
         * @param {String} oid id of the feature to be highlighted
         */
        function highlightFeature(oid) {
            const graphiBundlePromise = self.item.requester.proxy.fetchGraphic(oid);
            mapService.addGraphicHighlight(graphiBundlePromise, true);
        }
    }
})();
