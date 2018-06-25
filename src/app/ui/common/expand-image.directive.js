const buttonTemplateUrl = require('./expand-image-button.html');
const dialogTemplateUrl = require('./expand-image-dialog.html');

/**
 * @module expandImageService
 * @memberof app.ui
 * @description
 *
 * The `expandImageService` factory handles the display of full-size images
 *
 */
angular
    .module('app.ui')
    .directive('rvExpandImage', rvExpandImage);

function rvExpandImage($mdDialog, $translate, referenceService) {
    const directive = {
        restrict: 'A',
        link,
        templateUrl: buttonTemplateUrl
    };

    return directive;

    function link(scope, element) {
        const self = this;
        self.canEnlarge = true;
        /**
         * Shows a dialog with the full-size image
         * @function open
         * @param {String} imageUrl url for the image to show full-size
         */
        function open(imageUrl) {
            const shellNode = referenceService.panels.shell;

            // find image size
            // if size is bigger than 80% of window make dialog 80% and have the image handled with overflow
            const img = new Image();
            img.onload = function() {
                const width = Math.min(this.width + 50, shellNode.width() * 0.8);
                const height = Math.min(this.height, shellNode.height() * 0.8);

                $mdDialog.show({
                    controller: ExpandDialogController,
                    controllerAs: 'self',
                    bindToController: true,
                    clickOutsideToClose: true,
                    fullscreen: true,
                    templateUrl: dialogTemplateUrl,
                    parent: shellNode
                });
            }
            img.src = imageUrl;
        }


    /**
     * Controller to set close for $mdDialog
     *
     * @function ExpandDialogController
     * @private
     */
    function ExpandDialogController() {
            'ngInject';
            const self = this;

            self.close = $mdDialog.hide;
            self.canEnlarge = true;
        }
    }
}
