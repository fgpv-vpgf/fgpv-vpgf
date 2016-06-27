(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvToc
     * @module app.ui.toc
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

        function link(scope, el) {
            const self = scope.self;

            // register toc node with layoutService so it can be targeted
            layoutService.panes.toc = el;

            self.dragulaOptions = {
                accepts: (el, target, source, sibling) => {
                    // el and sibling are raw dom nodes, need to use `angular.element` to get jquery wrappers
                    [el, sibling] = [angular.element(el), angular.element(sibling)];

                    // get item above the drop position
                    const aboveItem = sibling.prev(); // can be [] if it's the first item in the list
                    const aboveSortGroup = aboveItem.length > 0 ? aboveItem.scope().item.sortGroup : -1;

                    // docs says sibling can be null when trying to drop on the last place in the list
                    // it doesn't seem to happen this way; if the sibling is the draggable item itself (has `gu-mirror` class), assume it's the end of the list
                    const belowItem = sibling.hasClass('gu-mirror') ? [] : sibling;
                    const belowSortGroup = belowItem.length > 0 ? belowItem.scope().item.sortGroup : -1;

                    const elementSortGroup = el.scope().item.sortGroup;

                    // console.log(`accept check, ${aboveSortGroup}, ${belowSortGroup}, ${elementSortGroup}`);

                    // if the drop place is surrounded by sort groups different from the element's sort group, forbid drop
                    if (elementSortGroup !== aboveSortGroup && elementSortGroup !== belowSortGroup) {
                        return false;
                    }

                    // accept drop
                    return true;
                }
            };

            // on drag start, add data attribute to the list indicating which sort group the dragged layer can be accepted into
            // this will highlight invalid drop target
            scope.$on('toc-bag.drag', (evt, el, source) => {
                const sortGroup = el.scope().item.sortGroup;
                source.attr('data-sort-group', sortGroup);

                // console.log('Drag start', evt, el, source);
            });

            // on drop, remove data attribute from the list restoring normal appearance
            // call geoService to reorder layers
            scope.$on('toc-bag.drop', (evt, el, target, source, sibling) => { // , sibling) => {
                source.removeAttr('data-sort-group');

                // hack
                // when dropped at the end of the list, sibling, instead of being null as per docs, is the mirror node, argh...
                // FIXME: remove 'placeholder' part of the id; should be fixed by refactor - split layer id and legend id on legend entry

                const elementLayerId = el.scope().item.id.replace('placeholder', '');

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

                // console.log(elementLayerId, dropLayerId);

                geoService.moveLayer(elementLayerId, dropLayerId);

                // console.log('Drag complete', evt, el, target, source, sibling);
            });

            // on cancle, remove data attribute from the list restoring normal appearance
            scope.$on('toc-bag.cancel', (evt, el, target, source) => { // , sibling) => {
                source.removeAttr('data-sort-group');

                // console.log('Drag complete', evt, el, target, source, sibling);
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
