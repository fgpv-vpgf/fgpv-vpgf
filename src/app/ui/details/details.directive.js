(() => {
    'use strict';
    /**
     * @module rvDetails
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetails` directive to display point data and wms query results.
     * Where are multiple data items, displays a selector list on the left side, letting the user to select the item.
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
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($scope, $element, stateManager, geoService, detailService, SymbologyStack) {
        'ngInject';
        const self = this;

        self.closeDetails = detailService.closeDetails;
        self.display = stateManager.display.details;
        self.selectItem = selectItem;
        self.expandPanel = detailService.expandPanel;

        self.getSectionNode = () =>
            $element.find('.rv-details');

        /**
        * Set the selected item from the array of items if previously set.
        * @private
        * @function  getSelectedItem
        * @param {Object} items data objects array
        * @return {Object}      selected item in details panel
        */
        function getSelectedItem(items) {
            // get selected item if there is a match
            return items.find(item =>
                item.requester.proxy === self.selectedLayerProxy);
        }

        /**
         * Changes the layer whose data is displayed.
         * @function selectItem
         * @param  {Object} item data object
         */
        function selectItem(item) {
            self.selectedItem = item;
            self.selectedLayerProxy = item ? item.requester.proxy : null;

            self.display.selectedItem = self.selectedItem;

            // add hilights to all things in the layer.
            // featureIdx can be 0, so no falsy checks allowed
            // TODO is this the appropriate place for hilighting code?
            // FIXME: refactor restore
            /*
            if (item && item.requester && typeof item.requester.featureIdx !== 'undefined') {
                geoService.hilightGraphic(item.requester.layerRec, item.requester.featureIdx,
                    item.data.map(d => d.oid));
            }*/
        }

        $scope.$watch('self.display.data', newValue => {
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick selected item user previously selected one, otherwise pick the first one
                selectItem(getSelectedItem(newValue) || newValue[0]);

                // wrap symbology returned by the proxy into a symbology stack object
                newValue.forEach(item => {
                    item.requester.symbologyStack = new SymbologyStack(item.requester.proxy)
                });
            } else {
                self.selectItem(null);
            }
        });
    }
})();
