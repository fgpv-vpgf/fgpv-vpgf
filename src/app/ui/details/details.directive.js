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

    function rvDetails(stateManager) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details.html',
            link
        };

        return directive;

        function link(scope, element) {
            const self = scope.self;

            self.closeDetails = closeDetails;

            self.display = stateManager.display.details;

            /**
             * Changes the layer whose data is displayed.
             * @param  {Object} item data object
             */
            self.selectItem = item => {
                self.selectedItem = item;
                self.selectedInfo = (item) ? `${item.requester.caption}${item.requester.name}` : null;
            };

            scope.$watch('self.display.data', newValue => {
                stateManager.setFocusElement(element.find('.rv-content-pane button[aria-label="Close"]'));
                // if multiple points added to the details panel ...
                if (newValue && newValue.length > 0) {
                    // pick selected item user previously selected one, otherwise pick the first one
                    // do not use selectItem() because we want to update selectedInfo only when user do it
                    const item = (self.selectedInfo) ? getSelectedItem(newValue) : newValue[0];
                    self.selectedItem = item;
                } else {
                    self.selectItem(null);
                }
            });

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
                stateManager
                    .openPrevious('mainDetails')
                    .then(() => stateManager.clearDisplayPanel('mainDetails')); // clear `details` display;
            }
        }
    }
})();
