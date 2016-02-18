/* global TimelineLite, Ease, BezierEasing */

(() => {
    'use strict';

    const RV_SYMBOLOGY_ITEM_CLASS = '.rv-symbology-item';
    const RV_SYMBOLOGY_ITEM_NAME_CLASS = '.rv-symbology-item-name';

    const RV_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    const RV_ROTATE_ANGLE = 8;

    /**
     * @ngdoc directive
     * @name rvLayerItemSymbology
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerItemSymbology` directive generates a symbology list and toggles its visibility. It also wiggles the stacked symbology icons on mouse over and focus.
     *
     * ```html
     * <rv-layer-item-symbology symbology="layer.symbology"></rv-layer-item-symbology>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItemSymbology', rvLayerItemSymbology);

    function rvLayerItemSymbology($q) {
        const directive = {
            require: '^rvLayerItem', // need access to layerItem to get its element reference
            restrict: 'E',
            templateUrl: 'app/ui/toc/layer-item-symbology.html',
            scope: {
                symbology: '='
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link(scope, element, attr, ctrl) {
            const self = scope.self;

            self.expanded = false; // holds the state of symbology section
            self.toggleSymbology = toggleSymbology;
            self.wiggleSymbology = wiggleSymbology;

            // TODO: remove temp var to randomize images loaded
            self.random = Math.random();

            let initializePromise;

            let tlshift; // expand/collapse animation timeline
            let tlwiggle; // wiggle animation timeline

            // store reference to symbology nodes
            // the following are normal arrays of jQuery items, NOT jQuery pseudo-arrays
            let items; // symbology items (icon and name)
            let icons; // just the icon from the item
            let names; // just then name

            function toggleSymbology() {
                // when invoked for the first time, find elements and construct a timeline
                initializeTimelines()
                    .then(() => {
                        // expand symbology items and reverse wiggle
                        if (!self.expanded) {
                            tlshift.play();
                            tlwiggle.reverse();
                        } else { // collapse symbology items and forward play wiggle
                            tlshift.reverse();
                            tlwiggle.play();
                        }

                        self.expanded = !self.expanded;
                    });
            }

            function wiggleSymbology(isOver) {
                // when invoked for the first time, find elements and construct a timeline
                initializeTimelines()
                    .then(() => {
                        if (isOver) {
                            // on mouse over, wiggle only if symbology is not expanded or animating
                            if (!self.expanded && !tlshift.isActive()) {
                                tlwiggle.play();
                            }
                        } else {
                            // on mouse out, set wiggle timeline to 0 if symbology is expanded or animating
                            if (tlshift.isActive() || self.expanded) {
                                tlwiggle.pause(0);
                            } else if (!self.expanded && !tlshift.isActive()) { // ... reverse wiggle, if symbology is collapsed and not animating
                                tlwiggle.reverse();
                            }
                        }
                    });
            }

            // find and store references to relevant nodes
            function initializeTimelines() {

                if (initializePromise) {
                    return initializePromise;
                }

                initializePromise = $q(fulfill => {
                    items = element.find(RV_SYMBOLOGY_ITEM_CLASS)
                        .toArray()
                        .map(item => $(item));
                    icons = items.map(item => $(item)
                        .find('> img'));
                    names = element.find(RV_SYMBOLOGY_ITEM_NAME_CLASS)
                        .toArray()
                        .map(name => $(name));

                    makeShiftTimeline();
                    makeWiggleTimeline();

                    fulfill();
                });

                return initializePromise;

                function makeShiftTimeline() {
                    tlshift = new TimelineLite({
                        paused: true
                    });

                    // in pixels
                    const symbologyListTopOffset = 45;
                    const symbologyListTopMargin = 8;
                    const symbologyListBottomMargin = 15;
                    const symbologyItemHeight = 36;

                    // move all the symbology items from stack into list
                    // TODO: I think hardcoding '300px' has something to do with https://github.com/fgpv-vpgf/fgpv-vpgf/issues/262
                    items.forEach(img => tlshift.set(img, {
                        width: '300px'
                    }, 0));
                    items.forEach((img, index) => tlshift.to(img, RV_DURATION, {
                        left: 0,
                        top: (symbologyListTopOffset + index * symbologyItemHeight) +
                            'px',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0));

                    // make symbology names visible
                    names.forEach(name => tlshift.to(name, RV_DURATION - 0.1, {
                        autoAlpha: 1, // https://greensock.com/docs/#/HTML5/GSAP/Plugins/CSSPlugin/
                        display: 'block',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0.1));

                    // expand layer item container (ctrl.element) to accomodate symbology list
                    tlshift.to(ctrl.element, RV_DURATION, {
                        height: symbologyListTopOffset +
                            symbologyListTopMargin +
                            items.length *
                            symbologyItemHeight +
                            symbologyListBottomMargin,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);
                }

                function makeWiggleTimeline() {
                    // we only need one timeline since we can reuse it
                    tlwiggle = new TimelineLite({
                        paused: true
                    });

                    // wiggle the first icon in the stack
                    tlwiggle.to(icons[0], RV_DURATION, {
                        rotation: -RV_ROTATE_ANGLE,
                        transformOrigin: '0% 100%',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);

                    // wiggle the last icon in the stack
                    tlwiggle.to(icons.slice(-1).pop(), RV_DURATION, {
                            rotation: RV_ROTATE_ANGLE,
                            transformOrigin: '0% 100%',
                            ease: RV_SWIFT_IN_OUT_EASE
                        }, 0);
                }
            }
        }
    }
})();
