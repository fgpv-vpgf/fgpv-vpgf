(() => {

    /**
     * @module focusService
     * @memberof app.layout
     *
     * @description
     * The `focusService` service works as a UI-manager for the rest of the application. `focusService` exposes services for individual components that can be called.
     */
    angular
        .module('app.layout')
        .factory('focusService', focusService);

    function focusService($rootElement) {

        let allFocusables;
        let activeFocus;

        const service = {
            init
        };

        return service;

        function init() {

            $rootElement.on('keydown', event => {
                if (event.which === 9) {
                    event.preventDefault();
                    moveFocus(event.shiftKey);
                }
            });

            $rootElement.on('click', event => {
                console.debug(event);
            });
        }

        function moveFocus(reverse = false, updateFocusables = true) {

            if (updateFocusables) {
                allFocusables = $('button, a, input, [tabindex]');
            }

            let moveByValue = reverse ? -1 : 1;
            activeFocus = typeof activeFocus === 'undefined' ?
                0 :
                (activeFocus + moveByValue) % allFocusables.length;

            allFocusables[activeFocus].focus();
            return $(allFocusables[activeFocus]).is(':focus') ?
                allFocusables[activeFocus] :
                moveFocus(reverse, false);
        }

    }
})();
