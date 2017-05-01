(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvPicture
     * @module app.ui.common
     * @restrict E
     * @description
     *
     * The `rvPicture` directive renders supplied image inside a lighgbox.
     *
     */
    angular
        .module('app.ui.common')
        .directive('rvPicture', rvPicture);

    function rvPicture() {
        const directive = {
            restrict: 'A',
            link: link,
            priority: 10
        };

        return directive;

        /***/

        function link(scope, el, attrs) {

            // use watch on ng-bind-html for picture inside detail panel
            scope.$watch(attrs.ngBindHtml, function (val) {
                if (typeof val !== 'undefined' && val.indexOf('rv-picture-lightbox') !== -1) {
                    const a = el.find('.rv-picture-lightbox');

                    a.magnificPopup({
                        type: 'image',
                        callbacks: {
                            open: function () {
                                // because of rf-full-screen, we need to force vibility
                                this.container.attr('style', 'visibility: visible!important');
                                this.bgOverlay.attr('style', 'visibility: visible!important');
                            }
                        }
                    });

                    a.on('click', (event) => {
                        // prevent the link from opening
                        event.preventDefault(true);
                        event.stopPropagation(true);
                    });
                }
            });
        }
    }
})();
