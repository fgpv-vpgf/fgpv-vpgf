(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name initialState
     * @module app.common.router
     * @description
     *
     * The `initialState` constant service provides default stateManager state values.
     */
    /**
     * @ngdoc service
     * @name initialDisplay
     * @module app.common.router
     * @description
     *
     * The `initialDisplay` constant service provides default stateManager display value.
     */
    angular
        .module('app.common.router')
        .constant('initialState', {
            // `service.state` holds the state of the panel and content panes;
            // `active` indicates whether the panel/pane is open/visible or not;
            // `activeSkip` is a boolean flag indicating whether the animation on changes to the `active` should be skipped
            // `parent` links a pane to its parent panel; main panel can display three panes, for example, toc, toolbox, and details; only one pane can be active at a time;
            // `morph` indicates the mode of the panel; filters panel has three different modes: 'full', 'default', and 'minimized'; filters panel's modes specify different height for the panel; its changes are also animated;
            // `morphSkip` is a boolean flag indicating whether the animation on changes to the `morph` should be skipped
            // `history` keeps track of pane names opened in a panel; limit of 10 items;

            main: {
                active: false,
                activeSkip: false, // flag for skipping animation
                history: []
            },
            mainToc: {
                active: false,
                activeSkip: false,
                parent: 'main'
            },
            mainToolbox: {
                active: false,
                activeSkip: false,
                parent: 'main'
            },
            mainDetails: {
                active: false,
                activeSkip: false,
                parent: 'main'
            },
            side: {
                active: false,
                activeSkip: false,
                history: []
            },
            sideMetadata: {
                active: false,
                activeSkip: false,
                parent: 'side'
            },
            sideSettings: {
                active: false,
                activeSkip: false,
                parent: 'side'
            },
            filters: {
                active: false,
                activeSkip: false,
                morph: 'default', // minimized, full,
                morphSkip: false,
                history: []
            },
            filtersFulldata: {
                active: false,
                activeSkip: false,
                parent: 'filters'
            },
            filtersNamedata: {
                active: false,
                activeSkip: false,
                parent: 'filters'
            },
            other: {
                active: false,
                activeSkip: false,
                history: []
            },
            otherBasemap: {
                active: false,
                activeSkip: false,
                parent: 'other'
            },
            mapnav: {
                morph: 'default',
                morphSkip: false
            },
            help: {
                active: false
            }
        })
        .constant('initialDisplay', {
            // TODO: add a unit test to check mapping between display options and layer toggles
            // `service.display` holds data to be displayed in metadata, details, filters, and settings panes;
            // `isLoading` is a boolean flag to be bound to `isLoading` property on `contentPane` directive; setting it to 'true', will display a loading indicator and hide pane's content; `false` reverse that;
            // `layerId` is the id of the layer which data is being displayed; used for check that the requested data is still required in case of async calls;
            // `data` is a data object to be displayed in the content pane;

            filters: {
                isLoading: false,
                layerId: -1,
                data: {
                    columns: null,
                    data: null
                }
            },
            metadata: {
                isLoading: false,
                layerId: -1,
                data: null
            },
            settings: {
                isLoading: false,
                layerId: -1,
                data: null
            }
        });
})();
