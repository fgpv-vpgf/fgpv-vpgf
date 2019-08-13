const templateUrl = require('./templates/symbology-stack.html');

const RV_SYMBOLOGY_ITEM_CLASS = '.rv-symbol';
const RV_SYMBOLOGY_ITEM_NAME_CLASS = '.rv-symbol-label';
const RV_COVER_ICON = '.rv-cover-icon';
const RV_SYMBOLOGY_ITEM_TRIGGER = '.rv-symbol-trigger';
const RV_DESCRIPTION_ITEM = '.rv-description-container';

const RV_DURATION = 0.3;
const RV_SWIFT_IN_OUT_EASE = window.Power1.easeInOut;

/**
 * An instance maintains the state of one toggle symbology checkox. This includes if its checked, and the query to use
 */
class ToggleSymbol {
    constructor(symbol) {
        this.isSelected = true;
        this.symbol = symbol;
    }

    click() {
        this.isSelected = !this.isSelected;
    }

    get icon() {
        return this.isSelected ? 'toggle:check_box' : 'toggle:check_box_outline_blank';
    }

    get query() {
        return this.isSelected ? this.symbol.definitionClause : null;
    }
}

/**
 * @module rvSymbologyStack
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSymbologyStack` directive generates a symbology list and toggles its visibility. It also wiggles the stacked symbology icons on mouse over and focus.
 *
 * ```html
 * <rv-layer-item-symbology symbology="layer.symbology" container="container"></rv-layer-item-symbology>
 * ```
 *
 */
/**
 * @module SymbologyStack
 * @memberof app.ui
 * @description
 *
 * `SymbologyStack` class provides a common wrapper around symbology list. This can be used in the details panel, in the legend, or other places where layer symbology need to be displayed.
 * There are two sources of symbology: service symbology and user defined symbology.
 *
 */
angular
    .module('app.ui')
    .directive('rvSymbologyStack', rvSymbologyStack)
    .factory('SymbologyStack', symbologyStack);

function rvSymbologyStack($rootScope, $q, Geo, animationService, layerRegistry, $timeout) {
    const directive = {
        require: '^?rvTocEntry', // need access to layerItem to get its element reference
        restrict: 'E',
        templateUrl,
        scope: {
            symbology: '=',
            block: '=',
            description: '=?',
            container: '=?'
        },
        link: link,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/
    // eslint-disable-next-line max-statements
    function link(scope, element) {
        const self = scope.self;
        // if render style is not specified, symbology stack will not be interactive
        // self.isInteractive = typeof self.symbology.renderStyle !== 'undefined';
        self.isExpanded = false; // holds the state of symbology section
        self.showSymbologyToggle = false;

        self.expandSymbology = expandSymbology;
        self.fanOutSymbology = fanOutSymbology;

        self.symbologyWidth = 32;

        self.stackToggled = false;

        // search for any existing legend group
        let groupExists = false;
        let cur = self.block;
        let numParents = 0;
        // this should find the parent group of the current entry, if any, and stop immediately
        while (cur && cur.parent && !groupExists) {
            if (cur.constructor.name === 'LegendGroup') {
                groupExists = true;
            } else {
                cur = cur.parent;
                numParents += 1;
            }
        }

        const canvas = document.createElement('canvas');

        // returns true if all toggle symbology checkboxes are checked, false otherwise
        function allSymbolsVisible() {
            const toggleListKeys = Object.keys(self.toggleList);

            return toggleListKeys.filter(key => self.toggleList[key].isSelected).length === toggleListKeys.length;
        }

        // returns true if no toggle symbology checkboxes are checked, false otherwise
        function noSymbolsVisible() {
            return Object.keys(self.toggleList).filter(key => self.toggleList[key].isSelected).length === 0;
        }

        // stores instances of ToggleSymbol as key value pairs (with symbol name as the key)
        self.toggleList = [];

        let layerRecord;

        // opening details panel creates a symbology stack, but we don't do symbology toggling there so ignore error
        try {
            layerRecord = layerRegistry.getLayerRecord(self.block.layerRecordId);
        } catch (e) {
            // do nothing
        }

        // Helper function: apply definition to filter system
        function applySymbolFilter(defClause) {
            // TODO need a test for proxyWrapper?  it might not be ready yet?  might need a watch on 'loaded' if not ready
            const fs = self.block.proxyWrapper.filterState;
            if (fs !== undefined) {
                // tile layers, image layers and wms layers will not have filter state defined
                fs.setSql(fs.coreFilterTypes.SYMBOL, defClause);
            }
        }

        // Helper function: update symbol toggles
        function updateToggles(val) {
            if (val) {
                const someOn = self.toggleList.some((toggle => toggle.wasSelected === true));
                self.toggleList.forEach(toggle => {
                    if ((toggle.wasSelected && toggle.isSelected === false) || !someOn) {
                        toggle.wasSelected = undefined;
                        self.onToggleClick(toggle, true);
                    }
                });
            } else {
                self.toggleList.forEach(toggle => {
                    if (toggle.isSelected !== false) {
                        toggle.wasSelected = true;
                        self.onToggleClick(toggle, false);
                    }
                });
            }
        }

        // wire up a listener on the visibility change of the legend block
        if (self.block && self.block.visibilityChanged) {
            // change all symbology stack to toggled/untoggled if top layer is visible/invisible
            // TODO update this code when issue 3152 is implemented
            self.block.visibilityChanged.subscribe(val => {
                // make sure this doesn't fire if an individual symbology being toggled triggered visibilityChanged
                // only toggle when toggling visibility on after all symbology have been turned off
                if (!self.stackToggled) {
                    const query = val ? '' : '1=2';
                    if (self.block.proxyWrapper.isActiveState) {
                        // layer is loaded, apply stuff now
                        // only update if currently selected...otherwise causes all sorts of race conditions
                        // TODO ensure this is race condition no longer exists in new filter structure
                        // TODO once things are working, move these two statements to a function and call in both locations.
                        applySymbolFilter(query);
                        updateToggles(val);
                    } else {
                        // layer not yet loaded, wait until it is then apply stuff
                        const proxyLoaded = $rootScope.$watch(() => self.block.proxyWrapper.state, (state, oldState) => {
                            // TODO if possible, link in to Geo.Layer.States and use the LOADED constant
                            if (state === 'rv-loaded') {
                                // only update if currently selected...otherwise causes all sorts of race conditions
                                // TODO ensure this is race condition no longer exists in new filter structure
                                applySymbolFilter(query);
                                updateToggles(val);
                                self.stackToggled = false;
                                proxyLoaded();
                            }
                        });
                    }
                }
                self.stackToggled = false;
            });
        }

        // triggerFilter is suppressed when toggles are being synchronized/initialized.  avoids sending off multiple filter updates
        self.onToggleClick = (toggle, triggerFilter = true) => {
            toggle.click();

            let defClause;

            if (allSymbolsVisible()) {
                // when all symbols are checked, clearing the query is the same as trying to match all of them
                defClause = '';
            } else if (noSymbolsVisible()) {
                // when no symbols are checked, make a query that is never true so no symbols are shown
                defClause = '1=2';
            } else {
                //otherwise proceed with joining geoApi definitionClauses
                defClause = self.toggleList
                    .map(toggle => toggle.query)
                    .filter(q => q !== null)
                    .join(' OR ');
            }

            if (triggerFilter) {
                applySymbolFilter(defClause);
                self.block._symbolVisibilityChanged.next();

                // Turn off layer if all symbols are unchecked
                let noSymb = noSymbolsVisible();
                if (noSymb) {
                    self.block.visibility = false;
                } else if (!noSymb && self.block.visibility === false) {
                    self.stackToggled = true;
                    self.block.visibility = true;
                    self.toggleList.forEach(toggle => {
                        toggle.wasSelected = undefined;
                    });
                }
            }

            // TODO this appears to handle a checkevent prior to layer loading, and will notify API observables that
            //      the symbol visibility changed after the layer loads
            //      confused why this only triggers if definition clause is undefined (now '');
            //      that would indiicate we only trigger symbolVisibilitychanged when all are set to visible.  i think
            //      we should be triggering visibility changes any time it changes.
            //      might also want to wrap this inside the triggerFilter, to avoid calling it when
            //      things are being setup.
            //      need to consult API people on how to best call _symbolVisibilityChanged.next();
            /*
            if (defClause === '') {
                if (self.block.validOIDs === undefined) {
                    const proxyLoaded = $rootScope.$watch(() => self.block.proxyWrapper.state, (state, oldState) => {
                        if (state === 'rv-loaded') {
                            self.block._symbolVisibilityChanged.next();
                            proxyLoaded();
                        }
                    });
                }
            }
            */
        };

        //wire in a hook to the SymbologyStack item!
        if (self.symbology) {
            self.symbology.toggleList = self.toggleList;
            self.symbology.onToggleClick = self.onToggleClick;
            self.symbology.allSymbolsVisible = allSymbolsVisible;
            self.symbology.noSymbolsVisible = noSymbolsVisible;
        }

        const ref = {
            isReady: false,

            isFannedOut: false,

            expandTimeline: null, // expand/collapse animation timeline
            fanOutTimeline: null, // wiggle animation timeline

            descriptionItem: null,

            // store reference to symbology nodes
            // the following are normal arrays of jQuery items, NOT jQuery pseudo-arrays
            symbolItems: [],
            // cover item stays with the stack when the rest of the stack is expanded
            coverSymbolItem: null,
            trigger: null, // expand self.trigger node

            // TODO: container width will depend on app mode: desktop or mobile; need a way to determine this
            containerWidth: 350,
            maxItemWidth: 350
        };

        scope.$watch(
            () => element.parent().width(),
            value => {
                if (value) {
                    ref.containerWidth = value;
                    updateContainerWidth(value);
                }
                scope.$applyAsync();
            }
        );

        scope.$watch('self.showSymbologyToggle', value => {
            if (value) {
                element
                    .find('.md-icon-button')
                    .addClass('show');
                $.link(element.find('.md-icon-button'));
                element
                    .find('button')
                    .not('.rv-symbol-trigger')
                    .removeAttr('nofocus')
                    .addClass('focusOnce');
            } else {
                element
                    .find('.md-icon-button')
                    .removeClass('show');
                element
                    .find('button')
                    .not('.rv-symbol-trigger')
                    .attr('nofocus', true)
                    .removeClass('focusOnce');
            }
        });

        // description persist, so need to store reference only once
        ref.descriptionItem = element.find(RV_DESCRIPTION_ITEM);
        ref.descriptionItem.css('width', ref.containerWidth);

        scope.$watchCollection('self.symbology.stack', (newStack, oldStack) => {
            if (newStack) {
                ref.isReady = false;

                // collapse the stack when underlying collection of the symbology changes as the expanded ui stack might initialy had a different number of items
                if (self.isExpanded) {
                    self.expandSymbology(false);
                }

                // A layer can have `toggleSymbology` set to false in the config, in which case we don't create checkboxes.
                // If a dynamic is a raster layer the symbology toggles do nothing so they should be disabled
                // TODO check if we need to add file-based stuff here
                if (
                    layerRecord &&
                    (layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC ||
                        layerRecord.layerType === Geo.Layer.Types.ESRI_FEATURE) &&
                    layerRecord.config.toggleSymbology &&
                    self.symbology.stack.length > 1 &&
                    self.symbology._proxy.layerType !== Geo.Layer.Types.ESRI_RASTER
                ) {
                    const stackConfig = self.block.blockConfig.symbologyStack;
                    const drawPromises = self.symbology.stack.map(s => s.drawPromise);

                    $q.all(drawPromises).then(() => {
                        // create a ToggleSymbol instance for each symbol
                        self.symbology.stack.forEach(s => {
                            // check legend config to see if the user has provided a definition clause
                            // user's definition clause takes priority over automatically generated one
                            const currIndex = self.symbology.stack.indexOf(s);
                            s.definitionClause =
                                stackConfig !== null && stackConfig[currIndex].sqlQuery !== undefined
                                    ? stackConfig[currIndex].sqlQuery
                                    : s.definitionClause;

                            if (s.definitionClause) {
                                // If the symbol doesn't have a query it shouldn't be a toggle symbol
                                const toggle = new ToggleSymbol(s);
                                s.toggle = toggle;
                                self.toggleList.push(toggle);

                                // toggle list gets generated each time block is reloaded, make sure check boxes and definition queries actually match the toggle list
                                self.toggleList.forEach(toggle => {
                                    if (toggle.isSelected !== self.block.visibility) {
                                        self.onToggleClick(toggle, false);
                                    }
                                });
                            }
                        });
                    });
                }
            }
        });

        // if there exists a legend group, watch for when the group gets expanded
        if (groupExists) {
            // for obtaining the link to the parent group block
            let parent = '.parent'.repeat(numParents);
            scope.$watch('self.block' + parent + '.expanded', (newValue, oldValue) => {
                // when parent group is expanded, expand symbology stack if needed
                if (newValue !== oldValue && newValue) {
                    // calling expandSymbology twice fixes some corner cases
                    $timeout(() => self.expandSymbology(self.symbology.expanded), 0);
                }
            });
        }

        scope.$watch('self.symbology.expanded', (newValue, oldValue) =>
            newValue !== oldValue ? self.expandSymbology(newValue) : angular.noop
        );

        scope.$watch('self.symbology.fannedOut', (newValue, oldValue) =>
            newValue !== oldValue ? self.fanOutSymbology(newValue) : angular.noop
        );

        // expand the symbology stack if needed
        if (!groupExists || cur.expanded) {
            $timeout(() => expandSymbology(self.symbology.expanded), 0);
        }

        return true;

        /**
         * Expands the symbology stack to show all its individual elements.
         *
         * @function expandSymbology
         * @private
         * @param {Boolean} value [optional = !self.isExpanded] true will expand the stack; false, collapse the stack;
         */
        function expandSymbology(value = !self.isExpanded) {
            // if symbology is non-interactive, don't do anything
            if (!self.symbology.isInteractive) {
                return;
            }

            //call to initializeTimelines() could make ref.isReady === true
            if (!ref.isReady) {
                initializeTimelines();
            }

            //only makes sense to expand or collapse symbology items if all references are ready
            if (ref.isReady) {
                if (value) {
                    // expand symbology items and reverse wiggle
                    ref.expandTimeline.play();
                    ref.fanOutTimeline.reverse();
                } else {
                    // collapse symbology items and forward play wiggle
                    ref.expandTimeline.reverse();
                    self.showSymbologyToggle = false;
                    ref.fanOutTimeline.play();
                }
                self.symbology.expanded = value;
            }
        }

        /**
         * Fans out the symbology stack; is used to indicate interactive nature of the symbology stack.
         *
         * @function fanOutSymbology
         * @private
         * @param {Boolean} value [optional = !ref.isFannedOut] true will fanOut the stack; false, close the fan;
         */
        function fanOutSymbology(value = !ref.isFannedOut) {
            // if symbology is non-interative, don't do anything
            if (!self.symbology.isInteractive) {
                return;
            }

            //call to initializeTimelines() could make ref.isReady === true
            if (!ref.isReady) {
                initializeTimelines();
            }

            if (ref.isReady) {
                // on mouse over, wiggle only if symbology is not expanded or animating
                if (value && !self.isExpanded && !ref.expandTimeline.isActive()) {
                    ref.fanOutTimeline.play();
                } else {
                    // on mouse out, set wiggle timeline to 0 if symbology is expanded or animating
                    if (ref.expandTimeline.isActive() || self.isExpanded) {
                        ref.fanOutTimeline.pause(0);
                    } else if (!self.isExpanded && !ref.expandTimeline.isActive()) {
                        // ... reverse wiggle, if symbology is collapsed and not animating
                        ref.fanOutTimeline.reverse();
                    }
                }

                self.symbology.fannedOut = value;
            }
        }

        // find and store references to relevant nodes
        function initializeTimelines() {
            if (!self.symbology.isInteractive) {
                return;
            }

            // find all symbology items and their parts including the cover symbol if it exists
            [ref.symbolItems, ref.coverSymbolItem] = element
                .find(RV_SYMBOLOGY_ITEM_CLASS)
                .toArray()
                .reduce(
                    ([symbols, coverSymbol], domNode) => {
                        domNode = angular.element(domNode);

                        const symbol = {
                            container: domNode,
                            image: domNode.find('rv-svg'),
                            label: domNode.find(RV_SYMBOLOGY_ITEM_NAME_CLASS)
                        };

                        // sort regular symbols from the cover symbol
                        return domNode.hasClass(RV_COVER_ICON.slice(1))
                            ? [symbols, symbol]
                            : [[...symbols, symbol], coverSymbol];
                    },
                    [[], null]
                );

            ref.trigger = element.find(RV_SYMBOLOGY_ITEM_TRIGGER);

            // calculate maximum width of a symbology item based on image, label size and the main panel width
            // symbology item cannot be wider than the panel
            ref.maxItemWidth = Math.min(
                Math.max(
                    ...ref.symbolItems.map(symbolItem => {
                        const svgImage = symbolItem.image.find('svg')[0];
                        const texLRPadding =
                            parseInt(symbolItem.label.css('padding-left').slice(0, -2)) +
                            parseInt(symbolItem.label.css('padding-right').slice(0, -2));
                        return Math.max(
                            svgImage ? svgImage.viewBox.baseVal.width : 0,
                            getTextWidth(canvas, symbolItem.label.text(), 'normal 14px Roboto') + texLRPadding
                        );
                    })
                ),
                ref.containerWidth - 28 // subtract symbol stack left offset
            );

            //permit ref to be ready only when all symbology images are properly loaded
            let isReady = ref.symbolItems.every(symbolItem => symbolItem.image.find('svg')[0] !== undefined);

            //only allow math for expanding/fanning out the stack when all images properly loaded
            //else causes negative margins and disappearing legend entries
            if (isReady) {
                ref.expandTimeline = makeExpandTimeline();
                ref.fanOutTimeline = makeWiggleTimeline();
                ref.isReady = ref.maxItemWidth > 0;
            }
        }

        function makeExpandTimeline() {
            const timeline = animationService.timeLineLite({
                paused: true,
                onStart: () => {
                    self.isExpanded = true;
                    scope.$digest();
                },
                onComplete: () => {
                    self.showSymbologyToggle = true;
                    updateContainerWidth(ref.containerWidth);
                    scope.$digest();
                },
                onReverseComplete: () => {
                    self.isExpanded = false;
                    self.symbologyWidth = 32;
                    scope.$digest();
                }
            });

            // in pixels
            const symbologyListTopOffset = 48; // offset to cover the height of the legend entry node
            const symbologyListMargin = 16; // gap between the legend endtry and the symbology stack

            // keep track of the total height of symbology stack so far
            let totalHeight = symbologyListTopOffset + symbologyListMargin;

            // optional description is displayed above the symbology items
            if (self.description !== '') {
                totalHeight -= symbologyListMargin / 2;

                // briefly show the description node to grab it's height, and hide it again
                ref.descriptionItem.show();
                let width = getTextWidth(canvas, ref.descriptionItem.text(), ref.descriptionItem.css('font'));
                let height =
                    Math.ceil(width / ref.descriptionItem.width()) *
                    parseInt(ref.descriptionItem.css('line-height').slice(0, -2));
                const descriptionHeight = ref.descriptionItem.height() > 0 ? ref.descriptionItem.height() : height;
                ref.descriptionItem.hide();

                // move the node into position unhiding it (it's still invisible beacuse opacity is 0)
                timeline.set(ref.descriptionItem, {
                    display: 'block',
                    top: totalHeight - 30
                });

                // show and animate description node
                timeline.to(
                    ref.descriptionItem,
                    (RV_DURATION / 3) * 2,
                    {
                        opacity: 1,
                        top: totalHeight,
                        ease: RV_SWIFT_IN_OUT_EASE
                    },
                    RV_DURATION / 3
                );

                // include the description height in the total height of the symbology stack
                totalHeight += descriptionHeight + symbologyListMargin;
            }

            // future-proofing - in case we need different behaviours for other legend types
            const legendItemTLgenerator = {
                images: imageLegendItem,
                icons: iconLegendItem
            };

            // loop over ref.symbolItems, generate timeline for each one, increase total height
            ref.symbolItems.forEach((symbolItem, index) => {
                const heightIncrease = legendItemTLgenerator[self.symbology.renderStyle](
                    timeline,
                    symbolItem,
                    totalHeight,
                    index === ref.symbolItems.length - 1
                );

                totalHeight += heightIncrease;
            });

            totalHeight += symbologyListMargin; // add margin at the bottom of the list

            // expand layer item container to accomodate symbology list
            // if no container specified, skip this part of animation; as a result, the expanded symbology stack may overflow its parent node
            if (self.container) {
                timeline.to(
                    self.container,
                    RV_DURATION,
                    {
                        marginBottom: totalHeight - symbologyListTopOffset,
                        ease: RV_SWIFT_IN_OUT_EASE
                    },
                    0
                );
            }

            // show the self.trigger button
            timeline.to(
                ref.trigger,
                RV_DURATION - 0.1,
                {
                    opacity: 1,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                0.1
            );

            return timeline;
        }

        function makeWiggleTimeline() {
            // we only need one timeline since we can reuse it
            const timeline = animationService.timeLineLite({
                paused: true,
                onStart: () => {
                    ref.isFannedOut = true;
                },
                onReverseComplete: () => {
                    ref.isFannedOut = false;
                }
            });

            // do not
            if (ref.coverSymbolItem) {
                timeline.to(
                    ref.coverSymbolItem.container,
                    RV_DURATION,
                    {
                        transform: 'scale(1.2, 1.2)',
                        ease: RV_SWIFT_IN_OUT_EASE
                    },
                    0
                );

                return timeline;
            } else {
                const displacement = 4;

                // if there is just one icon, don't do on-hover animation
                if (ref.symbolItems.length > 1) {
                    // wiggle the first icon in the stack
                    timeline.to(
                        ref.symbolItems[0].container,
                        RV_DURATION,
                        {
                            x: `-=${displacement}px`,
                            y: `-=${displacement}px`,
                            ease: RV_SWIFT_IN_OUT_EASE
                        },
                        0
                    );

                    // wiggle the last icon in the stack
                    timeline.to(
                        ref.symbolItems.slice(-1).pop().container,
                        RV_DURATION,
                        {
                            x: `+=${displacement}px`,
                            y: `+=${displacement}px`,
                            ease: RV_SWIFT_IN_OUT_EASE
                        },
                        0
                    );
                }

                return timeline;
            }
        }

        /**
         * Creates timeline for a supplied image-based symbolItem (for wms legends for example)
         * @function imageLegendItem
         * @param  {Object}  timeline       timeline object
         * @param  {Object}  symbolItem symbology object with references to its parts
         * @param  {Number}  totalHeight   height of the legend stack so far
         * @param  {Boolean} isLast        flag indicating this is the last item in the stack
         * @return {Number}                height of this symbology item plus its bottom margin is applicable
         */
        function imageLegendItem(timeline, symbolItem, totalHeight, isLast) {
            const symbologyListItemMargin = 16;
            const imageWidth = symbolItem.image.find('svg')[0].viewBox.baseVal.width;
            const imageHeight = symbolItem.image.find('svg')[0].viewBox.baseVal.height;

            // calculate symbology item's dimensions based on max width
            const itemWidth = Math.min(ref.maxItemWidth, imageWidth);
            const itemHeight = imageWidth !== 0 ? (itemWidth / imageWidth) * imageHeight : 0; // in cases when image urls are broken its size is 0

            // extremely convoluted math to calculate an aproximation of the label's height
            // can't just get outerHeight() since it returns strange values when the symbology stack isn't expanded
            let labelHeight = 0;
            let lineHeight = 0;
            let padding = 0;
            const textWidth = getTextWidth(canvas, symbolItem.label[0].innerText, symbolItem.label.css('font'));
            if (textWidth > 0) {
                lineHeight = parseInt(symbolItem.label.css('line-height').slice(0, -2));
                padding =
                    parseInt(symbolItem.label.css('padding-bottom').slice(0, -2)) +
                    parseInt(symbolItem.label.css('padding-top').slice(0, -2));
                const sidePadding =
                    parseInt(symbolItem.label.css('padding-left').slice(0, -2)) +
                    parseInt(symbolItem.label.css('padding-right').slice(0, -2));
                labelHeight =
                    Math.floor(textWidth / (0.9 * (ref.maxItemWidth - sidePadding)) + 1) * lineHeight + padding; // divide by 0.9 due to display rounding
            }

            // animate symbology container's size
            // note that animate starts at `RV_DURATION / 3 * 2` giving the items time to move down from the stack
            // so they don't overlay legend entry
            timeline.to(
                symbolItem.container,
                (RV_DURATION / 3) * 2,
                {
                    width: ref.maxItemWidth,
                    height: itemHeight + labelHeight,
                    left: 0,
                    autoAlpha: 1,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                RV_DURATION / 3
            );

            // move item down
            timeline.to(
                symbolItem.container,
                RV_DURATION,
                {
                    top: totalHeight,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                0
            );

            // animate image width to the calculated width
            timeline.to(
                symbolItem.image,
                (RV_DURATION / 3) * 2,
                {
                    width: itemWidth,
                    height: itemHeight,
                    padding: 0, // removes padding from expanded wms legend images making them clearer; TODO: revisit when all symbology is svg items
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                RV_DURATION / 3
            );

            // set width to auto to keep the label centered during animation
            timeline.set(
                symbolItem.label,
                {
                    display: 'block',
                    width: 'auto'
                },
                0
            );

            // animate symbology label into view
            timeline.to(
                symbolItem.label,
                RV_DURATION / 3,
                {
                    opacity: 1,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                (RV_DURATION / 3) * 2
            );

            return itemHeight + labelHeight + (isLast ? 0 : symbologyListItemMargin);
        }

        /**
         * Creates timeline for a supplied icon-based symbolItem (for feature and dynamic legends for example)
         * @function iconLegendItem
         * @param  {Object}  timeline       timeline object
         * @param  {Object}  symbolItem symbology object with references to its parts
         * @param  {Number}  totalHeight   height of the legend stack so far
         * @param  {Boolean} isLast        flag indicating this is the last item in the stack
         * @return {Number}                height of this symbology item plus its bottom margin is applicable
         */
        function iconLegendItem(timeline, symbolItem, totalHeight, isLast) {
            const symbologyListItemMargin = 8;

            const itemSize = 32; // icon size is fixed

            // expand symbology container width and align it to the left (first and last items are fanned out)
            timeline.to(
                symbolItem.container,
                (RV_DURATION / 3) * 2,
                {
                    width: ref.containerWidth,
                    left: 0,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                RV_DURATION / 3
            );

            // shift the symbology item down to the bottom of the stack using the total height
            timeline.to(
                symbolItem.container,
                RV_DURATION,
                {
                    top: totalHeight,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                0
            );

            // by default, items 3 to n-1 are hidden (their shadows stack otherwise)
            // animate them back into view
            timeline.to(
                symbolItem.container,
                RV_DURATION / 3,
                {
                    autoAlpha: 1,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                0
            );

            // animate image width to the calculated width
            timeline.to(
                symbolItem.image,
                (RV_DURATION / 3) * 2,
                {
                    width: itemSize,
                    height: itemSize,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                RV_DURATION / 3
            );

            // set label to `block` so it is properly positioned
            timeline.set(
                symbolItem.label,
                {
                    display: 'block'
                },
                RV_DURATION / 3
            );

            // animate symbology label into view
            timeline.to(
                symbolItem.label,
                (RV_DURATION / 3) * 2,
                {
                    opacity: 1,
                    ease: RV_SWIFT_IN_OUT_EASE
                },
                RV_DURATION / 3
            );

            return itemSize + (isLast ? 0 : symbologyListItemMargin);
        }

        /**
         * Returns width of the supplied text string.
         * @function getTextWidth
         * @param  {Object} canvas cached canvas node
         * @param  {String} text   string of text to measure
         * @param  {String} font   text font and size https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
         * @return {Number}        width of the text
         */
        function getTextWidth(canvas, text, font) {
            const context = canvas.getContext('2d');
            context.font = font;

            // measure text width on the canvas: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
            const metrics = context.measureText(text);
            return metrics.width;
        }

        /**
         * Updates container width to allign the symbology checkboxes
         * @function updateContainerWidth
         * @param {number} value
         */
        function updateContainerWidth(value) {
            if (self.isExpanded && self.toggleList.length > 0 && ref.expandTimeline && !ref.expandTimeline.isActive()) {
                self.symbologyWidth = value;
                scope.$applyAsync();
            }
        }
    }
}

function symbologyStack($q, $rootScope, ConfigObject, gapiService) {
    class SymbologyStack {
        /**
         * Creates a new symbology stack. All parameters are options and if none is supplied, an empty stack will be created.
         *
         * @param {LayerProxy|Promise<LayerProxy>} proxy [optional = {}] layer proxy object or a promise returning a proxy object which can supply symbology stack; custom symbols will be used first; if they are not availalbe, symbology stack from the proxy object is used;
         * @param {Array} symbols [optional = null] array of alternative symbology svg graphic elements; can be either [ { name: <String>, svgcode: <String> }, ... ] or [ { text: <String>, image: <String> }, ... ]; the latter example (usually coming from a config file) will be transformed into the format by wrapping images in svg containers;
         * @param {String} coverIcon [optional = String] a graphic to be displayed as a cover icon for the symbology stack but which stays put and does not move
         * @param {String} renderStyle [optional = ConfigObject.legend.Entry.ICONS] rendering style for symbology stack animation
         * @param {String} expanded [optional = false] specifies if symbolbogy stack is expanded
         * @param {Boolean} isInteractive [optional = false] specifies if the user can interact with the symbology stack
         */
        // eslint-disable-next-line complexity
        constructor(
            proxy = null,
            symbols = null,
            coverIcon = null,
            renderStyle = ConfigObject.legend.Entry.ICONS,
            expanded = false,
            isInteractive = false
        ) {
            // resolve proxy promise and store the proxy object itself
            if (proxy) {
                $q.resolve(proxy)
                    .then(proxy => (this._proxy = proxy))
                    .catch(() => {}); // ignore proxyPromise error; if that happens, symbology will not be shown anyway
            }

            this._renderStyle = renderStyle;

            this._fannedOut = false;
            this._expanded = expanded;

            const renderStyleSwitch = {
                [ConfigObject.legend.Entry.ICONS]: gapiService.gapi.symbology.listToIconSymbology,
                [ConfigObject.legend.Entry.IMAGES]: gapiService.gapi.symbology.listToImageSymbology
            };

            // is the provided symbols is not an array, set to null
            if (!angular.isArray(symbols)) {
                this._symbols = null;
            } else {
                // custom symbology lists coming from the config file need to be converted to svg first
                this._symbols =
                    symbols.length > 0 && symbols[0].image ? renderStyleSwitch[renderStyle](symbols) : symbols;
            }

            // if a cover icon is specified, convert it to svg as well
            if (coverIcon) {
                this._coverIcon = renderStyleSwitch[ConfigObject.legend.Entry.ICONS]([
                    {
                        text: '',
                        image: coverIcon
                    }
                ])[0];
            }

            this._isInteractive = isInteractive;
        }

        _proxy = null;
        _coverIcon = null;

        /**
         * @return {Boolean} true if the symbology stack can be expanded by the user; false if not;
         */
        get isInteractive() {
            // the stack can only be interactive if there is at least one symbol
            return this.stack && this.stack.length === 0 ? false : this._isInteractive;
        }

        get stack() {
            return this._symbols || (this._proxy ? this._proxy.symbology : []) || [];
        }

        get renderStyle() {
            return this._renderStyle;
        }

        get coverIcon() {
            return this._coverIcon;
        }

        get fannedOut() {
            return this._fannedOut;
        }

        set fannedOut(value) {
            this._fannedOut = value;
        }

        get expanded() {
            return this._expanded;
        }

        set expanded(value) {
            this._expanded = value;
            $rootScope.$applyAsync();
        }
    }

    return SymbologyStack;
}
