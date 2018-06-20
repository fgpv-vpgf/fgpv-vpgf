angular.module('app.core').factory('shellService', shellService);

/**
 * ShellService keeps track of various loading processes which are used to derive the global loading state.
 * When added, individual processes have an option to display a notification message after the specified period of time and also allow for a user action
 * via the notification action button.
 *
 * @param {object} common common service
 * @param {object} errorService error notification service
 * @returns {object} shell service signature
 */
function shellService(common, errorService) {

    const service = {
        // returns `true` if at least one of the loading processes is active
        get isLoading() {
            return Object.values(service.loadingProcesses).some(process => process._state);
        },

        setLoadingFlag,
        clearLoadingFlag,
        loadingProcesses: {}
    };

    return service;

    /**
     * Adds a loading process to track. A loading process simply indicates that some lengthy work is being done and identifies this work by the process `id`.
     * A process can be added with an initial delay, so it can be promptly cancelled (if the process completes unexpectedly) before the global loading state has changed.
     * A option message with an optional action can be shown after a specified period of time has elapsed since the start of the loading process. The notification will
     * be hidden after `messageDuration` has passed or the process has been cleared.
     *
     * {id} [string] - id of the loading process; used to clear the loading process when it's completed
     * {initDelay} [number] [optional=0] - initial delay before the loading process is marked as "active"; this is a convenience so the caller code can avoid using timeouts; useful to avoid setting indicator for a small amounts of time
     * {messageDelay} [number] [optional=4000] - delay before the notification is displayed
     * {messageDuration} [number=0] - specifies how long the notifcation will be shown
     * {message} [string] [optional=''] - the text of the message to be displayed when the process is going on for longer than the `messageDelay` value
     * {action} [string] [optional=''] - the text of the toast action button; clicking on the action button closes the notification and resolves the returned promise; the caller code can wait on that promise to perform some action
     *
     * the following are private vars set by the service:
     * {_initDelayHandle} [object] - a handle to the initial delay timeout
     * {_state} [boolean] [=false] - the state of a loading process; the state is set to true after the `initDelay` has run out;
     * {_messageDelaylHandle} [object] - a handle to the message delay timeout
     * {_clearHandle} [object] - a handle to the clear delay timeout
     *
     *
     * @param {*} item a process object
     * @returns {Promise} a promise resolving when the action button on the notification is clicked or the notification is hidden
     */
    function setLoadingFlag(item) {
        // console.log('[]- set', item.id, item.initDelay, Object.values(service.loadingProcesses).map(p => ({ id: p.id, state: p._state })), service.isLoading);

        let process;

        // if the process exists, cancel its clear handle if exists (it could have been set by the `clearLoadingFlag` call with a delay)
        if (service.loadingProcesses[item.id]) {
            process = service.loadingProcesses[item.id];
            common.$timeout.cancel(process._clearHandle);

            return process._promiseHandle;
        }

        process = {
            initDelay: 0,
            messageDelay: 4000,
            messageDuration: 0,
            message: '',
            action: '',

            _state: false, // all processes start inactive
            _initDelayHandle: null,
            _messageDelaylHandle: null,

            ...item
        };

        // create a deferred promise to return to the caller code
        process._promiseHandle = common.$q(resolve => (process._resolvePromise = resolve));

        // store the process for tracking purposes
        service.loadingProcesses[process.id] = process;

        process._initDelayHandle = common.$timeout(() => {
            process = service.loadingProcesses[process.id];
            process._state = true; // mark the process as active

            // console.log( '[]- set complete', process.id, process.initDelay, Object.values(service.loadingProcesses).map(p => ({ id: p.id, state: p._state })), service.isLoading);

            // if there is no message, do not display a notification
            if (process.message === '') {
                return;
            }

            process._messageDelaylHandle = common.$timeout(() => {
                // console.log(`[]- process interval ${process.id}, ${process.messageDelay} ${process.initDelay} ${process.message}`);

                // create a notification toast
                // dispaly the toast and listen for it to close or be closed/removed
                errorService
                    .display({
                        id: process.id,
                        textContent: process.message,
                        action: process.action !== '' ? process.action : null,
                        hideDelay: process.messageDuration
                    })
                    .then(response => process._resolvePromise(response))
                    .catch(error => {}); // the toast is rejected when the loading process is cleared; catch all the rejections to avoid errors in the console
            }, process.messageDelay);
        }, process.initDelay);

        return process._promiseHandle;
    }

    /**
     * Clears the loading process with the supplied id, cancels all outstanding delays, and hides the corresponding notification is exists.
     *
     * @param {string} [id=null] id of the process to clear; if not supplied, all the processes will be cleared
     * @param {number} [delay=0] delay before the process is cleared; this is useful if a process tends to yo-yo between being active and inactive
     */
    function clearLoadingFlag(id = null, delay = 0) {
        // console.log('[]- clear', id, delay, Object.values(service.loadingProcesses).map(p => ({ id: p.id, state: p._state })), service.isLoading);

        //
        if (id === null) {
            errorService.remove();
            Object.keys(service.loadingProcesses).forEach(key => _clearProcess(key));
            return;
        }

        if (!service.loadingProcesses[id]) {
            return;
        }

        const process = service.loadingProcesses[id];
        process._clearHandle = common.$timeout(() => _clearProcess(id), delay);
    }

    /**
     * A helper function to clear a loading process
     *
     * @param {string} id id of the loading process to clear
     */
    function _clearProcess(id) {
        // if the process doesn't exist, be lazy
        if (!service.loadingProcesses[id]) {
            return;
        }

        const process = service.loadingProcesses[id];

        // resolve its promise with false, so the caller code can act on that
        process._resolvePromise(false);
        // remove the corresponding notification if displayed or in the queue
        errorService.remove(process.id);
        // cancel both initial and message timeouts
        common.$timeout.cancel(process._initDelayHandle);
        common.$timeout.cancel(process._messageDelaylHandle);
        delete service.loadingProcesses[id];

        // console.log('[]- clear complete', id, Object.values(service.loadingProcesses).map(p => ({ id: p.id, state: p._state })), service.isLoading);
    }
}
