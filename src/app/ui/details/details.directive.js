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

        ///////////

        function link(scope, element) { //scope, element, attr, ctrl) {
            const self = scope.self;
            let section;
            let layerList;

            const tl = new TimelineLite({
                paused: true
            });

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

    function Controller(stateManager, $scope) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;

        self.selectLayer = selectLayer;

        self.data = stateManager._detailsData; // garbage data

        // TODO: adding stateManger to scope to set up watch
        // TODO: remove;
        $scope.stateManager = stateManager;
        $scope.$watch('stateManager._detailsData.layers', newValue => {
            console.log('stateManager._detailsData.layers', newValue);
            if (newValue.length > 0) {
                // pick random point to be selected initially
                self.selected = newValue[Math.floor(Math.random() * newValue.length)];
            }
        });

        activate();

        ///////////

        function activate() {

        }

        /**
         * Closes details pane and switches to toc.
         */
        function closeDetails() {
            stateManager.setActive({
                side: false
            }, 'mainDetails');

            // TODO: remove; temporary;
            stateManager._detailsData.layers = [];
        }

        /**
         * Changes the layer whose data is displayed.
         * @param  {Object} layer data object
         */
        function selectLayer(layer) {
            self.selected = layer;

            self.onLeave();
        }
    }
})();
