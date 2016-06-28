/* global TimelineLite, Ease, BezierEasing */

(() => {
    'use strict';

    const RV_SYMBOLOGY_ITEM_CLASS = '.rv-symbology-item';
    const RV_SYMBOLOGY_ITEM_NAME_CLASS = '.rv-symbology-label';
    const RV_SYMBOLOGY_ITEM_TRIGGER = '.rv-symbology-trigger';

    const RV_DURATION = 0.3;
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));

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
        .directive('rvTocEntrySymbology', rvLayerItemSymbology);

    function rvLayerItemSymbology($q, Geo) {
        const directive = {
            require: '^?rvTocEntry', // need access to layerItem to get its element reference
            restrict: 'E',
            templateUrl: 'app/ui/toc/templates/entry-symbology.html',
            scope: {
                symbology: '=',
                type: '=?'
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /*********/

        function link(scope, element, attr, ctrl) {
            const self = scope.self;

            self.expanded = false; // holds the state of symbology section
            self.toggleSymbology = toggleSymbology;
            self.wiggleSymbology = wiggleSymbology;
            self.isInteractive = ctrl ? true : false;

            // TODO: remove temp var to randomize images loaded
            self.random = Math.random();

            let initializePromise;

            let tlshift; // expand/collapse animation timeline
            let tlwiggle; // wiggle animation timeline

            // store reference to symbology nodes
            // the following are normal arrays of jQuery items, NOT jQuery pseudo-arrays
            let symbologyItems;
            let trigger; // expand trigger node

            function toggleSymbology() {
                // when invoked for the first time, find elements and construct a timeline
                initializeTimelines()
                    .then(() => {
                        // expand symbology items and reverse wiggle
                        if (!self.expanded) {
                            self.expanded = true;
                            tlshift.play();
                            tlwiggle.reverse();
                        } else { // collapse symbology items and forward play wiggle
                            tlshift.reverse();
                            tlwiggle.play();
                        }
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

                // TODO: container width will depend on app mode: desktop or mobile; need a way to determine this
                const containerWidth = 350;
                let maxItemWidth;

                if (initializePromise) {
                    return initializePromise;
                }

                initializePromise = $q(fulfill => {

                    const canvas = document.createElement('canvas');

                    // find all symbology items and their parts
                    symbologyItems = element.find(RV_SYMBOLOGY_ITEM_CLASS)
                        .toArray()
                        .map(domNode => {
                            domNode = angular.element(domNode);

                            return {
                                container: domNode,
                                image: domNode.find('img'),
                                label: domNode.find(RV_SYMBOLOGY_ITEM_NAME_CLASS),
                            };
                        });

                    trigger = element.find(RV_SYMBOLOGY_ITEM_TRIGGER);

                    // calculate maximum with of a symbology item based on image, label size and the main panel width
                    // symbology item cannot be wider than the panel
                    maxItemWidth = Math.min(
                        Math.max(
                            ...symbologyItems.map(symbologyItem =>
                                Math.max(
                                    symbologyItem.image[0].naturalWidth,
                                    getTextWidth(canvas, symbologyItem.label.text(), 'normal 14pt Roboto') + 32 // account for padding
                                ))),
                        containerWidth
                    );

                    // set label width to maximum which was calculated
                    symbologyItems.forEach(symbologyItem =>
                        symbologyItem.label.css('width', maxItemWidth));

                    console.log('maxItemWidth', maxItemWidth);

                    makeShiftTimeline();
                    makeWiggleTimeline();

                    fulfill();
                });

                return initializePromise;

                function makeShiftTimeline() {
                    tlshift = new TimelineLite({
                        paused: true,
                        onReverseComplete: () =>
                            $q.resolve()
                            .then(() => self.expanded = false)
                    });

                    // in pixels
                    const symbologyListTopOffset = 48; // offset to cover the height of the legend entry nod
                    const symbologyListMargin = 16; // gap between the legend endtry and the symbology stack

                    // keep track of the total height of symbology stack so far
                    let totalHeight = symbologyListTopOffset + symbologyListMargin;

                    // future-proofing - in case we need different behaviours for other legend types
                    const legendItemTLgenerator = {
                        [Geo.Layer.Types.OGC_WMS]: imageLegendItem,
                        [Geo.Layer.Types.ESRI_TILE]: iconLegendItem,
                        [Geo.Layer.Types.ESRI_IMAGE]: iconLegendItem,
                        [Geo.Layer.Types.ESRI_FEATURE]: iconLegendItem,
                        [Geo.Layer.Types.ESRI_DYNAMIC]: iconLegendItem,
                        esriDynamicLayerEntry: iconLegendItem
                    };

                    // loop over symbologyItems, generate timeline for each one, increase total height
                    symbologyItems.reverse().forEach((symbologyItem, index) =>
                        totalHeight += legendItemTLgenerator[self.type](tlshift, symbologyItem, totalHeight,
                            index === symbologyItems.length - 1));

                    totalHeight += symbologyListMargin; // add marging at the bottom of the list

                    // expand layer item container (ctrl.element) to accomodate symbology list
                    tlshift.to(ctrl.element, RV_DURATION, {
                        marginBottom: totalHeight - symbologyListTopOffset,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);

                    // show the trigger button
                    tlshift.to(trigger, RV_DURATION - 0.1, {
                        opacity: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0.1);
                }

                function makeWiggleTimeline() {
                    // we only need one timeline since we can reuse it
                    tlwiggle = new TimelineLite({
                        paused: true
                    });

                    const displacement = 4;

                    // if there is just one icon, don't do on-hover animation
                    if (symbologyItems.length > 1) {
                        // wiggle the first icon in the stack
                        tlwiggle.to(symbologyItems[0].container, RV_DURATION, {
                            x: `-=${displacement}px`,
                            y: `-=${displacement}px`,
                            ease: RV_SWIFT_IN_OUT_EASE
                        }, 0);

                        // wiggle the last icon in the stack
                        tlwiggle.to(symbologyItems.slice(-1)
                            .pop()
                            .container, RV_DURATION, {
                                x: `+=${displacement}px`,
                                y: `+=${displacement}px`,
                                ease: RV_SWIFT_IN_OUT_EASE
                            }, 0);
                    }
                }

                /**
                 * Creates timeline for a supplied image-based symbologyItem (for wms legends for example)
                 * @param  {Object}  tlshift       timeline object
                 * @param  {Object}  symbologyItem symbology object with references to its parts
                 * @param  {Number}  totalHeight   height of the legend stack so far
                 * @param  {Boolean} isLast        flag indicating this is the last item in the stack
                 * @return {Nimber}                height of this symbology item plus its bottom margin is applicable
                 */
                function imageLegendItem(tlshift, symbologyItem, totalHeight, isLast) {
                    const symbologyListItemMargin = 16;

                    const imageWidth = symbologyItem.image[0].naturalWidth;
                    const imageHeight = symbologyItem.image[0].naturalHeight;

                    const labelHeight = symbologyItem.label.outerHeight();

                    // calculate symbology item's dimensions based on max width
                    const itemWidth = Math.min(maxItemWidth, imageWidth);
                    const itemHeight = itemWidth / imageWidth * imageHeight;

                    // animate symbology container's size
                    // note that animate starts at `RV_DURATION / 3 * 2` giving the items time to move down from the stack
                    // so they don't overlay legend entry
                    tlshift.to(symbologyItem.container, RV_DURATION / 3 * 2, {
                        width: maxItemWidth,
                        height: itemHeight + labelHeight,
                        left: 0,
                        autoAlpha: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3);

                    // move item down
                    tlshift.to(symbologyItem.container, RV_DURATION, {
                        top: totalHeight,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);

                    // animate image width to the calculated width
                    tlshift.to(symbologyItem.image, RV_DURATION / 3 * 2, {
                        width: itemWidth,
                        height: 'auto',
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3);

                    // set width to auto to keep the label centered during animation
                    tlshift.set(symbologyItem.label, {
                        display: 'block',
                        width: 'auto'
                    }, 0);

                    // animate symbology label into view
                    tlshift.to(symbologyItem.label, RV_DURATION / 3, {
                        opacity: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3 * 2);

                    return itemHeight + labelHeight + (isLast ? 0 : symbologyListItemMargin);
                }

                /**
                 * Creates timeline for a supplied icon-based symbologyItem (for feature and dynamic legends for example)
                 * @param  {Object}  tlshift       timeline object
                 * @param  {Object}  symbologyItem symbology object with references to its parts
                 * @param  {Number}  totalHeight   height of the legend stack so far
                 * @param  {Boolean} isLast        flag indicating this is the last item in the stack
                 * @return {Nimber}                height of this symbology item plus its bottom margin is applicable
                 */
                function iconLegendItem(tlshift, symbologyItem, totalHeight, isLast) {
                    const symbologyListItemMargin = 8;

                    const itemSize = 32; // icon size is fixed

                    // expand symbology container width and align it to the left (first and last items are fanned out)
                    tlshift.to(symbologyItem.container, RV_DURATION / 3 * 2, {
                        width: containerWidth,
                        left: 0,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3);

                    // shift the symbology item down to the bottom of the stack using the total height
                    tlshift.to(symbologyItem.container, RV_DURATION, {
                        top: totalHeight,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);

                    // by default, items 3 to n-1 are hidden (their shadows stack otherwise)
                    // animate them back into view
                    tlshift.to(symbologyItem.container, RV_DURATION / 3, {
                        autoAlpha: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, 0);

                    // animate image width to the calculated width
                    tlshift.to(symbologyItem.image, RV_DURATION / 3 * 2, {
                        width: itemSize,
                        height: itemSize,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3);

                    // set label to `block` so it is properly positioned
                    tlshift.set(symbologyItem.label, {
                        display: 'block'
                    }, RV_DURATION / 3);

                    // animate symbology label into view
                    tlshift.to(symbologyItem.label, RV_DURATION / 3 * 2, {
                        opacity: 1,
                        ease: RV_SWIFT_IN_OUT_EASE
                    }, RV_DURATION / 3);

                    return itemSize + (isLast ? 0 : symbologyListItemMargin);
                }

                /**
                 * Returns width of the supplied text string.
                 * @param  {Object} canvas cached canvas node
                 * @param  {String} text   string of text to measure
                 * @param  {String} font   text font and size
                 * @return {Number}        width of the text
                 */
                function getTextWidth(canvas, text, font) {
                    const context = canvas.getContext('2d');
                    context.font = font;
                    const metrics = context.measureText(text);
                    return metrics.width;
                }
            }
        }
    }
})();
