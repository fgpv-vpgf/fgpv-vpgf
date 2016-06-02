/* global Ease, BezierEasing, TimelineLite */
(() => {
    'use strict';

    const RV_SLIDE_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));
    const RV_DETAILS_LIST = '.rv-details-layer-list';
    const RV_DETAILS_SECTION = '.rv-details';

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
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link(scope, element) { // scope, element, attr, ctrl) {
            const self = scope.self;
            let sectionNode;
            let layerListNode;

            // create animation timeline
            const tl = new TimelineLite({
                paused: true
            });

            // expand and collapse item selector list when multiple items are displayed
            self.onEnter = onEnter;
            self.onLeave = onLeave;

            function onEnter($event) {
                if (!layerListNode || layerListNode[0] !== $event.currentTarget) {
                    // find layer node and construct timeline
                    layerListNode = element.find(RV_DETAILS_LIST);
                    sectionNode = element.find(RV_DETAILS_SECTION);

                    tl.clear()
                        .to(layerListNode, RV_SLIDE_DURATION, {
                            width: 280,
                            ease: RV_SWIFT_IN_OUT_EASE
                        })

                        // This will explicitly "animate" the overflow property from hidden to auto and not try to figure
                        // out what it was initially on the reverse run.
                        .fromTo(layerListNode, 0.01, {
                            'overflow-y': 'hidden'
                        }, {
                            'overflow-y': 'auto'
                        }, RV_SLIDE_DURATION / 2)
                        .to(sectionNode, RV_SLIDE_DURATION, {
                            className: '+=rv-expanded'
                        }, 0);
                }

                tl.play();
            }

            function onLeave() {
                tl.reverse();
            }

        }
    }

    // COMMENT to self: brief flickering of fake content is caused by immediately setting data and isLoading flag;
    // in a real case, we wait for 100ms to get data, and then set isLoading which;

    function Controller(stateManager, $scope) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;
        self.selectItem = selectItem;

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
            let selectedItem = items[0];
            items.forEach((item) => {
                if (`${item.requester.caption}${item.requester.name}` === self.selectedInfo) {
                    selectedItem = item;
                }
            });

            return selectedItem;
        }

        /**
         * Closes loader pane and switches to the previous pane if any.
         */
        function closeDetails() {
            stateManager
                .openPrevious('mainDetails')
                .then(() => stateManager.clearDisplayPanel('mainDetails')); // clear `details` display;
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
