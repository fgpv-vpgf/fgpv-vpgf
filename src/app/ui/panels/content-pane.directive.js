(() => {

    /**
     * @ngdoc directive
     * @name rvContentPane
     * @module app.ui.panels
     * @description
     *
     * The `rvContentPane` directive is a panel inner container holding the panel's content.
     *
     */
    angular
        .module('app.ui.panels')
        .directive('rvContentPane', rvContentPane);

    /**
     * `rvContentPane` directive body.
     *
     * @return {object} directive body
     */
    function rvContentPane() {
        const directive = {
            restrict: 'E',
            require: '^rvPanel', // require plug controller
            templateUrl: 'app/ui/panels/content-pane.html',
            scope: {
                titleValue: '@', // binds to the evaluated dom property
                titleStyle: '@'
            },
            transclude: true,
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Binds the `closePanel` method from the panel plug controller.
         */
        function link(scope, el, attr, ctrl) {
            const self = scope.self;
            self.closePanel = ctrl.closePanel;
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {

        //const self = this;

        activate();

        function activate() {

        }
    }
})();
