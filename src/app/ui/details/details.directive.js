/* global Ease, BezierEasing, TweenLite, HolderIpsum */
(() => {
    'use strict';

    const RV_SLIDE_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

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

            //element.on('.rv-details-layer-list', 'click', onEnter);
            //element.on('.rv-details-layer-list', 'onmouseleave', onLeave);

            self.onEnter = onEnter;
            self.onLeave = onLeave;

            function onEnter() {
                if (!layerList) {
                    // find layer node and construct timeline
                    layerList = element.find('.rv-details-layer-list');
                    section = element.find('.rv-details');

                    tl.to(layerList, RV_SLIDE_DURATION, {
                            width: 280,
                            ease: RV_SWIFT_IN_OUT_EASE
                        })
                        .to(section, RV_SLIDE_DURATION, {
                            className: '+=rv-expanded'
                        }, 0);
                }

                console.log('hover');
                tl.play();
            }

            function onLeave() {
                tl.reverse()
            }

        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.closeDetails = closeDetails;

        self.selectLayer = selectLayer;

        self.data = {
            layers: [
                {
                    name: HolderIpsum.words(3, true),
                    type: 'something',
                    items: [
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence(), HolderIpsum.sentence(),
                                HolderIpsum.sentence()]
                        },
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence()]
                        }
                    ]
                },
                {
                    name: HolderIpsum.words(3, true),
                    type: 'something',
                    items: [
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence()]
                        }
                    ]
                },
                {
                    name: HolderIpsum.words(3, true),
                    type: 'something',
                    items: [
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence()]
                        }
                    ]
                }
            ]
        };

        activate();

        ///////////

        function activate() {
            self.selected = self.data.layers[0];
        }

        function closeDetails() {
            stateManager.set({
                side: false
            }, 'mainToc');
        }

        function selectLayer(layer) {
            self.selected = layer;

            self.onLeave();
        }
    }
})();
