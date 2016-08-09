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
     * Any mouse click outside the viewer will disable focus management until the viewer is
     * focused on again by tabbing.
     */
    angular
        .module('app.layout')
        .factory('focusService', focusService);

    function focusService($rootElement, $rootScope, $mdDialog, storageService, keyNames) {
        let linkedList = []; // last known element with focus that is a descendent of $rootElement
        let lockFocus = false; // prevents infinite looping
        let isForward = true; // tracks focus directional movement
        let lastFocusElement;
        let focusStatus;
        let mousedown = false;

        const focusSelector = `a[href], area[href], input:not([disabled]), select:not([disabled]),
            textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]`;
        const focusHistory = [];
        const dlg = $mdDialog;
        const service = {
            createLink,
            setPanelFocus,
            setFocusElement,
            previousFocus
        };

        setStatus('NOT_ACTIVE');

        // detect if there has been a mousedown after a tab keydown
        $rootElement.on('mousedown', () => mousedown = true);
        $rootElement.on('keydown', event => {
            if (event.which === keyNames.TAB) {
                mousedown = false;
            }
        });

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
                    $rootElement.off('keydown', _waitingKeydownCB)
                        .off('focusout', _activeRootFocusoutCB)
                        .off('focusin', _inactiveFocusinCB)
                        .off('focusin', _activeRootFocusinCB);
                    $(document).off('click', _waitingClickCB);
                    break;

                case 'NOT_ACTIVE':
                    $rootElement.on('focusin', _inactiveFocusinCB);
                    break;

                case 'WAITING':
                    $rootElement.off('focusin', _inactiveFocusinCB)
                        .on('keydown', _waitingKeydownCB);
                    $(document).on('click', _waitingClickCB);
                    break;

                case 'ACTIVE':
                    $rootElement.on('focusout', _activeRootFocusoutCB)
                        .on('focusin', _activeRootFocusinCB);
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
                                Press <div class="md-button md-subhead md-raised">Enter</div> to activate
                            </h3>
                            <span class="md-subhead">Focus will be kept on the viewer while active. Press
                            <div class="md-button md-subhead md-raised">Shift</div> +
                            <div class="md-button md-subhead md-raised">Enter</div> at any time to exit.</span><br>
                            Alternatively, press the <div class="md-button md-subhead md-raised">Tab</div> key again
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
         * @function findNextFocusable
         */
        function findNextFocusable() {
            let element = $rootElement;
            let externalElement = $();

            // loop until you find a focusable element or hit the top of the document
            while (externalElement.length === 0 && element[0] !== window.document) {
                // if element is the last child of its parent, go up
                if (element.is(':last-child')) {
                    element = element.parent();
                // if not the last child, check the next sibling for any focusable elements
                } else {
                    element = element.next();
                    externalElement = element.find(focusSelector);
                }
            }

            return externalElement[0];
        }

        /**
         * Provides the previous focusable element before the viewer.
         *
         * @return Object   jQuery element object of first focusable element before viewer
         * @function findPrevFocusable
         */
        function findPrevFocusable() {
            let element = $rootElement;
            let externalElement = $();

            // loop until you find a focusable element or hit the top of the document
            while (externalElement.length === 0 && element[0] !== window.document) {
                // if element is the last child of its parent, go up
                if (element.is(':first-child')) {
                    element = element.parent();
                // if not the last child, check the next sibling for any focusable elements
                } else {
                    element = element.prev();
                    externalElement = element.children(focusSelector);
                }
            }

            return externalElement.last();
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
                const focusElem = focusHistory.pop();
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
                const activeElement = focusHistory[focusHistory.length - 1];
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

        /**
         * Handles focusout event when viewer focus management is in an active state.
         * @private
         * @function _activeRootFocusoutCB
         * @param  {Object} event the focusout event object
         */
        function _activeRootFocusoutCB(event) {
            const firstFocusable = $rootElement.find('button:visible, [tabindex]:visible').first();
            const lastFocusable = $rootElement.find('button:visible, [tabindex]:visible').last();

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

        /**
         * Handles focusin event when viewer focus management is in an active state.
         * @private
         * @function _activeRootFocusinCB
         * @param  {Object} event the focusin event object
         */
        function _activeRootFocusinCB(event) {
            if (lockFocus) {
                lockFocus = false;
                return;
            }

            const targetElement = $(event.target);

            // check if the element is already in our history; if so remove it and all
            // superceding elements from the history
            for (let i = 0; i < focusHistory.length; i++) {
                if (focusHistory[i].is(targetElement)) {
                    focusHistory.length = i;
                    break;
                }
            }

            const [sourceType, targetType] = isForward ? ['source', 'target'] : ['target', 'source'];
            const link = linkedList.find(bundle => $(event.relatedTarget).is(bundle[sourceType]));

            // link exists between the two elements, override default focus behaviour
            if (typeof link !== 'undefined' && !link[targetType].is(':focus')) {
                $rootScope.$applyAsync(() => {
                    lockFocus = true;
                    link[targetType].focus();
                });

            } else {
                focusHistory.push(targetElement);
            }

            lockFocus = false;
        }

        /**
         * Handles focusin event when viewer focus management is in an inactive state.
         * @private
         * @function _inactiveFocusinCB
         * @param  {Object} event the focusin event object
         */
        function _inactiveFocusinCB(event) {
            return !$.contains($rootElement[0], event.relatedTarget) && !mousedown ? confirmFocus() : null;
        }

        /**
         * Handles keydown event when viewer focus management is in a waiting state.
         * @private
         * @function _waitingKeydownCB
         * @param  {Object} event the keydown event object
         */
        function _waitingKeydownCB(event) {
            const setInactive = shiftKey => {
                event.preventDefault();
                setStatus('RESET');
                dlg.hide();

                if (shiftKey) {
                    findPrevFocusable().focus();
                } else {
                    findNextFocusable().focus();
                }

                setStatus('NOT_ACTIVE');
            };

            if (focusStatus === 'WAITING' && (event.which === keyNames.ENTER || event.which === keyNames.SPACEBAR)) {
                event.preventDefault();
            }

            if (focusStatus === 'ACTIVE' && event.which === keyNames.ENTER && event.shiftKey) {
                setInactive(false);

            } else if (focusStatus === 'WAITING' && event.which === keyNames.ENTER && !event.shiftKey) {
                setStatus('ACTIVE');
                dlg.hide();

            } else if (focusStatus === 'WAITING' && event.which === keyNames.TAB) {
                setInactive(event.shiftKey);
            }

            // detect focus direction is reversed
            isForward = event.which === keyNames.TAB ? !event.shiftKey : isForward;
        }

        /**
         * Handles document click event when viewer focus management is in a waiting or active state.
         * @private
         * @function _waitingClickCB
         * @param  {Object} event the click event object
         */
        function _waitingClickCB(event) {
            // check needed as md-menu fires click event on enter keypress...
            if (event.clientX !== 0 || event.clientY !== 0) {
                if (!$.contains($rootElement[0], event.target)) {
                    dlg.hide();
                    setStatus('RESET');
                    setStatus('NOT_ACTIVE');
                }
            }
        }
    }
})();
