/* global RV */

/**
 * @module displayManager
 * @memberof app.common
 * @requires dependencies
 * @description
 *
 * The `displayManager` factory handles the display of dynamically retrieved or constructed data like layer metadata, attributes, details, or settings.
 *
 */
angular
    .module('app.core')
    .factory('displayManager', displayManager);

function displayManager($timeout, $q, $rootElement) {
    const service = {
        toggleDisplayPanel,
        clearDisplayPanel
    };
    let stateManager;
    let requestIdCounter = 1;

    // to avoid circular references, stateManger instantiates displayManager by passing its own service to the init function
    return sm => {
        stateManager = sm;

        return service;
    };

    /*********/

    /**
     * Toggles the specified panel with following logic:
     * ```
     * The requested panel can be open or closed;
     *     open:
     *         the content already in the panel can belong to a different layer
     *             same layer:
     *                 -> close panel
     *             different layer:
     *                 -> dehighlight the the old layer; highlight the new one
     *     closed:
     *         -> open panel
     * ```
     *
     * If the panel is not closing, a loading indicator will be triggered (immediately or after a delay).
     *
     * There are three options for passing data into the panel:
     * 1. Data is a plain (synchronous) object (use this if the data does not have to be fetched).
     *    In this case the isLoaded property does not need to be supplied and the panel will not show any indicator.
     * 2. Data is a Promise which resolves to a simple object in the form `{data: {}}`.
     *    A loading indicator will be displayed when the Promise is resolved or rejected.
     * 3. Data is a Promise which resolves to an object in the form `{ data: {}, isLoaded: <Promise> }`.
     *    The loading indicator will be triggered by the resolution of isLoaded.  It is recommended to use this as
     *    a signal when data will be an array of points (e.g. resolving clicks on multiple layers), or in other cases
     *    where data may be updated in multiple steps.
     * Avoid sending a synchronous value in the form `{ data, isLoaded: false }`.  Generally if you can set isLoaded
     * to true this could be better represented as a Promise object (but we do have a few edge cases where this may
     * not hold).
     *
     * @function toggleDisplayPanel
     * @param  {String} panelName        panel to open; `statemanager.constant.service` `initialState` for valid panel names; any panel with a `display` property is a valid target;
     * @param  {Object} dataPromise      data object or a promise returning a data object; both can be plain data object or containers `{data: data, isLoaded: <boolean|promise> }`, where isLoaded can be a promise;
     * @param  {Object} requester        an optional object requesting display change; must have `id` attribute if you want the panel to toggle off on the same requester; requester object can be used to immediately pass content to the panel - for example passing layer name to the table panel to be displayed in the panel header while the datatable is being constructed;
     * @param  {Number} delay            an optional time to wait (in milliseconds) before setting loading indicator
     * @return {Object} promise          resolves as undefined iff panel data has resolved, rejects otherwise.
     */
    function toggleDisplayPanel(panelName, dataPromise, requester = {}, delay = 100) {
        const state = stateManager.state[panelName];
        const displayName = state.display;

        if (typeof displayName === 'undefined') {
            return $q.reject(); // display for this panel is not defined, exit
        }

        const display = stateManager.display[displayName];
        const requestId = ++requestIdCounter;
        // if specified panel is open ...
        // and the requester id is not undefined or matches to the previous requester id ...
        if (state.active &&
            typeof requester.id !== 'undefined' &&
            display.requester.id === requester.id) {

            return stateManager.setActive(panelName);
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
            let animationPromise = $q.resolve();

            if (!state.active) { // panel is not open; open it
                display.data = null; // clear data so the newly opened panel doesn't have any content
                animationPromise = stateManager.setActive(panelName);
            }

            // whenever a panel is opened (or updated) create a focus link between the element which triggered the
            // panel change to the first focusable element in the panel.
            animationPromise.then(() => {
                const sourceEl = $rootElement.find(`[legend-block-id="${requester.id}"] button`).filter(':visible').first();
                $(sourceEl).link($rootElement.find(`[rv-state="${panelName}"]`));
            });

            // update requestId and the requester object
            display.requester = requester;
            display.requestId = requestId;
            return $q
                .resolve(dataPromise)
                .then(value => {
                    const data = typeof value.data !== 'undefined' ? value.data : value;
                    const isLoaded = typeof value.isLoaded !== 'undefined' ? value.isLoaded : true;

                    setDisplay(panelName, requestId, data, isLoaded);
                })
                .catch(err => {
                    $timeout.cancel(display.loadingTimeout);
                    display.isLoading = false;
                    throw err;
                });
        }
    }

    /**
     * Sets displayed data for a specific content like layer metadata in the metadata panel. It checks against the provided requestId, if the id matches, the data is set and the loading indidcator is turned off.
     *
     * @function setDisplay
     * @param {String} panelName     name of the panel where to update displayed content
     * @param {Number} requestId     request id to check if it's the latest request
     * @param {Object} data          data to be displayed
     * @param {Boolean|Promise} isLoaded     flag to remove loading indicator from the panel; if `false` (or resolves to `false`), don't remove the flag;
     */
    function setDisplay(panelName, requestId, data, isLoaded) {
        const state = stateManager.state[panelName];
        const displayName = state.display;

        if (typeof displayName === 'undefined') {
            return -1; // display for this panel is not defined, exit
        }

        const display = stateManager.display[displayName];

        // check if the layerId for displayed data still matches data being retrieved
        // this prevents old request which complete after the newer ones to update display with old data
        // data can be set on the closed panel, see fgpv-vpgf/fgpv-vpgf#308
        if (display.requestId === requestId) {
            display.data = data;

            // in some cases you might not want to turn off the loading indicator from tocService toggle function
            // with the table panel for example: fetching data for the table takes time, but generating the actual table also takes time; so you want to turn off the loading indicator from table panel
            // when `isLoaded` promise resolves, the loading indicator is removed if the resolved value is not false
            $q
                .resolve(isLoaded)
                .then(value => {
                    if (display.requestId === requestId && value === true) {
                        display.isLoading = false;

                        // cancel loading indicator timeout if any
                        $timeout.cancel(display.loadingTimeout);
                    } else {
                        console.log('displayManager', `${displayName}: data rejected for request id ` +
                            `${requestId} - any loading in progress or panel has been closed.`);
                    }
                });
        } else {
            console.log('displayManager', `${displayName}: data rejected for request id ${requestId} - ` +
                `any loading in progress or panel has been closed.```);
        }
    }

    /**
     * Clears data from the specified display.
     * @function clearDisplayPanel
     * @param  {String} panelName the name of the panel whose display should be cleared
     */
    function clearDisplayPanel(panelName) {
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
}
