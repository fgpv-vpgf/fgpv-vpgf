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
        .directive('rvDetailSlider', rvDetailSlider);

    function rvDetailSlider() {
        const directive = {
            restrict: 'A',
            link
        };

        return directive;

        /*********/

        function link(scope, element) {
            const self = scope.self;
            let sectionNode;
            let layerListNode;

            console.debug(element);
            // create animation timeline
            const tl = new TimelineLite({
                paused: true
            });

            self.onEnter = onEnter;
            self.onLeave = onLeave;

            $(element).hoverIntent({
                over: onEnter,
                out: onLeave,
                interval: 200
            });

            let isOpenState = false; // track if side panel is open/closed
            function onEnter() {
                if (!isOpenState) {
                    // find layer node and construct timeline
                    layerListNode = element.find(RV_DETAILS_LIST);
                    sectionNode = element.find(RV_DETAILS_SECTION);

                    tl.clear()
                        .to(element, RV_SLIDE_DURATION, {
                            width: 280,
                            ease: RV_SWIFT_IN_OUT_EASE
                        })

                        // This will explicitly "animate" the overflow property from hidden to auto and not try to figure
                        // out what it was initially on the reverse run.
                        .fromTo(element, 0.01, {
                            'overflow-y': 'hidden'
                        }, {
                            'overflow-y': 'auto'
                        }, RV_SLIDE_DURATION / 2);

                    isOpenState = true;
                    tl.play(0, false);
                }
            }

            function onLeave() {
                if (isOpenState) {
                    tl.reverse(0, false);
                    isOpenState = false;
                }
            }
        }
    }
})();
