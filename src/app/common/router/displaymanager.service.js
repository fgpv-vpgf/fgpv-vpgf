(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name displayManager
     * @module app.common.router
     * @requires dependencies
     * @description
     *
     * The `displayManager` factory handles the display of dynamically retrived or constructed data like layer metadata, attributes, details, or settings.
     *
     */
    angular
        .module('app.common.router')
        .factory('displayManager', displayManager);

    function displayManager($timeout, $q, $rootScope) {
        const service = {
            toggleDisplayPanel,
            setDisplayData
        };
        let stateManager;
        let requestIdCounter = 1;

        // to avoid circular references, stateManger instantiates displayManager by passing its own service to the init function
        return sm => {
            stateManager = sm;

            activate();

            return service;
        };

        ///////////

        /**
         * Toggles the specified panel with following logic:
         * The requested panel can be open or closed;
         *     open:
         *         the content alredy in the panel can belong to a different layer
         *             same layer:
         *                 -> close panel
         *             different layer:
         *                 -> dehighlight the the old layer; highlihgt the new one
         *     closed:
         *         -> open panel
         *
         * If the panel is not closing, a loading indicator will be triggered (immediately or after a delay).
         *
         * @param  {String} panelName        panel to open
         * @param  {Object} dataPromise        object requesting display change; must have `id` attribute
         * @param  {Number} delay            time to wait before setting loading indicator
         * @return {Number} return a data requestId; if equals -1, the panel will be closed, no further actions needed; otherwise, the panel will be opened
         */
        function toggleDisplayPanel(panelName, dataPromise, requester = {}, delay = 100) {
            //function toggleDisplayPanel(panelName, requester, panelNameToClose, delay = 100) {
            const state = stateManager.state[panelName];
            const displayName = state.display;

            if (typeof displayName === 'undefined') {
                return -1; // display for this panel is not defined, exit
            }

            const display = stateManager.display[displayName];
            const requestId = ++requestIdCounter;

            console.log(requester, typeof requester.id !== 'undefined', delay);

            // if specified panel is open ...
            // and the requester id is not undefined or matches to the previous requester id ...
            if (state.active &&
                typeof requester.id !== 'undefined' &&
                display.requester.id === requester.id) {
                stateManager.setActive(panelName); // just close the panel

                return -1;
            } else {
                // cancel previous data retrieval timeout
                $timeout.cancel(display.loadingTimeout);

                if (delay === 0) {
                    display.data = null;
                    display.isLoading = true;
                } else {
                    // if it takes longer than 100 ms to get metadata, kick in the loading screen
                    // this is fast enough for people to still perceive it as instantaneous;
                    // waiting 100ms before showing loading indicator prevents flickering if data is retrieved really fast
                    display.loadingTimeout = $timeout(() => {
                        display.data = null;
                        display.isLoading = true;
                    }, delay);
                }

                if (!state.active) { // panel is not open; open it; close other panels is specified
                    // open panel closing anything else specified
                    /*if (panelNameToClose) {
                        let closePanel = {};
                        closePanel[panelNameToClose] = false;
                        stateManager.setActive(closePanel, panelName);
                    } else {*/
                    stateManager.setActive(panelName);

                    //}
                }

                // update requestId and the requester object
                display.requester = requester;
                display.requestId = requestId;

                //return requestIdCounter;
                /*return $q((fulfill, reject) => {

                });*/

                return $q
                    .resolve(dataPromise)
                    .then(value => {
                        const data = typeof value.data !== 'undefined' ? value.data : value;
                        const isLoaded = typeof value.isLoaded !== 'undefined' ? value.isLoaded : true;

                        setDisplayData(panelName, requestId, data, isLoaded);
                    })
                    .catch(value => {
                        console.log('error retrieving data apparently', value);
                    });
            }
        }

        /**
         * Sets displayed data for a specific content like layer metadata in the metadata panel. It checks agains the provided requestId, if the id matches, the data is set and the loading indidcator is turned off.
         *
         * @param {String} panelName     name of the panel where to update displayed content
         * @param {Number} requestId     request id
         * @param {Object} data          data to be displayed
         * @param {Boolean} isLoaded     flag to remove loading indicator from the panel
         */
        function setDisplayData(panelName, requestId, data, isLoaded) {
            const state = stateManager.state[panelName];
            const displayName = state.display;

            if (typeof displayName === 'undefined') {
                return -1; // display for this panel is not defined, exit
            }

            const display = stateManager.display[displayName];

            // check if the layerId for displayed data still matches data being retrieved
            // this prevents old request which complete after the newer ones to update display with old data
            // `state.active` check makes sure data is not set when the panel is closed
            if (display.requestId === requestId && state.active === true) {
                display.data = data;

                // in some cases you might not want to turn off the loading indicator from tocService toggle function
                // with the filters panel for example: fetching data for the table takes time, but generating the actual table also takes time; so you want to turn off the loading indicator from filters panel
                // when `isLoaded` promise resolves, the loading indicator is removed no matter the resolve value
                $q
                    .resolve(isLoaded)
                    .then(value => {
                        if (display.requestId === requestId && state.active === true) {
                            display.isLoading = false;

                            // cancel loading indicator timeout if any
                            $timeout.cancel(display.loadingTimeout);
                        } else {
                            console.log(displayName + ' Data rejected for request id ' + requestId +
                                '; loading in progress or panel is closed');
                        }
                    });
            } else {
                console.log(displayName + ' Data rejected for request id ' + requestId +
                    '; loading in progress or panel is closed');
            }
        }

        /**
         * Clears data from the specified display.
         * @param  {String} panelName the name of the panel whose display should be cleared
         */
        function clearDisplay(panelName) {
            // TODO: the following 4 statements could be moved to a helper function
            const state = stateManager.state[panelName];
            const displayName = state.display;

            if (typeof displayName === 'undefined') {
                return -1; // display for this panel is not defined, exit
            }

            const display = stateManager.display[displayName];

            display.data = null;
            display.requester = null;
            display.requestId = null;
            display.isLoading = false;
            $timeout.cancel(display.loadingTimeout);
        }

        function activate() {}
    }
})();
