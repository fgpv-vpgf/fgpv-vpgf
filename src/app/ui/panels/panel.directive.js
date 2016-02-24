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
        .directive('rvPanel', rvPanel);

    /**
     * `rvPanel` directive body.
     *
     * @return {object} directive body
     */
    function rvPanel(layoutService) {
        const directive = {
            restrict: 'E',
            templateUrl: function (element, attr) {
                return 'app/ui/panels/' + attr.type + '-panel.html';
            },
            scope: {
                closeButton: '@closeButton'
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;


        /*********/

        function link(scope, el, attr) { // , ctrl) {
            // register panel with layoutService
            layoutService.panels[attr.type] = {
                node: el
            };
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller($attrs, stateManager) {
        'ngInject';
        const self = this;

        self.closePanel = self.closeButton !== 'false' ? closePanel : undefined;

        /**
         * Temporary function to close the panel.
         * FIXME: this should be handled in the shatehelper
         */
        function closePanel() {
            stateManager.setActive($attrs.type);
        }

        activate();

        /********/

        function activate() {
        }
    }
})();
