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
    function rvToc() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/toc/toc.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller(tocService, stateManager) {
        'ngInject';
        const self = this;

        self.toggleFilters = toggleFilters;
        self.toggleFiltersFull = toggleFiltersFull;

        self.config = tocService.data;
        self.presets = tocService.presets;

        activate();

        ///////////////

        // hacky way to toggle panels;
        // TODO: replace with a sane methods
        function toggleFilters() {
            //make sure side-panel is closed, then open filters
            stateManager.set({ side: false }, 'filtersFulldata');
        }

        // hacky way to toggle filters panel modes;
        // TODO: replace with a sane methods
        function toggleFiltersFull() {
            const views = [
                'default',
                'minimized',
                'full',
                'attached'
            ];

            let currentMode = stateManager.getMode('filters');
            let index = (views.indexOf(currentMode) + 1) % 4;

            //Make sure the filters panel is open
            stateManager.set({ side: false }, { filtersFulldata: true });
            stateManager.setMode('filters', views[index]);
        }

        function activate() {

        }
    }
})();
