/* global TimelineLite, Ease, BezierEasing */

(() => {
    'use strict';

    const RV_SYMBOLOGY_ITEM_CLASS = '.rv-symbology-item';
    const RV_SYMBOLOGY_ITEM_NAME_CLASS = '.rv-symbology-item-name';

    const RV_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

    /**
     * @ngdoc directive
     * @name rvLayerItemSymbology
     * @module app.ui.toc
     * @restrict E
     * @description
     *
     * The `rvLayerItemSymbology` directive generates a symbology list and toggles its visibility.
     *
     * ```html
     * <rv-layer-item-symbology symbology="layer.symbology"></rv-layer-item-symbology>
     * ```
     *
     */
    angular
        .module('app.ui.toc')
        .directive('rvLayerItemSymbology', rvLayerItemSymbology);

    function rvLayerItemSymbology() {
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

            // TODO: remove temp var to randomize images loaded
            self.random = Math.random();

            // store reference to symbology nodes
            let imgs = [];
            let names = [];
            let container = {};

            // we only need one timeline since we can reuse it
            let tl = new TimelineLite({
                paused: true
            });

            function toggleSymbology() {
                // when invoked for the first time, find elements and construct a timeline
                if (imgs.length === 0) {
                    findItems();

                    // in pixels
                    let symbologyListTopOffset = 45;
                    let symbologyListTopMargin = 8;
                    let symbologyListBottomMargin = 15;
                    let symbologyItemHeight = 36;

                    // move all the symbology items from stack into list
                    imgs.forEach(img => tl.set(img, {
                        width: '300px'
                    }, 0));
                    imgs.forEach((img, index) => tl.to(img, RV_DURATION, {
                        left: 0,
                        top: (symbologyListTopOffset + index * symbologyItemHeight) +
                            'px',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0));

                    // make symbology names visible
                    names.forEach(name => tl.to(name, RV_DURATION - 0.1, {
                        autoAlpha: 1, // https://greensock.com/docs/#/HTML5/GSAP/Plugins/CSSPlugin/
                        display:'block',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0.1));

                    // expand layer item container to accomodate symbology list
                    tl.to(container, RV_DURATION, {
                        height: symbologyListTopOffset +
                            symbologyListTopMargin +
                            imgs.length *
                            symbologyItemHeight +
                            symbologyListBottomMargin,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);
                }

                // play timeline
                if (!self.expanded) {
                    tl.play();
                } else {
                    tl.reverse();
                }

                self.expanded = !self.expanded;
            }

            // find and store references to relevant nodes
            function findItems() {
                imgs = element.find(RV_SYMBOLOGY_ITEM_CLASS)
                    .toArray();
                names = element.find(RV_SYMBOLOGY_ITEM_NAME_CLASS)
                    .toArray();
                container = ctrl.element; // container is needed for animation
            }
        }
    }
})();
