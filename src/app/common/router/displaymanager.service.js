(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name displayManager
     * @module app.common.router
     * @requires dependencies
     * @description
     *
     * The `displayManager` factory description.
     *
     */
    angular
        .module('app.common.router')
        .factory('displayManager', displayManager);

    function displayManager($timeout, $rootScope, stateManager) {
        const service = {
            toggleDisplayPanel,
            setDisplayData
        };

        let requestIdCounter = 1;

        activate();

        return service;

        ///////////

        /**
         * Toggles panel specified with following logic:
         * The requested panel can be open or closed;
         *     open:
         *         the content alredy in the panel can belong to a differen layer
         *             same layer:
         *                 -> close panel
         *             different layer:
         *                 -> dehighlight the the old layer; highlihgt the new one
         *     closed:
         *         -> open panel
         *
         * @param  {String} panelName        panel to open
         * @param  {Object} requester        object requesting display change; must have `id` attribute
         * @param  {String} panelNameToClose name of the panel to close before opening the main one if needed
         * @param  {Number} delay            time to wait before setting loading indicator
         * @return {Number} return a data requestId; if equals -1, the panel will be closed, no further actions needed; otherwise, the panel will be opened
         */
        function toggleDisplayPanel(panelName, requester, panelNameToClose, delay = 100) {
            console.log(panelName, requester, panelNameToClose, delay);
            const displayName = stateManager.state[panelName].display;
            if (typeof displayName === 'undefined') {
                return -1; // display for this panel is not defined, exit
            }

            // if specified panel is open and the requester matches
            if (stateManager.state[panelName].active &&
                stateManager.display[displayName].requester.id === requester.id) {
                stateManager.setActive(panelName); // just close the panel

                return -1;
            } else {
                // cancel previous data retrieval timeout so we don't display old data
                $timeout.cancel(stateManager.display[displayName].loadingTimeout);

                if (delay === 0) {
                    stateManager.display[displayName].isLoading = true;
                } else {
                    // if it takes longer than 100 ms to get metadata, kick in the loading screen
                    // this is fast enough for people to perceive it as instantaneous
                    stateManager.display[displayName].loadingTimeout = $timeout(() => {
                        stateManager.display[displayName].isLoading = true;
                    }, delay);
                }

                if (!stateManager.state[panelName].active) { // panel is not open; open it; close other panels is specified
                    // open panel closing anything else specified
                    if (panelNameToClose) {
                        let closePanel = {};
                        closePanel[panelNameToClose] = false;
                        stateManager.setActive(closePanel, panelName);
                    } else {
                        stateManager.setActive(panelName);
                    }
                }

                // update requestId and the requester object
                stateManager.display[displayName].requester = requester;
                stateManager.display[displayName].requestId = ++requestIdCounter;

                return requestIdCounter;
            }
        }

        /**
         * Sets displayed data for a specific content like layer metadata in the metadata panel.
         *
         * @param {String} panelName     name of the panel where to update displayed content
         * @param {Number} requestId     request id
         * @param {Object} data          data to be displayed
         * @param {Boolean} isLoaded     flag to remove loading indicator from the panel
         */
        function setDisplayData(panelName, requestId, data, isLoaded) {
            const displayName = stateManager.state[panelName].display;
            if (typeof displayName === 'undefined') {
                return -1; // display for this panel is not defined, exit
            }

            // check if the layerId for displayed data still matches data being retrieved
            // this prevents old request which complete after the newer ones to update display with old data
            if (stateManager.display[displayName].requestId === requestId) {
                stateManager.display[displayName].data = data;

                // in some cases you might not want to turn off the loading indicator from tocService toggle function
                // with the filters panel for example: fetching data for the table takes time, but generating the actual table also takes time; so you want to turn off the loading indicator from filters panel
                if (isLoaded === true) {
                    stateManager.display[displayName].isLoading = false;

                    // cancel loading indicator timeout if any
                    $timeout.cancel(stateManager.display[displayName].loadingTimeout);
                }
            } else {
                console.log(displayName + ' Data rejected for request id ' + requestId +
                    '; loading in progress');
            }
        }

        function activate() {
            // listen to panels closing; set their corresponding displays to null when they close
            $rootScope.$on('stateChangeComplete', (event, name, property, value) => {
                const displayName = stateManager.state[name].display;

                if (typeof displayName !== 'undefined' && value === false) {
                    //console.log('displayName', displayName, stateManager.display[displayName]);

                    // null data, and requester info on child panel close
                    stateManager.display[displayName].data = null;
                    stateManager.display[displayName].requester = null;
                    stateManager.display[displayName].requestId = null;
                }
            });
        }
    }
})();
