(() => {

    /**
     * @ngdoc directive
     * @name rvSidePanel
     * @module app.ui.panels
     * @description
     *
     * The `rvSidePanel` directive is an side panel outter container with a content plug view to allow for different content to be displayed.
     */
    angular
        .module('app.ui.panels')
        .directive('rvSidePanel', rvSidePanel);

    /**
     * `rvSidePanel` directive body.
     * @return {object} directive body
     */
    function rvSidePanel() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/panels/side-panel.html',
            scope: {},
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Skeleton link function.
         */
        function linkFunc() { //scope, el, attr, ctrl) {

        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {
        //const self = this;

        activate();

        //////////

        function activate() {

        }
    }
})();
