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

    function ShellController($timeout, $interval, $q, configService, $rootScope, events, version,
        sideNavigationService,
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
            // generate some data and pretend you are retrieving it
            const dataPromise = $timeout(() => {
                return generateDetailsData(1)
                    .items;
            }, Math.random() * 3000 + 300);

            // open panel and prep;
            stateManager.toggleDisplayPanel('mainDetails', dataPromise);
        }

        // TODO: remove; hacky functions to display some details data
        function multiplePoints() {
            const requester = {
                id: Date.now()
            };

            const {
                items,
                promises
            } = generateDetailsData(6);

            // open panel and prep;
            stateManager
                .toggleDisplayPanel('mainDetails', {
                    data: items,
                    isLoaded: $q.all(promises).then(() => true)
                }, requester, 0);
        }

        // TODO: remove; hacky functions to display some details data
        function generateDetailsData(n) {
            const items = [];
            const promises = [];

            // generate garbage details
            for (let i = 0; i < n; i++) {
                let item = {
                    isLoading: true,
                    requestId: -1,
                    requester: HolderIpsum.words(3, true),
                    data: {}
                };

                // clears loading indicator for individual items
                promises.push($timeout(() => {
                    item.data = [
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence(), HolderIpsum.sentence(),
                                HolderIpsum.sentence()]
                        },
                        {
                            name: HolderIpsum.words(3, true),
                            data: [HolderIpsum.sentence(), HolderIpsum.sentence()]
                        }
                    ];
                    item.isLoading = false;
                }, n === 1 ? 0 : Math.random() * 5000 + 200));

                items.push(item);
            }

            return {
                items,
                promises
            };
        }
    }

})();
