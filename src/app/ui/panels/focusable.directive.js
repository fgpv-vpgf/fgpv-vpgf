(() => {

    /**
     * @ngdoc directive
     * @name rvFiltersPanel
     * @module app.ui.panels
     * @description
     *
     * The `rvPanel` directive is reused by all the core panels of the viewer; main, side and filters.
     *
     * HTML example:
     * <rv-panel type="main" close-button="false"></rv-panel>
     */
    angular
        .module('app.ui.panels')
        .directive('rvFocusable', rvFocusable);

    /**
     * `rvPanel` directive body.
     *
     * @return {object} directive body
     */
    function rvFocusable(stateManager) {
        const directive = {
            restrict: 'A',
            link
        };

        return directive;

        function link(scope, element) {
            stateManager.setFocusElement(element);
        }
    }
})();
