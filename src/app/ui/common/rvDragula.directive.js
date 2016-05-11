(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDragula
     * @module app.ui.common
     * @restrict A
     * @description
     *
     * The `rvDragula` directive is used to workaround angular-dragula propensity of requesting new scopes on the elements.
     * This directive uses inherited scope and the compiles an angular-dragula directive on some random piece of html providing it with proper parameters.
     *
     */
    angular
        .module('app.ui.common')
        .directive('rvDragula', rvDragula);

    function rvDragula($compile, dragulaService, geoService) {
        const directive = {
            restrict: 'A',
            link: link,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr) { // , ctrl) {
            const dragulaScope = scope;

            dragulaService.options(dragulaScope, attr.rvDragula, {
                containers: [el[0]],
                mirrorContainer: el[0],
                accepts: (el, target, source, sibling) => {
                    // el and sibling are raw dom nodes, need to use `angular.element` to get jquery wrappers
                    el = angular.element(el);
                    sibling = angular.element(sibling);

                    // get item above the drop position
                    const aboveItem = sibling.prev(); // can be []
                    const aboveSortGroup = aboveItem.length > 0 ? aboveItem.attr('data-sort-group') : -1;

                    // docs says sibling can be null when trying to drop on the last place in the list
                    // it doesn't seem to happen this way; if the sibling is the draggable item iself (has `gu-mirror` class), assume it's the end of the list
                    const belowItem = sibling.hasClass('gu-mirror') ? [] : sibling;
                    const belowSortGroup = belowItem.length > 0 ? belowItem.attr('data-sort-group') : -1;

                    const elementSortGroup = el.attr('data-sort-group');

                    // console.log(aboveSortGroup, belowSortGroup, elementSortGroup);

                    // if the drop place is surrounded by sort groups different from the element's sort group, forbid drop
                    if (elementSortGroup !== aboveSortGroup && elementSortGroup !== belowSortGroup) {
                        return false;
                    }

                    return true;
                }
            });

            let drake;
            drake = dragulaService.find(dragulaScope, 'toc-bag');

            dragulaScope.$on('toc-bag.drag', (evt, el, source) => {
                const sortGroup = el.attr('data-sort-group');
                source.attr('data-sort-group', sortGroup);

                // console.log('Drag start', evt, el, source);
            });

            dragulaScope.$on('toc-bag.drop', (evt, el, target, source, sibling) => { // , sibling) => {
                source.removeAttr('data-sort-group');

                // hack
                // when dropped at the end of the list, sibling, instead of being null as per docs, is the mirror node, argh...
                const siblingLayerId = sibling.hasClass('gu-mirror') ? -1 : sibling.scope().item.id;
                const elementLayerId = el.scope().item.id

                console.log(elementLayerId, siblingLayerId);

                geoService.moveLayer(elementLayerId, siblingLayerId);
                // console.log('Drag complete', evt, el, target, source, sibling);
            });

            dragulaScope.$on('toc-bag.cancel', (evt, el, target, source) => { // , sibling) => {
                source.removeAttr('data-sort-group');

                // console.log('Drag complete', evt, el, target, source, sibling);
            });

            $compile(`<div dragula="'${attr.rvDragula}'" dragula-model="${attr.rvDragulaModel}"></div>`)(
                dragulaScope);
        }
    }
})();
