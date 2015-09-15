(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    /* @ngInject */
    function ShellController(configService, layoutService) {
        var vm = this;

        vm.config = configService.data;
        vm.isLoading = true;
        vm.layoutService = layoutService;

        // TODO: mock settings; replace by config
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
            configService.ready()
                .then(hideLoadingScreen);
        }

        function hideLoadingScreen() {
            vm.isLoading = false;
        }
    }

})();
