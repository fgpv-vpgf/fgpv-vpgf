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

    /**
     * @name TocController
     * @module api.ui.toc
     * @description
     * The `TocController` controller handles the layer selector (or toc) main panel.
     * Right now it's hacked together for demo purposes.
     */
    function TocController($state) {
        var self = this;

        self.toggleMetadata = toggleMetadata;
        self.toggleSettings = toggleSettings;

        activate();

        ///////////////

        // hacky way to toggle panels;
        // TODO: replace with a sane method
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

        function activate() {

        }
    }
})();
