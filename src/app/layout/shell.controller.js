/* global HolderIpsum */
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

    function ShellController(configService, $rootScope, events, version, sideNavigationService,
            stateManager) {
        const self = this;

        self.config = configService.data;
        self.isLoading = true;
        self.version = version;

        self.singlePoint = singlePoint;
        self.multiplePoints = multiplePoints;

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
                type: 'link',
                action: () => {
                    sideNavigationService.close();
                    stateManager.setActive('help');
                    console.log('Halp!');
                }
            }
        ];

        activate();

        ////////////////

        /**
         * Controller's activate function.
         */
        function activate() {
            $rootScope.$on(events.rvReady, hideLoadingScreen);
        }

        /**
         * Sets `self.isLoading` to false which hides the loading overlay.
         */
        function hideLoadingScreen() {
            self.isLoading = false;
        }

        // TODO: remove; hacky functions to display some details data
        function singlePoint() {
            stateManager._detailsData.layers = generateDetailsData(1);

            stateManager.setActive({
                side: false
            }, 'mainDetails');
        }

        // TODO: remove; hacky functions to display some details data
        function multiplePoints() {
            stateManager._detailsData.layers = generateDetailsData(6);

            stateManager.setActive({
                side: false
            }, 'mainDetails');
        }

        // TODO: remove; hacky functions to display some details data
        function generateDetailsData(n) {
            let layers = [];

            // generate garbage details
            for (let i = 0; i < n; i++) {
                let layer = {
                    name: HolderIpsum.words(3, true),
                    type: 'something',
                    items: [
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence(), HolderIpsum.sentence(),
                                HolderIpsum.sentence()]
                        },
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence()]
                        }
                    ]
                };

                layers.push(layer);
            }

            return layers;
        }
    }

})();
