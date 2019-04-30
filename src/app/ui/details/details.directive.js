const templateUrl = require('./details.html');

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
    .module('app.ui')
    .directive('rvDetails', rvDetails);

function rvDetails() {
    const directive = {
        restrict: 'E',
        templateUrl,
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
     * Find and return a details item whose proxy object matches the proxy of the previously selected item.
     *
     * @private
     * @function  findPreviouslySelected
     * @param {Object} items data objects array
     * @return {Object}      selected item in details panel
     */
    function findPreviouslySelected(items) {
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
        if (self.selectedItem === item) {
            // re-highlight features in this item
            // the previous highlight might have been cancelled by panning, and the user can re-highlihght feature by clicking on the selected layer again
            $scope.$broadcast(events.rvHighlightDetailsItem, item);

            // this item is already selected; exiting;
            return;
        }

        if (item) {
            detailService.mApi.panels.details.header.title = item.requester.proxy.name;
        }
        self.selectedItem = item;
        self.selectedLayerProxy = item ? item.requester.proxy : null;

        self.display.selectedItem = self.selectedItem;
    }

    let deRegisterFirstResultWatch = angular.noop;

    $scope.$watch('self.display.data', (newValue, oldValue) => {
        deRegisterFirstResultWatch();

        // if multiple points added to the details panel ...
        if (newValue && newValue.length > 0) {

            if (newValue.length > 1) {
                detailService.mApi.panels.details.header._header.addClass('rv-has-layer-list');
            } else {
                detailService.mApi.panels.details.header._header.removeClass('rv-has-layer-list');
            }

            const previouslySelected = findPreviouslySelected(newValue);
            if (previouslySelected) {
                // pick selected item user previously selected one,
                selectItem(previouslySelected);
            } else if (newValue.length === 1) {
                // or if there is a single item, pick that
                selectItem(newValue[0]);
            } else {
                // otherwise, wait for the first item to get results and select that
                deRegisterFirstResultWatch = $scope.$watch(_waitForFirstResult, status => {
                    if (status.firstResult) {
                        deRegisterFirstResultWatch();
                        // if the user alreayd selected an item, do not override the selection
                        if (!self.selectedItem) {
                            selectItem(status.firstResult);
                        }

                    } else if (!status.panelLoading) {
                        // all searches found nothing
                        detailService.mApi.panels.details.header.title = 'details.label.noresult';
                        deRegisterFirstResultWatch();
                    }
                });
            }

            detailService.mApi.panels.details.open();
            detailService.mApi.panels.details.header.title = self.display.selectedItem ? self.display.selectedItem.requester.proxy.name : (self.display.isLoading ? 'details.label.searching' : 'details.label.noresult');

            // wrap symbology returned by the proxy into a symbology stack object
            newValue.forEach(item =>
                (item.requester.symbologyStack = new SymbologyStack(item.requester.proxy)));

        } else if (oldValue) {
            selectItem(null);
        }

        /**
         * Checks if at least one fo the item received results, or if no results at all.
         *
         * @function _waitForFirstResult
         * @private
         * @return {Object} data for a first item that has completed loading, and the status of the entire query
         */
        function _waitForFirstResult() {
            return {
                firstResult: self.display.data.find(item => item.data.length > 0),
                panelLoading: self.display.isLoading
            };
        }
    });
}
