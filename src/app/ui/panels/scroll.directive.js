(() => {

    angular
        .module('app.ui.panels')
        .directive('rvScroll', rvScroll);

    /**
     * `rvMorph` directive body.
     *
     * @return {object} directive body
     */
    function rvScroll() {
        const directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        /**
         * Directive's link function. Sets up a watch on the `ng-morph` attribute and triggers the animation on attribute change.
         * Initial setting and nulling of the attribute causes immediate change with no animation.
         *
         * @param  {Object} scope directive's scope
         * @param  {Object} element    element reference; jquery wrapped
         * @param  {Object} attr  element's attributes
         */
        function link(scope, element) {
            const iframe = angular.element(`<iframe class="rv-resize-h"></iframe>`)[0];

            // Register our event when the iframe loads
            iframe.onload = function () {
                // The trick here is that because this iframe has 100% width
                // it should fire a window resize event when anything causes it to
                // resize (even scrollbars on the outer document)
                iframe.contentWindow.addEventListener('resize', evt => {
                    console.log(evt, element.width(), $(iframe).width());
                    scope.$emit('rv-resize', evt);
                    /*try {
                        var evt = document.createEvent('UIEvents');
                        evt.initUIEvent('resize', true, false, window, 0);
                        window.dispatchEvent(evt);
                    } catch (e) { }*/
                });
            };

            console.log(element, iframe);
            // Stick the iframe somewhere out of the way
            element.append(iframe);
        }
    }
})();
