/* global TweenLite */
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
            // register toc node with layoutService so it can be targeted
            layoutService.panes.toc = directiveElement;

            self.dragulaOptions = {
                accepts: (dragElement, target, source, sibling) => {
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
                }
            };

            // set an empty animation object in the event a method is called prior
            // to a scroll animation being created
            let scrollAnimation = { pause: () => {}, isActive: () => false };

            // on drag start, add data attribute to the list indicating which sort group the dragged layer can be accepted into
            // this will highlight invalid drop target
            scope.$on('toc-bag.drag', (evt, dragElement, source) => {
                const sortGroup = dragElement.scope().item.sortGroup;
                source.attr('data-sort-group', sortGroup);

                // handle autoscroll when dragging layers
                const scrollElem = source.closest('md-content');
                directiveElement.on('mousemove', event => {
                    // Animation time is proportionate to the actual pixel distance to be scolled
                    // times 3 - where 3 is the maximum animation time in seconds
                    let scrollSpeed = (scrollElem.scrollTop() /
                        (scrollElem[0].scrollHeight - scrollElem.height())) * 3;

                    // scrolling upwards
                    if (scrollElem.offset().top + dragElement.height() > event.pageY) {
                        if (!scrollAnimation.isActive()) {
                            scrollAnimation = TweenLite.to(scrollElem, scrollSpeed, { scrollTo: { y: 0 } });
                        }

                    // scrolling downwards
                    } else if (scrollElem.height() - event.pageY <= 0) {
                        if (!scrollAnimation.isActive()) {
                            scrollAnimation = TweenLite.to(scrollElem, 3 - scrollSpeed,
                                { scrollTo: { y: scrollElem[0].scrollHeight - scrollElem.height() } });
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
            scope.$on('toc-bag.drop', (evt, dragElement, target, source, sibling) => { // , sibling) => {
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

                // stop and remove autoscroll
                directiveElement.off('mousemove');
                scrollAnimation.pause();
            });

            // on cancle, remove data attribute from the list restoring normal appearance
            scope.$on('toc-bag.cancel', (evt, elem, target, source) => { // , sibling) => {
                source.removeAttr('data-sort-group');

                // stop and remove autoscroll
                directiveElement.off('mousemove');
                scrollAnimation.pause();
            });
        }
    }

    function Controller(tocService, stateManager, geoService) {
        'ngInject';
        const self = this;

        self.toggleFiltersFull = toggleFiltersFull;

        self.geoService = geoService;
        self.config = tocService.data;
        self.presets = tocService.presets;

        activate();

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

        function activate() {

        }
    }
})();
