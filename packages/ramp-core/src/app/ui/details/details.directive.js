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
angular.module('app.ui').directive('rvDetails', rvDetails);

function rvDetails() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true,
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

    self.getSectionNode = () => $element.find('.rv-details');

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
        return items.find((item) => item.requester.proxy === self.selectedLayerProxy);
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

    let deregisterFirstResultWatch = angular.noop;

    $scope.$watch('self.display.data', (newValue, oldValue) => {
        deregisterFirstResultWatch();

        // if multiple points added to the details panel ...
        if (newValue && newValue.length > 0) {
            if (newValue.length > 1) {
                detailService.mApi.panels.details.header._header.addClass('rv-has-layer-list');
            } else {
                detailService.mApi.panels.details.header._header.removeClass('rv-has-layer-list');
            }

            const previouslySelected = findPreviouslySelected(newValue);
            if (newValue.length === 1) {
                // if there is a single item, pick that
                selectItem(newValue[0]);
            } else {
                // If a layer was previously selected, wait to see if a result comes back from that layer. If no layer
                // was selected previously, wait for the first result to come back.
                deregisterFirstResultWatch = $scope.$watch(
                    () => {
                        return previouslySelected
                            ? _waitForFirstResult(previouslySelected.layerId)
                            : _waitForFirstResult();
                    },
                    (result) => {
                        // check if the result returned is an object and a successfully detected first data point
                        if (typeof result === 'object' && result) {
                            selectItem(result);
                            deregisterFirstResultWatch();
                            // otherwise the return result represents the loading status and if loading is done and all searches found nothing, no valid data point was clicked
                        } else if (typeof result === 'boolean' && !result) {
                            // If a previous layer was selected and no results came back, see if any results
                            // came back at all. If so, select that layer instead.
                            if (previouslySelected) {
                                result = _waitForFirstResult();
                                if (typeof result === 'object' && result) {
                                    selectItem(result);
                                }
                            } else {
                                detailService.mApi.panels.details.header.title = 'details.label.noresult';
                                selectItem(null);
                                deregisterFirstResultWatch();
                            }
                        }
                    }
                );
            }

            detailService.mApi.panels.details.open();
            detailService.mApi.panels.details.header.title = self.display.selectedItem
                ? self.display.selectedItem.requester.proxy.name
                : self.display.isLoading
                ? 'details.label.searching'
                : 'details.label.noresult';

            // wrap symbology returned by the proxy into a symbology stack object
            newValue.forEach((item) => (item.requester.symbologyStack = new SymbologyStack(item.requester.proxy)));
        } else if (oldValue) {
            selectItem(null);
        }

        /**
         * Checks if at least one of the item received results, or if no results at all.
         *
         * @function _waitForFirstResult
         * @private
         * @param  {Object} layer a specific layer to wait for data from
         * @return {Object | Boolean} data for a first item that has completed loading, OR the loading status of the entire query
         */
        function _waitForFirstResult(layer) {
            let searchFirstResult;

            // If a layer is provided as a parameter, look for a result from that specific layer.
            if (layer) {
                searchFirstResult = self.display.data.find((item) => item.layerId === layer && item.data.length > 0);
            } else {
                searchFirstResult = self.display.data.find((item) => item.data.length > 0);
            }

            const isLoading = self.display.isLoading;
            // return an object representing the first data point clicked if found, otherwise return a boolean representing if loading is done
            // reason for this is that angular executes this function being watched until it returns the same result twice, compared using ===
            // in the previous case this would never hold true since we return a new object everytime, resulting in multiple watchers fired and the $digest() iterations error
            return searchFirstResult ? searchFirstResult : isLoading;
        }
    });
}
