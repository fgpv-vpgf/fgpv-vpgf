(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    /* @ngInject */
    function ShellController(configService, layoutService, $state) {
        var self = this;

        self.config = configService.data;
        self.isLoading = true;
        self.layoutService = layoutService;
        self.$state = $state;

        // TODO: mock settings; replace by config
        self.menu = [
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
            self.isLoading = false;
        }
    }

})();
