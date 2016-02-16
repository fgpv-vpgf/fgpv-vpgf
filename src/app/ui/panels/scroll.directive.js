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
            var iframe = document.createElement('iframe');
            iframe.id = 'sdfs';
            iframe.style.cssText = `height: 0; background-color: transparent; margin: 0; padding: 0;
            overflow: hidden; border-width: 0; position: absolute; width: 100%;`;

            // Register our event when the iframe loads
            iframe.onload = function () {
                // The trick here is that because this iframe has 100% width
                // it should fire a window resize event when anything causes it to
                // resize (even scrollbars on the outer document)
                iframe.contentWindow.addEventListener('resize', evt => {
                    console.log(evt, element.width(), $(iframe).width());
                    scope.$emit('pane-resize', evt);
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
