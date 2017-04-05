(() => {

    angular
        .module('app.ui.common')
        .directive('rvResize', rvResize);

    /**
     * `rvResize` directive body detects when the host element is resized and emits an event.
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
            scope.$watch(() => element.width(), (newValue, oldValue) => {
                scope.$emit('rv-resize', newValue, oldValue);
            });
        }
    }
})();
