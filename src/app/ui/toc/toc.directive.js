const templateUrl = require('./toc.html');

const LEGEND_ROOT_CLASS = '.rv-legend-root';
const REORDER_CLASS = 'rv-reorder';

/**
 * @module rvToc
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvToc` directive wraps and provides functionailty for the toc for the main panel.
 *
 */
angular
    .module('app.ui')
    .directive('rvToc', rvToc);

function rvToc($timeout, referenceService, layerRegistry, dragulaService, geoService, animationService, configService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, directiveElement) {
        const self = scope.self;

        self.toggleSortGroups = toggleSortGroups;

        // flag the touchstart event happening on the layers panel, so the default drag-n-drop reorder can be canceled;
        // only reorder using the reorder mode is allowed when touch events are detected https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1457
        let isTouchDetected = false;
        directiveElement.on('touchstart', () =>
            (isTouchDetected = true));

        // register toc node with referenceService so it can be targeted
        referenceService.panes.toc = directiveElement;

        // TODO convert this object into an ES6 class
        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        self.dragulaOptions = {

            moves(el, source, handle) {
                // disable any reorder when the legend is structured;
                // drag handles are disabled in the template, but mouse reorder can be triggered without them
                if (!configService.getSync.ui.legend.reorderable) {
                    return false;
                }

                // elements are always draggable by default
                // only allow reordering using the drag handle when using touch
                if (isTouchDetected) {
                    isTouchDetected = false;

                    // prevent drag from starting if something other than a handle was grabbed
                    if (angular.element(handle).parentsUntil(el, '[rv-drag-handle]').length > 0) {
                        return true;
                    } else {
                        return false;
                    }

                } else {
                    return true; // always allow drag for with mouse events
                }
            },

            accepts(dragElement, target, source, sibling) {
                // el and sibling are raw dom nodes, need to use `angular.element` to get jquery wrappers
                [dragElement, sibling] = [angular.element(dragElement), angular.element(sibling)];

                // get item above the drop position
                const aboveItem = sibling.prev(); // can be [] if it's the first item in the list
                const aboveSortGroup = aboveItem.length > 0 ? aboveItem.scope().block.sortGroup : -1;

                // docs says sibling can be null when trying to drop on the last place in the list
                // it doesn't seem to happen this way; if the sibling is the draggable item itself (has `gu-mirror` class), assume it's the end of the list
                const belowItem = sibling.hasClass('gu-mirror') ? [] : sibling;
                const belowSortGroup = belowItem.length > 0 ? belowItem.scope().block.sortGroup : -1;

                const elementSortGroup = dragElement.scope().block.sortGroup;

                // if the drop place is surrounded by sort groups different from the element's sort group, forbid drop
                if (elementSortGroup !== aboveSortGroup && elementSortGroup !== belowSortGroup) {
                    return false;
                }

                // accept drop
                return true;
            },
            rvDragStart(evt, dragElement, source) {
                const sortGroup = dragElement.scope().block.sortGroup;
                source.attr('data-sort-group', sortGroup);
            },

            rvDragDrop(evt, dragElement, target, source, sibling) {
                source.removeAttr('data-sort-group');
            },

            rvDragDropModel() {
                layerRegistry.synchronizeLayerOrder();
            },

            rvDragCancel(evt, elem, target, source) {
                source.removeAttr('data-sort-group');
            }
        };
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        // set an empty animation object in the event a method is called prior
        // to a scroll animation being created
        let scrollAnimation = { pause: () => {}, isActive: () => false };

        // on drag start, add data attribute to the list indicating which sort group the dragged layer can be accepted into
        // this will highlight invalid drop target
        scope.$on('toc-bag.drag', (evt, dragElement, source) => {
            self.dragulaOptions.rvDragStart(evt, dragElement, source);

            // handle autoscroll when dragging layers
            const scrollElem = source.closest('md-content');
            directiveElement.on('mousemove touchmove', event => {

                const pageY = event.pageY ? event.pageY :  event.originalEvent.touches[0].clientY;

                // scroll animation is linear
                let scrollDuration;
                const speedRatio = 1 / 500; // 500 px in 1 second

                // scrolling upwards
                if (scrollElem.offset().top + dragElement.height() > pageY) {
                    scrollDuration = scrollElem.scrollTop() * speedRatio;

                    if (!scrollAnimation.isActive()) {
                        scrollAnimation = animationService.to(scrollElem, scrollDuration,
                            { scrollTo: { y: 0 }, ease: 'Linear.easeNone' });
                    }

                // scrolling downwards
                } else if (scrollElem.height() - pageY <= 0) {
                    if (!scrollAnimation.isActive()) {
                        scrollDuration = (scrollElem[0].scrollHeight -
                            scrollElem.height() - scrollElem.scrollTop()) * speedRatio;

                        scrollAnimation = animationService.to(scrollElem, scrollDuration,
                            { scrollTo: { y: scrollElem[0].scrollHeight - scrollElem.height() },
                                ease: 'Linear.easeNone' });
                    }

                // stop scrolling
                } else {
                    scrollAnimation.pause();
                }
            });
        });

        // on drop, remove data attribute from the list restoring normal appearance
        // call geoService to reorder layers
        scope.$on('toc-bag.drop', (...args) => {
            self.dragulaOptions.rvDragDrop(...args);

            // stop and remove autoscroll
            directiveElement.off('mousemove touchmove');
            scrollAnimation.pause();
        });

        // on cancel, remove data attribute from the list restoring normal appearance
        scope.$on('toc-bag.cancel', (...args) => {
            self.dragulaOptions.rvDragCancel(...args);

            // stop and remove autoscroll
            directiveElement.off('mousemove touchmove');
            scrollAnimation.pause();
        });

        // `drop-model` is fired when the model is synchronized
        scope.$on('toc-bag.drop-model', () =>
            self.dragulaOptions.rvDragDropModel());

        /**
         * @function toggleSortGroups
         * @private
         * @param {Booelan} value indicates whether the sort groups should be fanned out or collapsed
         */
        function toggleSortGroups(value) {

            const legendListElement = directiveElement.find(LEGEND_ROOT_CLASS);
            const legendListItemsElements = legendListElement.find('> li');
            const sortGroupCount = parseInt(legendListItemsElements.last().attr('data-sort-group'));
            let splitSortGroupElement;

            const tl = animationService.timeLineLite({
                paused: true,
                onComplete: () => {
                    legendListElement.addClass(REORDER_CLASS);
                    animationService.set(legendListItemsElements,
                        { clearProps: 'margin-top' }
                    );
                },
                onReverseComplete: () => legendListElement.removeClass(REORDER_CLASS)
            });

            for (let i = 0; i < sortGroupCount; i++) {
                splitSortGroupElement = legendListItemsElements
                    .filter(`[data-sort-group="${i}"] + [data-sort-group="${i + 1}"]`);

                tl.fromTo(splitSortGroupElement, 0.3,
                    { 'margin-top': 0 }, { 'margin-top': 36 }, 0);
            }

            if (value) {
                tl.play();
            } else {
                tl.reverse(0);
            }
        }
    }
}

function Controller($scope, tocService, layerRegistry, stateManager, geoService, keyNames, configService,
    $rootScope, events, layoutService, Geo, LegendBlock, appInfo) {

    'ngInject';
    const self = this;

    const ref = {
        initialTableDeregister: angular.noop,
        initialDynamicLayerFilter: angular.noop
    };

    self.toggleTableFull = toggleTableFull;
    self.toggleReorderMode = toggleReorderMode;
    self.tocKeyDownHandler = tocKeyDownHandler;

    self.notifyApiClick = notifyApiClick;

    self.geoService = geoService;
    self.config = tocService.data;

    let deregisterListener = angular.noop;

    configService.onEveryConfigLoad(cfg => {
        self.config = cfg;

        // check if we need to open a table panel by default
        if (self.config.ui.tableIsOpen[layoutService.currentLayout()]) {
            _openInitialTable(self.config.ui.tableIsOpen.id);
        }
    });

    // apply filter for dynamic layers if any
    _applyInitialDynamicLayerFilter();

    // reorder mode is off by default
    self.isReorder = false;

    /**
     * Apply filter to dynamic layer if was specified in the configuration file
     * @private
     * @function _applyInitialDynamicLayerFilter
     */
    function _applyInitialDynamicLayerFilter() {
        ref.initialDynamicLayerFilter();
        ref.initialDynamicLayerFilter = events.$on(events.rvLayerRecordLoaded, (_, layerRecordId) => {
            const layerRecord = layerRegistry.getLayerRecord(layerRecordId);

            if (layerRecord && layerRecord.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                layerRecord.config.layerEntries.forEach(currentSubLayer => {
                    if (currentSubLayer.table) {        // if table exists, we need to reaply the definition query every time on reload
                        const proxy = layerRecord.getChildProxy(currentSubLayer.index);

                        proxy.setDefinitionQuery(currentSubLayer.initialFilteredQuery);
                    }
                });
            }
        });
    }

    function _openInitialTable(initialLayerRecordId) {
        ref.initialTableDeregister();

        // wait for layer to finish loading
        ref.initialTableDeregister = events.$on(events.rvLayerRecordLoaded, (_, layerRecordId) => {
            if (initialLayerRecordId !== layerRecordId) {
                return;
            }

            // find the mapping between the layer record and legend blocks
            const legendMapping = configService.getSync.map.legendMappings[layerRecordId];
            if (legendMapping.length === 0) {
                ref.initialTableDeregister();
                return;
            }

            // get the id of the first legend block that is mapped to that layer record
            const legendBlockId = legendMapping[0].legendBlockId;

            // find that legend block
            const legendBlock = self.config.map.legendBlocks
                .walk((entry, index, parentEntry) =>
                    entry.id === legendBlockId ? entry : null)
                .filter(a => a !== null)[0];

            // open the datatable if the legend block is found
            if (legendBlock) {
                tocService.toggleLayerTablePanel(legendBlock);
            }

            ref.initialTableDeregister();
        });
    }

    /***/

    // hacky way to toggle table panel modes;
    // TODO: replace with a sane methods
    function toggleTableFull() {
        const views = [
            'default',
            'minimized',
            'full',
            'attached'
        ];

        let currentMode = stateManager.state.table.morph;
        let index = (views.indexOf(currentMode) + 1) % 4;

        // Make sure the table panel is open
        stateManager.setActive({
            side: false
        }, {
            tableFulldata: true
        });
        stateManager.setMode('table', views[index]);
    }

    /**
     * Enabled or disabled the reorder mode based on its current state or supplied value.
     *
     * @function toggleReorderMode
     * @private
     * @param {Boolean} value [optional = !self.isReorder] indicates whether to enable or disalbe the reorder mode
     */
    function toggleReorderMode(value = !self.isReorder) {
        self.toggleSortGroups(value);
        self.isReorder = value;
    }

    /**
     * Handle key down pressed on the toc panel.
     *
     * - Escape: turns off the reorder mode if enabled
     *
     *
     * @function tocKeyDownHandler
     * @private
     * @param {Object} event key down event with keycode and everything
     */
    function tocKeyDownHandler(event) {
        // cancel reorder mode on `Escape` key when pressed over toc
        if (event.keyCode === keyNames.ESCAPE && self.isReorder) {
            self.toggleReorderMode(false);
            killEvent(event);
        }
    }

    /**
     * Kills default and event propagation.
     * // TODO: useful function; should be in common module or something;
     * @function killEvent
     * @private
     * @param  {object} event event object
     */
    function killEvent(event) {
        event.preventDefault(true);
        event.stopPropagation(true);
    }

    /**
     * Triggers the API layer group observable when a layer is clicked on the legend
     *
     * @function notifyApiClick
     * @private
     * @param {LegendBlock} legendBlock legend block that was clicked
     */
    function notifyApiClick(block) {
        let layer;
        if (appInfo.mapi && block.blockType === LegendBlock.TYPES.NODE) {  // make sure the item clicked is a node, and not group or other
            if (block.parentLayerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                layer = appInfo.mapi.layers.allLayers.find(l =>
                    l.id === block.layerRecordId &&
                    l.layerIndex === parseInt(block.itemIndex));
            } else {
                layer = appInfo.mapi.layers.getLayersById(block.layerRecordId)[0];
            }

            if (layer) {
                appInfo.mapi.layers._click.next(layer);
            }
        }
    }
}
