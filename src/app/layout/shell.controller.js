/* global HolderIpsum */
(() => {
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

    function ShellController($timeout, $interval, configService, $rootScope, events, version, sideNavigationService,
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
            let display = stateManager.display.details;
            display.isLoading = true;
            display.data = generateDetailsData(1);

            // clears loading indicator
            $timeout(() => display.isLoading = false, Math.random() * 3000 + 300);

            console.log('single point', stateManager.display.details);

            stateManager.setActive({
                side: false
            }, 'mainDetails');
        }

        // TODO: remove; hacky functions to display some details data
        function multiplePoints() {
            let display = stateManager.display.details;
            display.isLoading = true;
            display.data = generateDetailsData(6);

            // stops loading indicator when all items are loaded
            let stop = $interval(function () {
                if (display.data.every(item => !item.isLoading)) {
                    console.log('STOP!');
                    display.isLoading = false;
                    $interval.cancel(stop);
                }
            }, 100);

            console.log('multiple point', stateManager.display.details);

            stateManager.setActive({
                side: false
            }, 'mainDetails');
        }

        // TODO: remove; hacky functions to display some details data
        function generateDetailsData(n) {
            let items = [];

            // generate garbage details
            for (let i = 0; i < n; i++) {
                let item = {
                    isLoading: true,
                    requestId: -1,
                    requester: HolderIpsum.words(3, true),
                    data: [
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

                // clears loading indicator for individual items
                $timeout(() => item.isLoading = false, Math.random() * 5000 + 200);

                items.push(item);
            }

            return items;
        }
    }

})();
