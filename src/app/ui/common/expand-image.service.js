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
    .factory('expandImageService', expandImageService);

function expandImageService($mdDialog, $translate, referenceService) {
    const service = {
        open,
        close
    };

    return service;

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

            const template =
                `<md-dialog aria-label="{{\'toc.tooltip.fullsizeImage\' | translate}}" class="rv-expanded-dialog" style="width: ${width}px; height: ${height}px;">
                    <rv-content-pane close-panel="self.close()" title-style="title" title-value="{{\'toc.tooltip.fullsizeImage\' | translate}}">
                        <img class="rv-expanded-image" src="${imageUrl}"></img>
                        <div>{{self.test}}</div>
                    </rv-content-pane>
                </md-dialog>`;

            $mdDialog.show({
                controller: ExpandDialogController,
                controllerAs: 'self',
                bindToController: true,
                clickOutsideToClose: true,
                fullscreen: true,
                template: template,
                parent: shellNode
            });
        }
        img.src = imageUrl;
    }

    /**
     * Closes dialog
     * @function close
     */
    function close() {
        $mdDialog.hide();
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
    }
}
