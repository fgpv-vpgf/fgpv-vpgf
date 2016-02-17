(() => {

    angular
        .module('app.ui.common')
        .directive('rvResize', rvResize);

    /**
     * `rvResize` directive body detects when the host element is resized and emits an event.
     * Inspired by https://github.com/wnr/element-resize-detector/blob/master/src/detection-strategy/object.js
     * and https://gist.github.com/OrganicPanda/8222636
     *
     * @return {object} directive body
     */
    function rvResize() {
        const directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        /**
         * Directive's link function.
         *
         * @param  {Object} scope directive's scope
         * @param  {Object} element    element reference; jquery wrapped
         * @param  {Object} attr  element's attributes
         */
        function link(scope, element) {

            scope.$watch(() => element.width(), (oldValue, newValue) => {
                console.log('wathc', oldValue, newValue);
                scope.$emit('rv-resize', oldValue, newValue);
            });

            return;
            const object = document.createElement("object");

            object.className = 'rv-resize-h'
            object.type = 'text/html';
            object.data = 'about:blank';

            let oldValue = {};
            let newValue = {};

            // Register our event when the object loads
            object.onload = function () {
                // The trick here is that because this object has 100% width
                // it should fire a window resize event when anything causes it to
                // resize (even scrollbars on the outer document)

                oldValue = {
                    width: element.width(),
                    height: element.height()
                };

                //scope.$emit('rv-resize', oldValue, oldValue);
                //console.log('init what?', oldValue);

                object.contentDocument.defaultView.addEventListener('resize', evt => {
                    newValue = {
                        width: element.width(),
                        height: element.height()
                    };

                    console.log('what?', evt, element.width(), $(object)
                        .width());
                    scope.$emit('rv-resize', oldValue, newValue, evt);

                    oldValue = newValue;
                });
            };

            // Stick the object somewhere out of the way
            element.after(object);
        }
    }
})();
