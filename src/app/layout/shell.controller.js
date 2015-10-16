(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name ShellController
     * @module app.layout
     * @description
     *
     * The `ShellController` controller handles the shell which is the visible part of the layout.
     * `self.isLoading` is initially `true` and causes the loading overlay to be displayed; when `configService` resolves, it's set to `false` and the loading overly is removed.
     */
    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    /* @ngInject */
    /**
     * `ShellController`.
     *
     * `self.config`
     * `self.isLoading` is bouding to a loading overlay
     * `self.$state` binds state name to the attribute on the shell's root node; can be used in CSS selectors/
     *
     * @param {object} configService
     * @param {object} $state
     */
    function ShellController(configService, $state) {
        const self = this;

        self.config = configService.data;
        self.isLoading = true;
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

        /**
         * Controller's activate function.
         */
        function activate() {
            configService.ready()
                .then(hideLoadingScreen);
        }

        /**
         * Sets `self.isLoading` to false which hides the loading overlay.
         */
        function hideLoadingScreen() {
            self.isLoading = false;
        }
    }

})();
