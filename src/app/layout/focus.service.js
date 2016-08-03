/* global RV */
(() => {

    /**
     * @module focusService
     * @memberof app.layout
     *
     * @description
     * `focusService` manages element focus support across the application.
     *
     * Currently, when focus enters the viewer, the user is prompted to either:
     *  - Press the enter key to activate focus management. Focus will not be permitted
     *    to leave the viewer in most cases, and tabbing through the view is circular; the
     *    last focusable element points to the first focusable element. The user has the
     *    option to press shift and enter keys simultaniously to release focus management.
     *
     *  - Press the tab key. Focus will be sent to the first focusable element that is not
     *    a part of the viewer.
     *
     * If any mouse movement is detected on the viewer, focus management is disabled and cannot
     * be reactivated until the page is reloaded.
     */
    angular
        .module('app.layout')
        .factory('focusService', focusService);

    function focusService($rootElement, $rootScope, $mdDialog, storageService) {
        // last known element with focus that is a descendent of $rootElement
        let linkedList = [];
        let focusHistory = [];
        // prevents infinite looping when setting focus from within focusin/focusout listeners
        let lockFocus = false;
        // tracks focus directional movement
        let isForward = true;
        let lastFocusElement;
        let dlg = $mdDialog;
        let focusStatus;

        setStatus('NOT_ACTIVE');

        // mouse movement detected, disable focus management
        $rootElement.on('mousemove', () => {
            $rootElement.off('mousemove');
            setStatus('RESET');
        });

        const service = {
            createLink,
            setPanelFocus,
            setFocusElement,
            previousFocus
        };

        return service;

        /**
         * Sets or removes focus event listeners based on the passed status
         * with the four possible statuses being:
         *      - RESET: remove all listeners
         *      - NOT_ACTIVE: focus is elsewhere on the page, only monitor
         *                    when focus enters the viewer
         *      - WAITING: focus has entered viewer, waiting for user to press
         *                 enter key or tab past the viewer
         *      - ACTIVE: viewer has full control of focus
         *
         * @function setStatus
         * @param {String}  status  the focus status to switch to
         */
        function setStatus(status) {
            focusStatus = status;
            switch (focusStatus) {

                case 'RESET':
                    $rootElement.off('keydown', _waitingKeydownCB);
                    $rootElement.off('focusout', _activeRootFocusoutCB);
                    $rootElement.off('focusin', _inactiveFocusinCB);
                    $rootElement.off('focusin', _activeRootFocusinCB);
                    break;

                case 'NOT_ACTIVE':
                    $rootElement.on('focusin', _inactiveFocusinCB);
                    break;

                case 'WAITING':
                    $rootElement.off('focusin', _inactiveFocusinCB);
                    $rootElement.on('keydown', _waitingKeydownCB);
                    break;

                case 'ACTIVE':
                    $rootElement.on('focusout', _activeRootFocusoutCB);
                    $rootElement.on('focusin', _activeRootFocusinCB);
                    break;
            }
        }

        /**
         * Displays a dialog prompting the user to press the enter or tab key.
         * @function confirmFocus
         */
        function confirmFocus() {
            setStatus('WAITING');
            dlg.show({
                template: `<div style="padding: 20px;">
                            <h3 class="md-title" style="text-align: center;margin:0;margin-bottom:15px;">
                                Press <md-button class="md-raised">Enter</md-button> to activate
                            </h3>
                            <span class="md-subhead">Focus will be kept on the viewer while active. Press
                            <md-button class="md-subhead md-raised">Shift</md-button> +
                            <md-button class="md-subhead md-raised">Enter</md-button> at any time to exit.</span><br>
                            Alternatively, press the <md-button class="md-subhead md-raised">Tab</md-button> key again
                            to skip the viewer.
                            </div>`,
                clickOutsideToClose: false,
                escapeToClose: false,
                disableParentScroll: false,
                parent: storageService.panels.shell,
                focusOnOpen: false
            });
        }

        /**
         * Provides the next focusable element after the viewer.
         *
         * @return Object   jQuery element object of first focusable element after viewer
         * @function getNextExternalFocusable
         * credit: http://stackoverflow.com/questions/8901854/jquery-find-the-next-inputtext-element-after-a-known-element
         */
        function getNextExternalFocusable() {
            // assume you know where you are starting from
            var $startElement = $rootElement.find('button:visible, [tabindex]:visible').last();
            // get all text inputs
            var $inputs = $('button:visible, a:visible, [tabindex]:visible');
            // search inputs for one that comes after starting element
            for (var i = 0; i < $inputs.length; i++) {
                if (isAfter($inputs[i], $startElement)) {
                    var nextInput = $inputs[i];
                    return $(nextInput);
                }
            }
            // is element before or after
            function isAfter(elA, elB) {
                return ($('*').index($(elA).last()) > $('*').index($(elB).first()));
            }
        }

        /**
         * Restores focus to the most recently focused element which:
         *      - is a descendant of $rootElement
         *      - is focusable
         *
         * @function restore
         */
        function restore() {
            if (focusHistory.length > 0) {
                let focusElem = focusHistory.pop();
                lockFocus = true;
                focusElem.focus();

                // detect if the focus has changed; focus is unchanged if the target
                // element is not focusable
                if (!focusElem.is(':focus')) {
                    restore(); // continue moving back through history until focus is changed
                } else {
                    focusHistory.push(focusElem); // focus change successful; this is our new actively focused elemment
                }
            }
        }

        /**
         * Creates a link between the actively focused element and the provided targetElement. Focus then moves
         * between the two elements regardless of their DOM position or tabindex
         * @function createLink
         * @param {Object}  targetElement  the jQuery element focus moves to
         */
        function createLink(targetElement) {

            if (focusHistory.length > 0) {
                let activeElement = focusHistory[focusHistory.length - 1];
                linkedList = linkedList.filter(bundle =>
                    !bundle.source.is(targetElement) && !bundle.source.is(activeElement) &&
                    !bundle.target.is(targetElement) && !bundle.target.is(activeElement)
                );

                linkedList.push({
                    source: activeElement,
                    target: targetElement
                });

                if (!activeElement.is(':focus')) {
                    $rootScope.$applyAsync(() => {
                        lockFocus = true;
                        activeElement.focus();
                    });
                }
            }
        }

        /**
         * Sets focus on the first visible button in panel named panelName
         * @function setPanelFocus
         * @param  {String} panelName the name of the panel to set focus on
         */
        function setPanelFocus(panelName) {
            const firstButton =  $rootElement.find(`[rv-state="${panelName}"] button`).filter(':visible').first();
            if (typeof firstButton !== 'undefined') {
                $rootScope.$applyAsync(() => firstButton.focus());
            }
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
            $rootScope.$applyAsync(() => lastFocusElement.focus());
        }

        // -------------------------------------------------------------------
        // ---------- EVENT LISTENER LOGIC FUNCTIONS BELOW -------------------
        // -------------------------------------------------------------------
        function _activeRootFocusoutCB(event) {
            let firstFocusable = $rootElement.find('button:visible, [tabindex]:visible').first();
            let lastFocusable = $rootElement.find('button:visible, [tabindex]:visible').last();
            // this is used to determine which viewer (if there is more than one) should take
            // control of focus if it is going to be assigned to body by the browser
            RV.lastFocusManager = $rootElement.attr('id');

            // detect if focus is moving to a null target, which indicates focus was lost due to
            // a hidden or destroyed element (unless we are on the first or last focusable element)
            if (event.relatedTarget === null &&
                event.target !== firstFocusable[0] &&
                event.target !== lastFocusable[0]) {
                restore(false);

            } else if (event.target === firstFocusable[0] && !isForward) {
                lastFocusable.focus();

            } else if (event.target === lastFocusable[0] && isForward) {
                firstFocusable.focus();
            }
        }

        function _activeRootFocusinCB(event) {
            if (!lockFocus) {
                let targetElement = $(event.target);

                // check if the element is already in our history; if so remove it and all
                // superceding elements from the history
                for (let i = 0; i < focusHistory.length; i++) {
                    if (focusHistory[i].is(targetElement)) {
                        focusHistory.length = i;
                        break;
                    }
                }

                let sourceType = isForward ? 'source' : 'target';
                let targetType = isForward ? 'target' : 'source';
                let link = linkedList.find(bundle => $(event.relatedTarget).is(bundle[sourceType]));

                // link exists between the two elements, override default focus behaviour
                if (typeof link !== 'undefined' && !link[targetType].is(':focus')) {
                    $rootScope.$applyAsync(() => {
                        lockFocus = true;
                        link[targetType].focus();
                    });

                } else {
                    focusHistory.push(targetElement);
                }
            }

            lockFocus = false;
        }

        function _inactiveFocusinCB(event) {
            return !$.contains($rootElement[0], event.relatedTarget) ? confirmFocus() : null;
        }

        function _waitingKeydownCB(event) {
            const setInactive = () => {
                event.preventDefault();
                setStatus('RESET');
                dlg.hide();
                getNextExternalFocusable().focus();
                setStatus('NOT_ACTIVE');
            };

            if (focusStatus === 'ACTIVE' && event.which === 13 && event.shiftKey) {
                setInactive();

            } else if (focusStatus === 'WAITING' && event.which === 13 && !event.shiftKey) {
                setStatus('ACTIVE');
                dlg.hide();

            } else if (focusStatus === 'WAITING' && event.which === 9) {
                setInactive();
            }

            // detect focus direction is reversed
            isForward = event.which === 9 ? !event.shiftKey : isForward;
        }
    }
})();
