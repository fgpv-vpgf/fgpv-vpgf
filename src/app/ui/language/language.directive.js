(() => {
    'use strict';

    /**
     * @module rvLanguage
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvLanguage` directive let user switch language in full screen mode.
     *
     */
    angular
        .module('app.ui.language')
        .directive('rvLanguage', rvLanguage);

    /**
     * `rvLanguage` directive body.
     *
     * @function rvLanguage
     * @return {object} directive body
     */
    function rvLanguage(storageService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/language/language.html',
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

    function Controller() {
        'ngInject';
        const self = this;

        self.toggleToc = toggleToc;

        activate();

        function activate() {

        }

        function toggleToc() {
            console.log('test');
        }
    }
})();
