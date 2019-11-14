/**
 * @module errorService
 * @memberof app.ui
 * @description
 *
 * The `errorService` factory handles the display of error toasts
 *
 */
angular.module('app.ui').factory('errorService', errorService);

function errorService($mdToast, $q) {
    const service = {
        display,
        remove
    };

    let errorToast = null;
    let errorQueue = [];

    return service;

    /**
     * Removes the toast notification from the view or the notification queue.
     *
     * @param {String | null} [id=null] id of the toast to remove; if not specified, the toast currently displayed will be removed
     * @param {Object} toastMsg is a promise object returned by the display function
     */
    function remove(id = null, toastMsg) {
        // if the current toast is not defined, the queue is empty; return
        if (!errorToast) {
            return;
        }

        // if the id is not supplied or is the same at the id of the currently displayed toast, remove the currently displayed toast
        if (id === null || errorToast.id === id) {
            $mdToast.hide(toastMsg);
            return;
        }

        // find a toast in the queue with the same id and remove it
        let index = errorQueue.findIndex(toast => toast.id === id);
        if (index !== -1) {
            errorQueue[index]._rejectDisplayPromise();
            errorQueue.splice(index, 1);
        }
    }

    /**
     * Adds error toast to the queue
     * Renders the toast if there's no visible toast
     *
     * @function display
     * @param {Object} opts toast options object; see https://material.angularjs.org/latest/api/service/$mdToast for details; additional parameter of `id` can be supplied, so later the toast can be deleted from the queue if desired
     * @return {Promise} resolving when the toast is hidden
     */
    function display(opts) {
        // since toast meesages can be queued, need to create a deferred (:cringe:) promise to return right away
        // this will be resolved when the corresponding toast is displayed passing back whatever value was used to resolve it
        opts._displayPromiseHandle = $q((resolve, reject) => {
            opts._resolveDisplayPromise = resolve;
            opts._rejectDisplayPromise = reject;
        });

        let lastError = errorQueue[errorQueue.length - 1];
        // add the toast to the queue if it doesn't have the same content as the one before it
        if (!lastError || lastError.textContent !== opts.textContent) {
            errorQueue.push(opts);
        }

        // if there's no visible toast render this one
        if (!errorToast) {
            return _render(opts);
        } else {
            return opts._displayPromiseHandle;
        }
    }

    /**
     * Renders a toast message containing the supplied errorMsg
     *
     * @function _render
     * @param {Object} opts toast options object; see https://material.angularjs.org/latest/api/service/$mdToast for details
     * @return {Promise} resolving when the toast is hidden
     */
    function _render(opts) {
        errorToast = opts;

        // if there's a toast to render create and render it
        if (errorToast) {
            const extendedOpts = angular.extend(
                {},
                {
                    position: 'bottom rv-flex-global'
                },
                opts
            );

            $mdToast.show($mdToast.simple(extendedOpts)).then(data => {
                // resolve the promise (passing along the actual toast resolve data) returned to the outside code when `display` function was called
                opts._resolveDisplayPromise(data);

                // on resolution of the promise render the next toast in queue
                errorQueue.shift();
                _render(errorQueue[0]);
            });

            // return toastPromise;
            return opts._displayPromiseHandle;
        }
    }
}
