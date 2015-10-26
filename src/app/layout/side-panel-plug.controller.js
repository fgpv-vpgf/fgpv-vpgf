(() => {

    /**
     * @ngdoc function
     * @name SidePanelPlugController
     * @module app.layout
     * @description
     *
     * The `SidePanelPlugController` controller handles the side panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the side panel plug when it's active. It's bound to a CSS class that prevents the plug view from occupying space when its content is not visible.
     */
    angular
        .module('app.layout')
        .controller('SidePanelPlugController', SidePanelPlugController);

    function SidePanelPlugController($state) {
        'ngInject';
        const self = this;

        self.active = true;
        self.closePanel = closePanel;

        ////////

        /**
         * Temporary function to close the side panel.
         * FIXME: this should be handled in the shatehelper
         */
        function closePanel() {
            let toState = $state.current.name.replace(/.side.*/, '');
            console.log('Closing side panel; going to', toState);
            $state.go(toState, {}, {
                location: false
            });
        }
    }
})();
