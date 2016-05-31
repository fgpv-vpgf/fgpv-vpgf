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

    // COMMENT to self: brief flickering of fake content is caused by immediately setting data and isLoading flag;
    // in a real case, we wait for 100ms to get data, and then set isLoading which;

    function Controller(stateManager, $scope) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;
        self.selectItem = selectItem;

        self.focusOnClose = evt => {
            if (evt.which === 13 || evt.which === 32 || evt.which === 33) {
                stateManager.getFocusElement().focus();
            }
        };

        self.display = stateManager.display.details; // garbage data

        // TODO: adding stateManger to scope to set up watch
        $scope.$watch('self.display.data', newValue => {
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick selected item user previously selected one, otherwise pick the first one
                // do not use selectItem() because we want to update selectedInfo only when user do it
                const item = (self.selectedInfo) ? getSelectedItem(newValue) : newValue[0];
                self.selectedItem = item;
            } else {
                selectItem(null);
            }
        });

        /*********/

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
            stateManager.closePanelFromHistory();
        }

        /**
         * Changes the layer whose data is displayed.
         * @param  {Object} item data object
         */
        function selectItem(item) {
            self.selectedItem = item;
            self.selectedInfo = (item) ? `${item.requester.caption}${item.requester.name}` : null;

            // set this value will trigger the watch inside details-content.directive.js
            // TODO: need a different way to pass data to expand directive; this can break easily
            self.display.selectedItem = self.selectedItem;
            self.onLeave();
        }
    }
})();
