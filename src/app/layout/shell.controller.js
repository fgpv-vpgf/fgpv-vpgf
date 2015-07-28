(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    ShellController.$inject = ['layoutConfig'];

    function ShellController(layoutConfig) {
        var vm = this;

        vm.config = layoutConfig;
        vm.isLoading = true;

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
