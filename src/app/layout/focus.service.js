// jshint maxstatements:45
/* global jQuery, RV */
(() => {
    const FOCUS_SELECTORS = `a[href], area[href], input:not([disabled]), select:not([disabled]),
            textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]`;
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

        const keys = {}; // object containing all currently depressed keys
        const statuses = {
            NONE: undefined,
            INACTIVE: 'NOT_ACTIVE',
            WAITING: 'WAITING',
            ACTIVE: 'ACTIVE'
        };
        const VIEWER_SELECTOR = `[rv-trap-focus=""], [rv-trap-focus="${$rootElement.attr('id')}"]`;

        let history = []; // ordered list of elements which has received focus
        let linkedList = []; // list of element pairs which focus moves between
        let lockFocus = false; // prevents infinite looping
        let currentStatus; // current status of the focus manager
        let focusTimeoutCancel;

        // TODO: workaround for full-screen detection - replace with resolution of issue #834
        if ($rootElement.attr('rv-fullpage-app') === 'true') {
            setStatus(statuses.ACTIVE);
        } else {
            setStatus(statuses.INACTIVE);
        }

        $(document).on('keyup', documentKeyup);
        $(document).on('mousedown', event => {
            const evtTarget = $(event.target);

            // clicking inside the viewer activates focus manager
            if (isPartOfViewer(evtTarget)) {
                const rvEsriMap = evtTarget.closest('.rv-esri-map');
                // click on map detected - set focus on the map
                if (rvEsriMap.length === 1) {
                    setFocus(rvEsriMap);
                // find the nearest focusable parent (or self) which is focusable
                // since click targets can be any element type (usually being md-icon)
                } else {
                    const firstFocusable = evtTarget.parents(FOCUS_SELECTORS).addBack(FOCUS_SELECTORS).first();
                    setFocus(firstFocusable);
                }
                setStatus(statuses.ACTIVE);

            // clicking outside the viewer deactivates focus manager
            } else {
                setStatus(statuses.INACTIVE);
            }
        });

        /**
         * The first focus manager to load (if there are multiple viewers) on the page is responsible for
         * overriding four key javascript prototype functions for viewer elements only:
         *      - focus
         *      - preventDefault
         *      - stopPropagation
         *      - stopImmediatePropagation
         *
         * These original prototype functions are replaced with a wrapper function that takes a boolean parameter. If true it calls
         * the original function, if not nothing is executed. e.g. $('$myElem').focus() does nothing, instead $('$myElem').focus(true) should
         * be used. This prevents outside libraries like angular material from moving focus, and from hiding events.
         *
         * preventDefault, stopPropagation, and stopImmediatePropagation has been used in angular material to suppress click events.
         */
        if (typeof RV.initFocusManager === 'undefined') {
            RV.initFocusManager = true;

            const orginalFocus = $.fn.focus;
            $.fn.focus = function (takeAction) {
                if (takeAction || !isPartOfViewer($(this))) {
                    return orginalFocus.apply(this, [...arguments].slice(1));
                } else {
                    console.warn('Setting focus on viewer elements is not allowed');
                }
            };

            jQuery.Event.prototype.preventDefault = (function () {
                var originalFunc = jQuery.Event.prototype.preventDefault;
                return function (takeAction) {
                    if (takeAction || !isPartOfViewer($(this))) {
                        originalFunc.call(this);
                    } else {
                        console.warn('preventDefault not allowed on viewer elements');
                    }
                };
            }());

            jQuery.Event.prototype.stopPropagation = (function () {
                var originalFunc = jQuery.Event.prototype.stopPropagation;
                return function (takeAction) {
                    if (takeAction || !isPartOfViewer($(this))) {
                        originalFunc.call(this);
                    } else {
                        console.warn('stopPropagation not allowed on viewer elements');
                    }
                };
            }());

            jQuery.Event.prototype.stopImmediatePropagation = (function () {
                var originalFunc = jQuery.Event.prototype.stopImmediatePropagation;
                return function (takeAction) {
                    if (takeAction || !isPartOfViewer($(this))) {
                        originalFunc.call(this);
                    } else {
                        console.warn('stopImmediatePropagation not allowed on viewer elements');
                    }
                };
            }());
        }

        const service = {
            createLink,
            status,
            statuses,
            setFocus
        };

        return service;

        /**
         * Creates a link between the source element and the target element such that focus moves
         * forward/backward between the two elements - regardless of their actual tab order
         *
         * @function createLink
         * @param   {Object}    targetEl    the jQuery element focus moves to
         * @param   {Object}    sourceEl    the optional jQuery element focus moves from (default is last visible element)
         */
        function createLink(targetEl, sourceEl = lastVisibleHistoryElement()) {
            const source = jqueryElement(sourceEl);
            const target = jqueryElement(targetEl);

            linkedList = linkedList.filter(bundle => !bundle[1].is(target));

            linkedList.push({
                0: source,
                1: target,
                target: forward => forward ? target : source
            });
        }

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
         * Sets focus on the provided element and updates focus history. element MUST be
         * focusable, no check is done here.
         *
         * @function setFocus
         * @param   {Object}    element     the jQuery element object to set focus on
         * @return  {Promise}   resolves to undefined when focus has been set
         */
        function setFocus(element) {
            const el = jqueryElement(element);

            $timeout.cancel(focusTimeoutCancel);

            return $q(resolve => {
                $rootScope.$applyAsync(() => {
                    lockFocus = true;
                    el.focus(true);
                    lockFocus = false;

                    const histIndex = history.findIndex(elem => elem.is(el));
                    if (histIndex !== -1) {
                        history.length = histIndex;
                    }
                    history.push(el);
                    resolve();
                });
            });
        }

        /**
         * Determines if an element is part of this viewer
         *
         * @private
         * @function isPartOfViewer
         * @param   {Object}    element  the jQuery element to determine if part of this viewer
         * @return  {Boolean}   true iff is part of the viewer, false otherwise
         */
        function isPartOfViewer(element) {
            return element.parents(VIEWER_SELECTOR).addBack(VIEWER_SELECTOR).length > 0;
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

            if (currentStatus === statuses.WAITING) {
                $mdDialog.hide();
            }

            currentStatus = s;
            $rootElement
                .off('keydown', waitingKeydown)
                .off('focusin', inactiveFocusin);

            $(document)
                .off('focusout', activeFocusout)
                .off('keydown', activeKeydown);

            switch (s) {
                case 'NOT_ACTIVE':
                    $rootElement.on('focusin', inactiveFocusin);
                    break;

                case 'WAITING':
                    $rootElement.on('keydown', waitingKeydown);
                    break;

                case 'ACTIVE':
                    $(document)
                        .on('focusout', activeFocusout)
                        .on('keydown', activeKeydown);
                    break;
            }
        }

        /**
         * Converts an element, node, or jQuery element object (passthrough) into a jQuery element object.
         *
         * @function jqueryElement
         * @private
         * @param   {Object}    element     the element, node, or jQuery element object to convert
         * @return  {Object}    the jQuery element object
         */
        function jqueryElement(element) {
            if (!(element instanceof jQuery)) {
                element = $(element);
            }
            return element;
        }

        /**
         * Searches the document tree for the next/previous focusable element given the currently focused element. Searches
         * in the direction given by forward. To find the first/last element in a focus trap, set gotoEnd to true.
         *
         * @private
         * @function focusableSearch
         * @param     {Object}  element the reference element to determine next/previous focusable
         * @param     {Boolean} forward the direction of focus movement
         * @param     {Boolean} gotoEnd keep traversing until no longer possible
         * @return    {Object}    a jQuery element which is next/previous to the reference element provided
         */
        function focusableSearch(element, forward, gotoEnd = false) {
            /*jshint maxcomplexity:15 */

            // forward focusables can be descendents of an element, unlike backward traversal
            let foundElement = forward ? element.find(FOCUS_SELECTORS).filter(elemIsFocusable) : $();
            // the originally passed element as a reference
            let refElem = element;
            // only stores actual elements - is not empty
            let lastKnownElement = gotoEnd ? foundElement : $();
            // loop until we locate an element
            while (gotoEnd || (foundElement.length === 0 && element.length > 0)) {

                // we have reached a focus trap, no more traversal is needed
                if (element.is('[rv-trap-focus]')) {
                    // breaking here knowing that lastKnownElement is very first/last focusable
                    if (gotoEnd) {
                        break;
                    // no elements have been found, so lets find the first/last focusable in focus trap to loop to
                    } else {
                        return focusableSearch(refElem, !forward, true);
                    }
                }

                if (element.is(forward ? ':last-child' : ':first-child')) {
                    element = element.parent();

                    // backward searching can include the focus trap itself - forward searches skip past them
                    if (!forward && element.filter(FOCUS_SELECTORS).filter(elemIsFocusable).length > 0) {
                        foundElement = element;
                        lastKnownElement = element;
                    }

                } else {
                    element = forward ? element.next() : element.prev();

                    foundElement = element.find(FOCUS_SELECTORS).addBack(FOCUS_SELECTORS).filter(elemIsFocusable);
                    // lastKnownElement should only store actual elements (not empty jQuery objects)
                    if (foundElement.length > 0) {
                        lastKnownElement = foundElement;
                    }
                }
            }

            if (gotoEnd) {
                return forward ? lastKnownElement.last() : lastKnownElement.first();
            }

            return forward ? foundElement.first() : foundElement.last();
        }

        /**
         * Finds and returns the last focusable element from history
         *
         * @function lastVisibleHistoryElement
         * @private
         * @return  {Object}    jQuery element of last focusable element from history
         */
        function lastVisibleHistoryElement() {
            return $(history.slice().reverse().find(el => el.is(elemIsFocusable)));
        }

        /**
         * A filter which determines if the provided element is focusable.
         *
         * @function elemIsFocusable
         * @private
         * @param   {Number}    index     the current index value while inside a jQuery filter
         * @param   {Object}    element   the element to check if it is focusable
         * @return  {Boolean}   true if the element is focusable, false otherwise
         */
        function elemIsFocusable(index, element) {
            const el = $(element);

            return el.is(':visible') &&
                !el.is(':hidden') &&
                el.css('visibility') !== 'hidden' &&
                el.css('opacity') !== 0 &&
                // avoid setting focus on closing menu items
                !el.parents().hasClass('md-leave') &&
                !el.parents().hasClass('md-leave-add');
        }

        /**
         * Finds a link (created by the createLink function)
         *
         * @function hasLink
         * @private
         * @param   {Boolean}    forward   true iff focus is moving forward, false otherwise
         * @return  {Object}     an object containing source and target elements if a link exists, undefined otherwise
         */
        function hasLink(forward) {
            const lastHistoryElem = $(history.slice().reverse().find(el => el.is(elemIsFocusable)));
            return linkedList.find(link => lastHistoryElem.is(link.target(!forward)));
        }

        /**
         * Determines the element to set focus on.
         *
         * @function shiftFocus
         * @private
         * @param   {Boolean}    forward            true iff focus is moving forward (default), false otherwise
         * @param   {Boolean}    onlyUseHistory     if true, will only focus on element in history
         */
        function shiftFocus(forward = true, onlyUseHistory = false) {
            const link = hasLink(forward);
            // link exists on current element
            if (link) {
                // goto target if focusable
                if (link.target(forward).is(elemIsFocusable)) {
                    setFocus(link.target(forward));
                // otherwise remove link if not focusable
                } else {
                    linkedList.splice(linkedList.indexOf(link), 1);
                    shiftFocus(forward);
                }
            // no link exists
            } else {
                const focSearch = dir => focusableSearch($(document.activeElement), dir);

                if (onlyUseHistory) {
                    setFocus(lastVisibleHistoryElement());
                } else {
                    setFocus(focSearch(forward));
                }
            }
        }

        /**
         * Displays focus management dialog instructions and sets status to waiting when focus moves to
         * the viewer while state is inactive.
         *
         * @private
         * @function inactiveFocusin
         */
        function inactiveFocusin() {
            // handle case where focus starts on last element of viewer, reset to first
            setFocus(focusableSearch($rootElement, true));
            // change tabindex of all focusable elements to -1 except for the map so that tab presses naturally
            // move to the next element outside the viewer
            $rootElement.find(FOCUS_SELECTORS).not('.rv-esri-map').attr('tabindex', -1);
            setStatus(statuses.WAITING);

            $mdDialog.show({
                template: `
                    <md-dialog-content class="md-dialog-content" role="document">
                        <h2 class="md-title ng-binding">Press
                        <div class="md-button md-subhead md-raised">Enter</div>
                        to activate or skip with <div class="md-button md-subhead md-raised">Tab
                        </div></h2>

                        <div class="md-dialog-content-body">
                                We'll keep focus locked on the viewer, exit with
                                <div class="md-button md-subhead md-raised">Escape</div> +
                                <div class="md-button md-subhead md-raised">Tab</div>
                        </div>
                    </md-dialog-content>`,
                clickOutsideToClose: false,
                escapeToClose: false,
                disableParentScroll: false,
                parent: storageService.panels.shell,
                focusOnOpen: false
            });
        }

        /**
         * Handles document keydown event when viewer focus management is active.
         *
         * @private
         * @function activeKeydown
         * @param  {Object} event the keydown event object
         */
        function activeKeydown(event) {
            keys[event.which] = true;
            if (event.which === keyNames.TAB) {
                // prevent browser from moving focus
                if (!keys[keyNames.ESCAPE]) {
                    event.preventDefault(true);
                    shiftFocus(!event.shiftKey);
                // tab + escape key deactivates focus manager, focus leaves naturally
                } else {
                    setStatus(statuses.INACTIVE);
                }
            }
        }

        /**
         * Handles document keyup event when viewer focus management is active.
         *
         * @private
         * @function documentKeyup
         * @param      {Object}     event the keyup event object
         */
        function documentKeyup(event) {
            delete keys[event.which];
        }

        /**
         * Handles keydown event when viewer focus management is in a waiting state.
         *
         * @private
         * @function waitingKeydown
         * @param  {Object} event the keydown event object
         */
        function waitingKeydown(event) {
            if ((event.which === keyNames.ENTER && !event.shiftKey) || event.which === keyNames.SPACEBAR) {
                event.preventDefault(true);
                setStatus(statuses.ACTIVE);

            } else if (event.which === keyNames.TAB) {
                setStatus(statuses.INACTIVE);
                // prevents focus from moving to the dialogs focus trap
                $rootElement.find('.md-dialog-focus-trap').attr('tabindex', -1);
            }
        }

        /**
         * Handles focusout event when viewer focus management is active.
         *
         * @private
         * @function activeFocusout
         * @param  {Object} event the focusout event object
         */
        function activeFocusout(event) {
            if (!lockFocus) {
                if (event.relatedTarget === null) {
                    // canceled by setFocus if called within 200ms - prevents timing conflicts between focus moving
                    // off a target such as a closing panel to another target explicitly focused
                    focusTimeoutCancel = $timeout(() => {
                        shiftFocus(false, true);
                    }, 200);
                }
            }
        }
    }
})();
