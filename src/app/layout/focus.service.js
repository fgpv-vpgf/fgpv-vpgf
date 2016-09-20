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

    function focusService($rootElement, $rootScope, $mdDialog, storageService, keyNames, $q, events, $timeout) {
        let linkedList = []; // last known element with focus that is a descendent of $rootElement
        let lockFocus = false; // prevents infinite looping
        let isForward = true; // tracks focus directional movement
        let lastFocusElement;
        let firstFocusable; // first focusable element in the viewer
        let lastFocusable; // last focusable element in the viewer
        let currentStatus; // current status of the focus manager
        let isFullPage;

        const statuses = {
            NONE: undefined,
            INACTIVE: 'NOT_ACTIVE',
            WAITING: 'WAITING',
            ACTIVE: 'ACTIVE'
        };
        const focusSelector = `a[href], area[href], input:not([disabled]), select:not([disabled]),
            textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]`;
        const focusHistory = [];
        const dlg = $mdDialog;

        // detect if there has been a mousedown, if so disable focus management until re-activated
        $(document).on('mousedown', event => {
            dlg.hide(); // always hide the dialog

            // clicking inside the map disables focus manager until focus leaves the viewer
            if ($.contains($rootElement[0], event.target)) {
                setStatus('ACTIVE');
            } else if (!isFullPage) {
                setStatus('NOT_ACTIVE');
            } else {
                setStatus(); // disable completely when in full-screen
            }
        });

        $rootScope.$on(events.rvReady, () => {
            firstFocusable = $rootElement.find('button:visible, [tabindex]:visible').first();
            lastFocusable = $rootElement.find('button:visible, [tabindex]:visible').last();

            // TODO: workaround for full-screen detection - replace with resolution of issue #834
            isFullPage = $rootElement.attr('rv-fullpage-app') === 'true';

            if (isFullPage) {
                setStatus('ACTIVE');
            } else {
                setStatus('NOT_ACTIVE');
            }
        });

        const service = {
            createLink,
            setPanelFocus,
            setFocusElement,
            previousFocus,
            status,
            statuses
        };

        return service;

        /**
         * Method for external focus manager status queries
         *
         * @function status
         * @return {STRING}    the current status of the focus manager
         */
        function status() {
            return currentStatus;
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
                setFocus(firstButton);
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
            setFocus(lastFocusElement);
        }

        /**
         * Sets or removes focus event listeners based on the passed status
         * with the three possible statuses being:
         *      - NOT_ACTIVE: focus is elsewhere on the page, only monitor
         *                    when focus enters the viewer
         *      - WAITING: focus has entered viewer, waiting for user to press
         *                 enter key or tab past the viewer
         *      - ACTIVE: viewer has full control of focus
         * @private
         * @function setStatus
         * @param {String}  s  the focus status to switch to
         */
        function setStatus(s) {
            currentStatus = s;

            // remove all listeners before setting new ones
            $rootElement
                .off('keydown', waitingKeydown)
                .off('focusin', inactiveFocusin);

            $(document)
                .off('focusin', activeDocumentFocusin)
                .off('keydown', activeDocumentKeydown)
                .off('focusout', activeDocumentFocusout);

            switch (s) {
                case 'NOT_ACTIVE':
                    RV.lastFocusManager = undefined;
                    $rootElement.on('focusin', inactiveFocusin);
                    break;

                case 'WAITING':
                    $rootElement.on('keydown', waitingKeydown);
                    break;

                case 'ACTIVE':
                    // this is used to determine which viewer (if there is more than one) should take
                    // control of focus if it is going to be assigned to body by the browser
                    RV.lastFocusManager = $rootElement.attr('id');
                    $(document)
                        .on('focusin', activeDocumentFocusin)
                        .on('keydown', activeDocumentKeydown)
                        .on('focusout', activeDocumentFocusout);
                    break;
            }
        }

        /**
         * Given a list of valid focus elements, go through the list until one element has been
         * successfully focused.
         * @private
         * @function setFocusOnList
         * @return    {Boolean}    true if some element in the list could be focused
         */
        function setFocusOnList(elemList) {
            if (elemList.length === 0) {
                return false;
            }

            const elem = $(elemList.shift());
            return setFocus(elem).then(isFocused => isFocused ? true : setFocusOnList(elemList));
        }

        /**
         * Provides a list of potential focusable elements that are after the viewer.
         * @private
         * @function findNextFocusable
         * @return    {List}    a list of potential focusable elements after the viewer
         */
        function findNextFocusable() {
            let element = $rootElement;
            let externalElement = $();
            // loop until you find a focusable element or hit the top of the document
            while (externalElement.length === 0 && element.length > 0) {
                // if element is the last child of its parent, go up
                if (element.is(':last-child')) {
                    element = element.parent();
                // if not the last child, check the next sibling for any focusable elements
                } else {
                    element = element.next();
                    externalElement = element.find(focusSelector);
                }
            }

            return externalElement.toArray();
        }

        /**
         * Provides a list of potential focusable elements that are before the viewer.
         * @private
         * @function findPrevFocusable
         * @return    {List}    a list of potential focusable elements before the viewer
         */
        function findPrevFocusable() {
            let element = $rootElement;
            let externalElement = $();

            // loop until you find a focusable element or hit the top of the document
            while (externalElement.length === 0 && element.length > 0) {
                // if element is the last child of its parent, go up
                if (element.is(':first-child')) {
                    element = element.parent();
                // if not the last child, check the next sibling for any focusable elements
                } else {
                    element = element.prev();
                    externalElement = element.find(focusSelector);
                }
            }

            return externalElement.toArray().reverse();
        }

        /**
         * Restores focus to the most recently focused element which:
         *      - is a descendant of $rootElement
         *      - is focusable
         * @private
         * @function restore
         */
        function restore() {
            if (focusHistory.length > 0) {
                const focusElem = focusHistory[focusHistory.length - 1];
                setFocus(focusElem).then(isFocused => {
                    if (!isFocused) {
                        focusHistory.pop();
                        restore(); // continue moving back through history until focus is changed
                    }
                });
            }
        }

        /**
         * Sets focus for the provided element
         * @private
         * @function setFocus
         * @param  {Object} element the jQuery element object to set focus on
         * @return    {Promise}    resolves to a boolean, true indicating the focus operation was successful, false otherwise
         */
        function setFocus(element) {
            return $q(resolve => {

                $timeout(() => {
                    lockFocus = true;
                    element.focus();
                    lockFocus = false;
                    resolve(element.is(':focus'));
                });
            });
        }

        /**
         * Handles focusout event when viewer focus management is in an active state.
         * @private
         * @function activeDocumentFocusout
         * @param  {Object} event the focusout event object
         */
        function activeDocumentFocusout(event) {
            if (lockFocus || RV.lastFocusManager !== $rootElement.attr('id')) {
                return;
            }

            // detect if focus is moving to a null target, which indicates focus was lost due to
            // a hidden or destroyed element (unless we are on the first or last focusable element)
            if (event.relatedTarget === null && event.target !== firstFocusable[0] &&
                event.target !== lastFocusable[0]) {
                // check first and last focusable element links to see if they are still valid, if not
                // remove them so that default focus rules apply (see below)
                linkedList = linkedList.filter(bundle => {
                    if (bundle.source.is(firstFocusable) || bundle.source.is(lastFocusable)) {
                        return bundle.target.is(':visible');
                    }
                    return true;
                });

                restore();

            } else if (event.target === firstFocusable[0] && !isForward &&
                typeof hasTargetLink(firstFocusable) === 'undefined') {
                setFocus(lastFocusable);

            } else if (event.target === lastFocusable[0] && isForward &&
                typeof hasTargetLink(lastFocusable) === 'undefined') {
                setFocus(firstFocusable);
            }
        }

        /**
         * In active state, disengages focus management in SHIFT + ENTER key combination.
         * @private
         * @function activeDocumentKeydown
         * @param  {Object} event the focusin event object
         */
        function activeDocumentKeydown(event) {
            if (event.which === keyNames.ENTER && event.shiftKey) {
                event.preventDefault();
                setStatus('NOT_ACTIVE');
                dlg.hide().then(() => setFocusOnList(findNextFocusable()));

            // fixes focus browser bug where focus controll cannot be regained once outside body when SHIFT + TABBING
            } else if (event.which === keyNames.TAB && event.shiftKey &&
                document.activeElement === firstFocusable[0] && findPrevFocusable().length === 0) {
                event.preventDefault();
                setFocus(lastFocusable);

            } else if (event.which === keyNames.TAB && !event.shiftKey &&
                document.activeElement === lastFocusable[0] && findNextFocusable().length === 0 &&
                typeof hasTargetLink(lastFocusable) === 'undefined') {
                event.preventDefault();
                setFocus(firstFocusable);
            }
            // this is set here since it is not availble in focusin/focusout events
            isForward = event.which === keyNames.TAB ? !event.shiftKey : isForward;
        }

        function hasTargetLink(element) {
            const [sourceType, targetType] = isForward ? ['source', 'target'] : ['target', 'source'];
            const link = linkedList.find(bundle => element.is(bundle[sourceType]));

            return typeof link !== 'undefined' && !link[targetType].is(':focus') ? link[targetType] : undefined;
        }

        /**
         * In active state, adds focused elements to history, overrides focus for linked elements, and
         * regains control of focus when focus moves to the body element.
         * @private
         * @function activeDocumentFocusin
         * @param  {Object} event the focusin event object
         */
        function activeDocumentFocusin(event) {
            if (lockFocus || RV.lastFocusManager !== $rootElement.attr('id')) {
                return;
            }

            // goto first focusable when focus is moving to the body element
            if (document.activeElement === $('body')[0]) {
                restore();
                return;
            }

            const targetElement = $(event.target);
            const targetLink = hasTargetLink($(event.relatedTarget));
            const historyIndex = focusHistory.findIndex(element => element.is(targetElement));

            // find element in history (if exists) and set as last item
            focusHistory.length = historyIndex !== -1 ? historyIndex : focusHistory.length;

            if (targetLink) {
                setFocus(targetLink);

            // no link exists - add to focus history (if element is in viewer)
            } else if ($.contains($rootElement[0], event.target)) {
                focusHistory.push(targetElement);
            }
        }

        /**
         * Displays focus management dialog instructions and sets status to waiting when focus moves to
         * the viewer while state is inactive.
         * @private
         * @function inactiveFocusin
         */
        function inactiveFocusin(event) {
            if (typeof RV.lastFocusManager !== 'undefined' || $.contains($rootElement[0], event.relatedTarget)) {
                return;
            }
            // handle case where focus starts on last element of viewer, reset to first
            setFocus(firstFocusable);

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
         * Handles keydown event when viewer focus management is in a waiting state.
         * @private
         * @function waitingKeydown
         * @param  {Object} event the keydown event object
         */
        function waitingKeydown(event) {
            switch (event.which) {
                case keyNames.ENTER:
                    if (!event.shiftKey) {
                        event.preventDefault();
                        dlg.hide().then(() => setStatus('ACTIVE'));
                    }
                    break;

                case keyNames.SPACEBAR:
                    dlg.hide().then(() => setStatus('ACTIVE'));
                    break;

                case keyNames.TAB:
                    event.preventDefault(); // prevent tabbing to first focusable map element
                    dlg.hide();
                    setStatus('NOT_ACTIVE');
                    let elemList = event.shiftKey ? findPrevFocusable() : findNextFocusable();
                    // handle case where there are no focusable elements remaining, goto first focusable on page
                    elemList = elemList.length === 0 ? $(focusSelector).toArray() : elemList;
                    setFocusOnList(elemList);
                    break;
            }
        }
    }
})();
