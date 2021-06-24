const templateUrl = require('./keyboard-instructions.html');
const dialogUrl = require('./keyboard-instructions-dialog.html');

/* global RAMP */

/**
 *
 * @name rvKeyboardInstructions
 * @module app.ui
 * @requires dependencies
 * @description
 *
 */
angular.module('app.ui').directive('rvKeyboardInstructions', rvKeyboardInstructions);

function rvKeyboardInstructions($rootElement, $mdDialog, referenceService) {
    const directive = {
        restrict: 'E',
        link,
        templateUrl,
        scope: {},
        controller: () => {},
        controllerAs: 'self',
        bindToController: true,
    };

    return directive;

    /***/

    /**
     * Open the keyboard instruction dialog.
     * @function open
     */
    function link(scope) {
        const self = scope.self;
        const shellNode = referenceService.panels.shell;

        self.open = () => {
            $mdDialog.show({
                controller: KeyboardInstructionsController,
                controllerAs: 'ctrl',
                bindToController: true,
                clickOutsideToClose: true,
                fullscreen: true,
                templateUrl: dialogUrl,
                parent: shellNode,
                disableParentScroll: false,
            });
        };

        /**
         * Controller to set close for $mdDialog
         *
         * @function KeyboardInstructionsController
         * @private
         */
        function KeyboardInstructionsController() {
            'ngInject';
            const self = this;

            self.close = $mdDialog.hide;
        }
    }
}
