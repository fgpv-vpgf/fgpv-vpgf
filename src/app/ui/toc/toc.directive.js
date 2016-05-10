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
    function rvToc(layoutService, dragulaService, $timeout) {
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
            // register toc node with layoutService so it can be targeted
            layoutService.panes.toc = el;

            scope.self.dragulaScope = scope;

            /*dragulaService.options(scope, 'bag-two', {
                mirrorContainer: el[0]
            });*/

            $timeout(() => {

                /*const drake = dragulaService.find(scope, 'bag-one');
                drake.drake.containers.pop();
                drake.drake.containers.push(el.find('.rv-root')[0]);
                console.log(drake);*/

            }, 2000);

            /*scope
                .$on('bag-one.cloned', (event, clone, original, type) => {
                    //el.addClass('over');
                    console.log('bag-one.cloned', event, clone, original, type);

                    el.find('.rv-root').append(clone);
                });*/

            /*scope
                .$on('toc-bag.cloned', (event, clone, original, type) => {
                    //el.addClass('over');
                    console.log('bag-one.cloned', event, clone, original, type);

                    el.find('.rv-root').append(clone);
            });*/
        }
    }

    function Controller(tocService, stateManager, geoService) {
        'ngInject';
        const self = this;

        self.toggleFiltersFull = toggleFiltersFull;

        self.geoService = geoService;
        self.config = tocService.data;
        self.presets = tocService.presets;

        /*dragulaService.options(scope, 'bag-one', {
            mirrorContainer: el.find('.rv-root')[0]
        });*/

        activate();

        /*
        dragulaService.options($scope, 'bag-one', {
            invalid: (el, handle) => {
                console.log(el, handle);

                //return el.tagName !== 'toc-entry';
            }
        });

        $scope
            .$on('bag-one.over', (e, el) => {
                el.addClass('over');
                console.log(e, el);
            });

        $scope.$on('bag-one.out', (e, el) => {
            el.removeClass('over');
            console.log(e, el);
        });*/

        /*************/

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
