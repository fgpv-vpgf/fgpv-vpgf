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
            // console.log('self.display.data', newValue);
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick first point to be selected initially
                self.selectedItem = newValue[0];
            } else {
                self.selectedItem = null;
            }
        });

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
            self.onLeave();
        }
    }
})();
