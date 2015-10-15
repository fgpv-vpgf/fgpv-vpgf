(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name TocController
     * @module app.ui.toc
     * @description
     *
     * The `TocController` controller handles the layer selector (or toc) main panel.
     * Right now it's hacked together for demo purposes.
     */
    angular
        .module('app.ui.toc')
        .controller('TocController', TocController);

    /* @ngInject */
    /**
     * `TocController` has lots of ugly code to handle state switching. Should be rewritten.
     */
    function TocController($state) {
        var self = this;

        self.toggleMetadata = toggleMetadata;
        self.toggleSettings = toggleSettings;
        self.toggleFilters = toggleFilters;
        self.toggleFiltersFull = toggleFiltersFull;

        activate();

        ///////////////

        // hacky way to toggle panels;
        // TODO: replace with a sane methods
        function toggleMetadata() {
            if ($state.current.name.indexOf('metadata') === -1) {
                $state.go('app.main.toc.side.metadata', {}, {
                    location: false
                });
            } else {
                $state.go('app.main.toc', {}, {
                    location: false
                });
            }
        }

        // hacky way to toggle panels;
        // TODO: replace with a sane methods
        function toggleSettings() {
            if ($state.current.name.indexOf('settings') === -1) {
                $state.go('app.main.toc.side.settings', {}, {
                    location: false
                });
            } else {
                $state.go('app.main.toc', {}, {
                    location: false
                });
            }
        }

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
            const views = [
                'app.main.toc.filters.default',
                'app.main.toc.filters.default.minimized',
                'app.main.toc.filters.default.full',
                'app.main.toc.filters.default.attached'
            ];

            let index = (views.indexOf($state.current.name) + 1) % 4;

            $state.go(views[index], {}, {
                location: false
            });
        }

        function activate() {

        }
    }
})();
