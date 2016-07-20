(() => {

    /**
     * @module focusService
     * @memberof app.layout
     *
     * @description
     * `focusService` manages element focus support across the application.
     */
    angular
        .module('app.layout')
        .factory('focusService', focusService);

    function focusService($rootElement, $timeout) {
        // last known element with focus that is a descendent of $rootElement
        let activeFocus;

        let linkedList = [];
        let focusHistory = [];

        // prevents infinite looping when setting focus from within focusin/focusout listeners
        let lockFocus = false;

        // tracks focus directional movement
        let isForward = true;

        let lastFocusElement;

        init();

        const service = {
            createLink,
            setPanelFocus,
            setFocusElement,
            previousFocus
        };

        return service;

        /**
         * Initializes the service, sets event listeners on $rootElement
         * @function init
         */
        function init() {
            $rootElement.on('keydown', event => {
                // detect focus direction is reversed
                isForward = event.which === 9 ? !event.shiftKey : isForward;
            });

            $rootElement.on('focusout', event =>
                // detect focus loss on destroyed or hidden element, restoring from history
                !lockFocus && event.relatedTarget === null ? restoreFromHistory() : null);

            $rootElement.on('focusin', event => {
                if (!lockFocus) {
                    let targetElement = $(event.target);
                    let historyLength = focusHistory.length;

                    // check if the element is already in our history; if so remove it and all
                    // superceding elements from the history
                    for (let i = 0; i < historyLength; i++) {
                        if (focusHistory[i].is(targetElement)) {
                            focusHistory.length = i;
                            break;
                        }
                    }

                    let sourceType = isForward ? 'source' : 'target';
                    let targetType = isForward ? 'target' : 'source';
                    let link = linkedList.find(bundle => $(event.relatedTarget).is(bundle[sourceType]));

                    // link exists between the two elements, override default focus behaviour
                    if (typeof link !== 'undefined') {
                        $timeout(() => {
                            link[targetType].focus();
                        });

                    } else if ($.contains($rootElement[0], event.target)) {
                        focusHistory.push(targetElement);
                        activeFocus = targetElement;
                    }
                }

                lockFocus = false;
            });
        }

        /**
         * Restores focus to the most recently focused element which:
         *      - is a descendant of $rootElement
         *      - is focusable
         *
         * @function restoreFromHistory
         */
        function restoreFromHistory() {
            if (focusHistory.length > 0) {
                let prevElem = focusHistory.pop();
                lockFocus = true;
                prevElem.focus();

                // detect if the focus has changed; focus is unchanged if the target
                // element is not focusable
                if (!prevElem.is(':focus')) {
                    restoreFromHistory(); // continue moving back through history until focus is changed
                } else {
                    activeFocus = prevElem; // focus change successful; this is our new actively focused elemment
                }
            }
        }

        /**
         * Creates a link between the actively focused element and the provided targetElement. Focus then moves
         * between the two elements irregardless of their DOM position or tabindex
         * @function createLink
         * @param {Object}  targetElement  the jQuery element focus moves to
         */
        function createLink(targetElement) {
            linkedList = linkedList.filter(bundle =>
                !bundle.source.is(targetElement) && !bundle.source.is(activeFocus) &&
                !bundle.target.is(targetElement) && !bundle.target.is(activeFocus)
            );

            linkedList.push({
                source: activeFocus,
                target: targetElement
            });

            activeFocus.focus();
        }

        /**
         * Sets focus on the first visible button in panel named panelName
         * @function setPanelFocus
         * @param  {String} panelName the name of the panel to set focus on
         */
        function setPanelFocus(panelName) {
            $timeout(() => {
                const firstButton =  $rootElement.find(`[rv-state="${panelName}"] button`).filter(':visible').first();
                if (typeof firstButton !== 'undefined') {
                    firstButton.focus();
                }
            }, 10);
        }

        /**
         * Saves a focusable element
         * @private
         * @function setFocusElement
         * @param  {Object} element a focusable element
         */
        function setFocusElement(element) {
            lastFocusElement = element;
        }

        /**
         * Changes focus to the last saved focusable element
         * @private
         * @function previousFocus
         */
        function previousFocus() {
            lastFocusElement.focus();
        }
    }
})();
