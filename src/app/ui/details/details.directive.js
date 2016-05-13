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
            let section;
            let layerList;

            // create animation timeline
            const tl = new TimelineLite({
                paused: true
            });

            // expand and collapse item selector list when multiple items are displayed
            self.onEnter = onEnter;
            self.onLeave = onLeave;

            function onEnter() {
                if (!layerList) {
                    // find layer node and construct timeline
                    layerList = element.find(RV_DETAILS_LIST);
                    section = element.find(RV_DETAILS_SECTION);

                    tl.to(layerList, RV_SLIDE_DURATION, {
                            width: 280,
                            ease: RV_SWIFT_IN_OUT_EASE
                        })

                        // This will explicitly "animate" the overflow property from hidden to auto and not try to figure
                        // out what it was initially on the reverse run.
                        .fromTo(layerList, 0.01, {
                            'overflow-y': 'hidden'
                        }, {
                            'overflow-y': 'auto'
                        }, RV_SLIDE_DURATION / 2)
                        .to(section, RV_SLIDE_DURATION, {
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
            // console.log('self.display.data', newValue);
            // if multiple points added to the details panel ...
            if (newValue && newValue.length > 0) {
                // pick first point to be selected initially
                self.selectedItem = newValue[0];
            } else {
                self.selectedItem = null;
            }
        });

        activate();

        /*********/

        function activate() {

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

            self.onLeave();
        }
    }
})();
