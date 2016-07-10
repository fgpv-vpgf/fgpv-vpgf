(() => {
    'use strict';

    /**
     * @module rvAppbar
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvAppbar` directive wraps and adds functionality to the menu buttons.
     *
     */
    angular
        .module('app.ui.appbar')
        .directive('rvAppbar', rvAppbar);

    /**
     * `rvAppbar` directive body.
     *
     * @function rvAppbar
     * @return {object} directive body
     */
    function rvAppbar(storageService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/appbar/appbar.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        function link(scope, el) {
            storageService.panels.sidePanel = el;
        }

        return directive;
    }

    function Controller(layoutService, stateManager) {
        'ngInject';
        const self = this;

        self.layoutService = layoutService;
        self.stateManager = stateManager;

        self.toggleDetails = toggleDetails;
        self.toggleToc = toggleToc;
        self.toggleToolbox = toggleToolbox;

        activate();

        function activate() {

        }

        function toggleDetails() {
            stateManager.setActive({ side: false }, 'mainDetails');
        }

        function toggleToc() {
            stateManager.setActive({ side: false }, 'mainToc');
        }

        function toggleToolbox() {
            stateManager.setActive({ side: false }, 'mainToolbox');
        }
    }
})();
