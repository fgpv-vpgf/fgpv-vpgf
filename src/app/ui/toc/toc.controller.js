(() => {
    'use strict';

    /**
     * @ngdoc function
     * @name TocController
     * @module app.ui.toc
     * @description
     *
     * The `TocController` controller handles the layer selector (or toc) main panel.
     * Right now it's hacked together for demo purposes.
     * `TocController` has lots of ugly code to handle state switching. Should be rewritten.
     */
    angular
        .module('app.ui.toc')
        .controller('TocController', TocController);

    function TocController($state, tocService, stateManager) {
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
            if ($state.current.name.indexOf('filters') === -1) {
                $state.go('app.main.toc.filters.default', {}, {
                    location: false
                });
            } else {
                $state.go('app.main.toc', {}, {
                    location: false
                });
            }
        }

        // hacky way to toggle filters panel modes;
        // TODO: replace with a sane methods
        function toggleFiltersFull() {
            //Temporary change, will soon be replaced with new directive
            const views = [
                'default',
                'minimized',
                'full',
                'attached'
            ];

            let currentMode = stateManager.getMode('filters');
            let index = (views.indexOf(currentMode) + 1) % 4;

            stateManager.setMode('filters', views[index]);

            /*$state.go(views[index], {}, {
                location: false
            });*/
        }

        function activate() {

        }
    }
})();
