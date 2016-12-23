/* global TimelineLite, TweenLite */
(() => {
    'use strict';

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
        .module('app.ui.toc')
        .directive('rvToc', rvToc);

    /**
     * `rvToc` directive body.
     *
     * @return {object} directive body
     */
    function rvToc($timeout, layoutService, dragulaService, geoService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/toc.html',
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

            // register toc node with layoutService so it can be targeted
            layoutService.panes.toc = directiveElement;

            // TODO convert this object into an ES6 class
            // jscs doesn't like enhanced object notation
            // jscs:disable requireSpacesInAnonymousFunctionExpression
            self.dragulaOptions = {

                moves(el, source, handle) { // , sibling) {
                    console.log('moves'); // , el, source, handle, sibling);
                    // return true; // elements are always draggable by default

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

                /*invalid(el, handle) {
                    // console.log('invalid', el, handle);
                    return false; // don't prevent any drags from initiating by default
                },*/

                accepts(dragElement, target, source, sibling) {
                    // el and sibling are raw dom nodes, need to use `angular.element` to get jquery wrappers
                    [dragElement, sibling] = [angular.element(dragElement), angular.element(sibling)];

                    // get item above the drop position
                    const aboveItem = sibling.prev(); // can be [] if it's the first item in the list
                    const aboveSortGroup = aboveItem.length > 0 ? aboveItem.scope().item.sortGroup : -1;

                    // docs says sibling can be null when trying to drop on the last place in the list
                    // it doesn't seem to happen this way; if the sibling is the draggable item itself (has `gu-mirror` class), assume it's the end of the list
                    const belowItem = sibling.hasClass('gu-mirror') ? [] : sibling;
                    const belowSortGroup = belowItem.length > 0 ? belowItem.scope().item.sortGroup : -1;

                    const elementSortGroup = dragElement.scope().item.sortGroup;

                    // console.log(`accept check, ${aboveSortGroup}, ${belowSortGroup}, ${elementSortGroup}`);

                    // if the drop place is surrounded by sort groups different from the element's sort group, forbid drop
                    if (elementSortGroup !== aboveSortGroup && elementSortGroup !== belowSortGroup) {
                        return false;
                    }

                    // accept drop
                    return true;
                },
                rvDragStart(evt, dragElement, source) {
                    const sortGroup = dragElement.scope().item.sortGroup;
                    source.attr('data-sort-group', sortGroup);
                },

                rvDragDrop(evt, dragElement, target, source, sibling) {
                    source.removeAttr('data-sort-group');

                    // hack
                    // when dropped at the end of the list, sibling, instead of being null as per docs, is the mirror node, argh...
                    // FIXME: remove 'placeholder' part of the id; should be fixed by refactor - split layer id and legend id on legend entry

                    const elementLayerId = dragElement.scope().item.id.replace('placeholder', '');

                    let dropLayerId;

                    if (sibling.hasClass('gu-mirror')) {
                        dropLayerId = undefined;
                    } else {
                        const siblingIndex = geoService.legend.items.indexOf(sibling.scope().item);

                        // go down the legend and find the first layer which is
                        // an actual layer in the map stack the element layer is be rebased on top
                        dropLayerId = geoService.legend.items.find((item, index) =>
                            index >= siblingIndex && geoService._refactorIsLayerInMapStack(item.id, item.sortGroup));

                        dropLayerId = typeof dropLayerId === 'undefined' ?
                            undefined : dropLayerId.id.replace('placeholder', '');
                    }
                    geoService.moveLayer(elementLayerId, dropLayerId);
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
                directiveElement.on('mousemove', event => {

                    // scroll animation is linear
                    let scrollDuration;
                    const speedRatio = 1 / 500; // 500 px in 1 second

                    // scrolling upwards
                    if (scrollElem.offset().top + dragElement.height() > event.pageY) {
                        scrollDuration = scrollElem.scrollTop() * speedRatio;

                        if (!scrollAnimation.isActive()) {
                            scrollAnimation = TweenLite.to(scrollElem, scrollDuration,
                                { scrollTo: { y: 0 }, ease: 'Linear.easeNone' });
                        }

                    // scrolling downwards
                    } else if (scrollElem.height() - event.pageY <= 0) {
                        if (!scrollAnimation.isActive()) {
                            scrollDuration = (scrollElem[0].scrollHeight -
                                scrollElem.height() - scrollElem.scrollTop()) * speedRatio;

                            scrollAnimation = TweenLite.to(scrollElem, scrollDuration,
                                { scrollTo: { y: scrollElem[0].scrollHeight - scrollElem.height() },
                                ease: 'Linear.easeNone' });
                        }

                    // stop scrolling
                    } else {
                        scrollAnimation.pause();
                    }
                });

                // console.log('Drag start', evt, el, source);
            });

            // on drop, remove data attribute from the list restoring normal appearance
            // call geoService to reorder layers
            scope.$on('toc-bag.drop', (evt, dragElement, target, source, sibling) => {
                self.dragulaOptions.rvDragDrop(evt, dragElement, target, source, sibling);

                // stop and remove autoscroll
                directiveElement.off('mousemove');
                scrollAnimation.pause();
            });

            // on cancel, remove data attribute from the list restoring normal appearance
            scope.$on('toc-bag.cancel', (evt, elem, target, source) => { // , sibling) => {
                self.dragulaOptions.rvDragCancel(evt, elem, target, source);

                // stop and remove autoscroll
                directiveElement.off('mousemove');
                scrollAnimation.pause();
            });

            /**
             * @function toggleSortGroups
             * @private
             * @param {Booelan} value indicates whether the sort groups should be fanned out or collapsed
             */
            function toggleSortGroups(value) {

                const legendListElement = directiveElement.find('.rv-root');
                const legendListItemsElements = legendListElement.find('> li');
                const sortGroupCount = parseInt(legendListItemsElements.last().attr('data-sort-group'));
                let splitSortGroupElement;

                const tl = new TimelineLite({
                    paused: true,
                    onComplete: () => {
                        legendListElement.addClass('rv-reorder');
                        TweenLite.set(legendListItemsElements,
                            { clearProps: 'margin-top' }
                        );
                    },
                    onReverseComplete: () => legendListElement.removeClass('rv-reorder')
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

    function Controller(tocService, stateManager, geoService, keyNames) {
        'ngInject';
        const self = this;

        self.toggleFiltersFull = toggleFiltersFull;
        self.toggleReorderMode = toggleReorderMode;
        self.tocKeyDownHandler = tocKeyDownHandler;

        self.geoService = geoService;
        self.config = tocService.data;
        self.presets = tocService.presets;

        // reorder mode is off by default
        self.isReorder = false;

        /***/

        // hacky way to toggle filters panel modes;
        // TODO: replace with a sane methods
        function toggleFiltersFull() {
            const views = [
                'default',
                'minimized',
                'full',
                'attached'
            ];

            let currentMode = stateManager.state.filters.morph; // stateManager.getMode('filters');
            let index = (views.indexOf(currentMode) + 1) % 4;

            // Make sure the filters panel is open
            stateManager.setActive({
                side: false
            }, {
                filtersFulldata: true
            });
            stateManager.setMode('filters', views[index]);
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
            console.log(event.keyCode);
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
    }
})();
