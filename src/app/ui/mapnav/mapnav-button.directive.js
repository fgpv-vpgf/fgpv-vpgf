(() => {

    /**
     * @ngdoc directive
     * @name rvMapnavButton
     * @module app.ui.mapnav
     * @description
     *
     * The `rvMapnavButton` directive is a map navigation component button.
     *
     */
    angular
        .module('app.ui.mapnav')
        .directive('rvMapnavButton', rvMapnavButton);

    /**
     * `rvMapnavButton` directive body.
     *
     * @return {object} directive body
     */
    function rvMapnavButton() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/mapnav/mapnav-button.html',
            scope: {
                control: '=' // binds `control` attribute to the scope;
            },
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
        //var self = this;

        ///////////

        activate();

        function activate() {

        }
    }
})();
