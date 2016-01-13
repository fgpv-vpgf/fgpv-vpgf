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
    function rvMapnavButton(mapNavigationService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/mapnav/mapnav-button.html',
            scope: {
                name: '@' // get the name of the control object to fetch
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
        function linkFunc(scope) { // el, attr, ctrl) {
            const self = scope.self;

            // getting toggle object from the navigation servcie directly using toggle's name
            self.control = mapNavigationService.controls[self.name];
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
