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

function rvExpandImage($mdDialog, referenceService, $compile, $templateCache) {
    const directive = {
        restrict: 'A',
        link
    };

    return directive;

    function link(scope, element, attr) {
        const self = scope.self;

        const shellNode = referenceService.panels.shell;
        let width = 0;
        let height = 0;
        self.canEnlarge = false;

        // get the url of the image from the tag's ngSrc or src
        // if the tag has a special format for src (eg. <rv-svg>) then specify an additional attribute
        // 'source' to provide the actual image
        const imageUrl = attr.source || attr.ngSrc || attr.src;

        // set canEnlarge true if natural width of the image is larger than the width of the toc panel
        // also get the natural width and height of the image
        const img = new Image();
        img.onload = function() {
            width = Math.min(this.width + 50, shellNode.width() * 0.8);
            height = Math.min(this.height, shellNode.height() * 0.8);
            self.canEnlarge = width > element.parents(".rv-toc").width();
        }
        img.src = imageUrl;

        const template = $templateCache.get(buttonTemplateUrl);
        element.after($compile(template)(scope));

        /**
         * Shows a dialog with the full-size image
         * @function open
         */
        self.open = () => {
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

        /**
         * Controller to set close for $mdDialog
         *
         * @function ExpandDialogController
         * @private
         */
        function ExpandDialogController() {
                'ngInject';
                const self = this;

                self.width = width;
                self.height = height;
                self.imageUrl = imageUrl;

                self.close = $mdDialog.hide;
        }
    }
}
