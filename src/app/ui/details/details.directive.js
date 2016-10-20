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

    function Controller($scope, stateManager, geoService, $element, focusService) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;
        self.display = stateManager.display.details;
        self.selectItem = selectItem;

        self.getSectionNode = () => $element.find('.rv-details');

        stateManager.setCloseCallback('mainDetails', closeDetails);

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
                `${item.requester.caption}${item.requester.name}` === self.selectedInfo) || items[0];
        }

        /**
         * Closes loader pane and switches to the previous pane if any.
         * @function closeDetails
         */
        function closeDetails() {
            stateManager.clearDisplayPanel('mainDetails');
            geoService.clearHilight();

            if (stateManager.panelHistory.find(x => x === 'mainToc')) {
                stateManager.togglePanel('mainDetails', 'mainToc');
            } else {
                stateManager.setActive({ mainDetails: false });
            }
        }

        /**
         * Changes the layer whose data is displayed.
         * @function selectItem
         * @param  {Object} item data object
         */
        function selectItem(item) {
            self.selectedItem = item;
            self.selectedInfo = (item) ? `${item.requester.caption}${item.requester.name}` : null;

            self.display.selectedItem = self.selectedItem;

            // add hilights to all things in the layer.
            // featureIdx can be 0, so no falsy checks allowed
            // TODO is this the appropriate place for hilighting code?
            if (item && item.requester && typeof item.requester.featureIdx !== 'undefined') {
                geoService.hilightGraphic(item.requester.layerRec, item.requester.featureIdx,
                    item.data.map(d => d.oid));
            }

            // get legend entry from the requester to watch modification on visiiblity for sublayer
            if (item !== null) {
                const legendEntry = item.requester.layerRec.legendEntry;

                // if only one item, set the value directly
                if (legendEntry.items === undefined) {
                    self.selectedItem.requester.visible = legendEntry.options.visibility.value;
                } else {
                    // walk the legend entry to find the item related to the requester
                    legendEntry.walkItems((legendEntry) => {
                        if (legendEntry.featureIdx === item.requester.featureIdx &&
                            legendEntry.name === item.requester.name) {
                            // watch for a visibility change. We need to do this because requester does not have this value. It is only
                            // there for first level (layerRec). For sub layer, we need to find the right info by walking the legend entry
                            // and apply a watch (fgpv-vpgf#1171)
                            $scope.$watch(() => legendEntry.options.visibility.value, (value) => {
                                self.selectedItem.requester.visible = value;
                            });
                        }
                    });
                }
            }
        }

        $scope.$watch('self.display.data', newValue => {
            focusService.setFocusElement($element.find('.rv-content-pane button[aria-label="Close"]'));
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
