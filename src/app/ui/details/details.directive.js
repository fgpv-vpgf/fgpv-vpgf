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

    function Controller($scope, $element, events, stateManager, mapService, detailService, SymbologyStack) {
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
            // item.data contains layer hits returned by identify
            if (item && item.data.length > 0) {
                // clear all highlighted features when the user switches to a different layer in the details layer selector which has hits
                mapService.clearHighlight();
            } else if (self.display.requester) {
                // adding marker highlight to highlight the click point because there is no hits on the selected layer
                mapService.addMarkerHighlight(self.display.requester.mapPoint, true);
            }

            if (self.selectedItem === item) {
                // re-highlight features in this item
                // the previous highlight might have been cancelled by panning, and the user can re-highlihght feature by clicking on the selected layer again
                $scope.$broadcast(events.rvHighlightFeature, item);

                // this item is already selected; exiting;
                return;
            }

            self.selectedItem = item;
            self.selectedLayerProxy = item ? item.requester.proxy : null;

            self.display.selectedItem = self.selectedItem;
        }

        $scope.$watch('self.display.data', (newValue, oldValue) => {
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick selected item user previously selected one, otherwise pick the first one
                selectItem(getSelectedItem(newValue) || newValue[0]);

                // wrap symbology returned by the proxy into a symbology stack object
                newValue.forEach(item =>
                    (item.requester.symbologyStack = new SymbologyStack(item.requester.proxy)));
            } else if (oldValue) {
                selectItem(null);
            }
        });
    }
})();
