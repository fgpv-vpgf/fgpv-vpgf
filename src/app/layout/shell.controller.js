(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    /* @ngInject */
    function ShellController(layoutConfig, rvSideNavigationService) {
        var vm = this;

        vm.config = layoutConfig;
        vm.isLoading = true;
        vm.rvSideNavigationService = rvSideNavigationService;

        vm.menu = [
            {
                name: 'Options',
                type: 'heading',
                children: [
                    {
                        name: 'Full Screen',
                        type: 'link'
                    },
                    {
                        name: 'Share',
                        type: 'link'
                    },
                    {
                        name: 'Print',
                        type: 'link'
                    }
                ]
            },
            {
                name: 'About',
                type: 'link'
            },
            {
                name: 'Help',
                type: 'link'
            }
        ];

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
