(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    ShellController.$inject = ['layoutConfig', 'rvSideNavigationService'];

    function ShellController(layoutConfig, rvSideNavigationService) {
        var vm = this;

        vm.config = layoutConfig;
        vm.isLoading = true;
        vm.rvSideNavigationService = rvSideNavigationService;

        activate();

        ////////////////

        function activate() {
            layoutConfig.ready()
                .then(hideLoadingScreen);
        }

        function hideLoadingScreen() {
            vm.isLoading = false;
        }
    }

})();
