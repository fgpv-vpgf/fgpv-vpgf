const templateUrl = require('./lightbox.html');

/**
 * @module rvLightbox
 * @module app.ui
 * @restrict A
 * @description
 *
 * The `rvLightbox` directive creates the lightbox control
 *
 */
angular
    .module('app.ui')
    .directive('rvLightbox', rvLightbox);

function rvLightbox($mdDialog, referenceService) {
    const directive = {
        restrict: 'A',
        scope: '=',
        link: link
    };

    return directive;

    /*********/

    function link(scope, element) {

        element.on('click', event => {
            // exit if the element is a link but not an image since they should be able to open
            if (event.target.nodeName === 'A') {
                return;
            }

            // prevent the link from opening
            event.preventDefault(true);
            event.stopPropagation(true);

            const imgs = element.find('img');

            if (imgs.length > 0) {
                const images = [];
                imgs.each(index => { images.push(imgs[index].src); });

                $mdDialog.show({
                    controller: LightboxController,
                    parent: referenceService.panels.shell,
                    locals: {
                        items: { images }
                    },
                    templateUrl,
                    clickOutsideToClose: true,
                    disableParentScroll: false,
                    escapeToClose: true,
                    controllerAs: 'self',
                    bindToController: true,
                    hasBackdrop: true
                });
            }
        });
    }

    function LightboxController(items, keyNames) {
        'ngInject';
        const self = this;

        self.close = $mdDialog.hide;
        self.index = 0;
        self.images = items.images;
        self.length = self.images.length;
        self.currImage = self.images[self.index];

        self.previous = clickPrevious;
        self.next = clickNext;
        self.loopImages = loopImages;

        function loopImages(event) {
            if (event.keyCode === keyNames.LEFT_ARROW) {
                clickPrevious();
            } else if (event.keyCode === keyNames.RIGHT_ARROW) {
                clickNext();
            }
        }

        function clickPrevious() {
            self.index = self.index === 0 ? self.length - 1 : self.index - 1;
            self.currImage = self.images[self.index];
        }

        function clickNext() {
            self.index = self.index === self.length - 1 ? 0 : self.index + 1;
            self.currImage = self.images[self.index];
        }
    }
}
