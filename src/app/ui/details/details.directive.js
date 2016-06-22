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

    function Controller($scope, stateManager, geoService, $element) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;
        self.display = stateManager.display.details;
        self.selectItem = selectItem;

        self.getSectionNode = () => $element.find('.rv-details');

        stateManager.onCloseCallback('mainDetails', () => stateManager.clearDisplayPanel('mainDetails'));

        /**
        * Set the selected item from the array of items if previously set.
        * @private
        * @param {Object} items data objects array
        * @return {Object}      selected item in details panel
        */
        function getSelectedItem(items) {
            // get selected item if there is a match
            return items.find(item =>
                `${item.requester.caption}${item.requester.name}` === self.selectedInfo) || items[0];
        }

        /**
         * Closes loader pane and switches to the previous pane if any.
         */
        function closeDetails() {
            geoService.clearHilight();
            stateManager.setActive({ mainDetails: false });
        }

        /**
         * Changes the layer whose data is displayed.
         * @param  {Object} item data object
         */
        function selectItem(item) {
            self.selectedItem = item;
            self.selectedInfo = (item) ? `${item.requester.caption}${item.requester.name}` : null;

            self.display.selectedItem = self.selectedItem;

            // add hilights to all things in the layer.
            // TODO is this the appropriate place for hilighting code?
            if (item && item.requester && item.requester.featureIdx) {
                geoService.hilightGraphic(item.requester.layerRec, item.requester.featureIdx,
                    item.data.map(d => d.oid));
            }
        }

        $scope.$watch('self.display.data', newValue => {
            stateManager.setFocusElement($element.find('.rv-content-pane button[aria-label="Close"]'));
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick selected item user previously selected one, otherwise pick the first one
                selectItem(self.selectedInfo ? getSelectedItem(newValue) : newValue[0]);
            } else {
                self.selectItem(null);
            }
        });
    }
})();
