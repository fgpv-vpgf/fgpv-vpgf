/* global RV, jQuery */
((RV, jQuery) => {
    // delay in milliseconds from time focus is lost to when action is taken
    const focusoutDelay = 200;
    // all the possible states a viewer can be in - only one at any given time
    const statuses = {
        NONE: undefined,
        INACTIVE: 'NOT_ACTIVE',
        WAITING: 'WAITING',
        ACTIVE: 'ACTIVE'
    };
    // jQuery selectors for elements that are likely focusable
    // since we don't want focus on md-sidenav (focus instead on close button) we omit this with [tabindex]:not(md-sidenav)
    const focusSelector = `a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]),
        button:not([disabled]), iframe, object, embed, [tabindex]:not(md-sidenav), [contenteditable]`;
    // object containing all currently depressed keyboard keys
    const keys = {};
    // ordered list of elements which has received focus
    const history = [];
    // list of element pair objects which focus moves between
    // An example of an element object pair:
    //  {
    //      0: $(sourceElement),
    //      1: $(targetElement),
    //      getDestinationElement: forward => return $(targetElement) if forward is true, $(sourceElement) otherwise
    //  }
    let linkedList = [];
    // prevents infinite looping when focusout/in triggers focusout/in
    let lockFocus = false;
    // used to call cancelTimeout during focus if focusout timeout has started
    let focusoutTimerCancel;

    /**
     * Represents one viewer on a page, with multiple viewers being possible. Tracks viewer state,
     * determines if elements belong to it, and stores limited angular services passed in.
     */
    class Viewer {
        /**
         * @param   {Object}    rootElem - jQuery or HTML element node of the angular viewer, equivalent to $rootElement
         * @param   {Object}    mdDialog  - angular material $mdDialg object reference
         */
        constructor (rootElem, mdDialog) {
            this.rootElement = $(rootElem);
            this.id = this.rootElement.attr('id');
            this.status = statuses.INACTIVE;
            this.mdDialog = mdDialog;

            // TODO: workaround for full-screen detection - replace with resolution of issue #834
            if (this.rootElement.attr('rv-fullpage-app') === 'true') {
                this.setStatus(statuses.ACTIVE);
            }
        }

        /**
         * Sets the status of the viewer.
         * @param   {String}    status - a value from `statuses` object
         * @return  {Object}    Viewer
         */
        setStatus (status) {
            // hide the focus manager dialog
            if (this.mdDialog && this.status === statuses.WAITING) {
                this.mdDialog.hide();
            }

            this.status = status;
            // add attribute to the rootElement so angular directives can be aware of their focus state
            this.rootElement.attr('rv-focus-status', status);
            return this;
        }

        /**
         * Determines if a given element is a part of this viewer.
         * @param   {Object}    el - jQuery element object to check if contained in this viewer
         * @return  {Object}    this viewer instance if contained, undefined otherwise
         */
        contains (el) {
            return el.closest(`[rv-trap-focus="${this.id}"]`).length !== 0 ? this : undefined;
        }
    }

    /**
     * Stores, searches, and sets state on all the various possible Viewer instances
     */
    class ViewerGroup {
        constructor () {
            this.viewerList = [];
        }

        /**
         * Adds a new Viewer instance for focus to be tracked on
         * @param   {Object}    viewerObj - an instance of Viewer
         */
        add (viewerObj) {
            this.viewerList.push(viewerObj);
        }

        /**
         * Returns the viewer, if one exists, that element belongs to
         * @param   {Object}    el - jQuery element object to check if contained in any viewer
         * @return  {Object}    Viewer instance which contains the element, or undefined if not contained
         */
        contains (el) {
            return this.viewerList.find(v => v.contains(el));
        }

        /**
         * Returns the viewer, if one exists, that is in the given state
         * @param   {Object}    status - a value from `statuses` object
         * @return  {Object}    Viewer instance in the given state
         */
        status (status) {
            return this.viewerList.find(v => v.status === status);
        }

        /**
         * Sets the status of all viewers to inactive
         */
        deactivate () {
            this.viewerList.forEach(v => v.setStatus(statuses.INACTIVE));
        }
    }

    const viewerGroup = new ViewerGroup();

    RV.focusManager = {
        init,
        addViewer
    };

    /**
     * Creates a new Viewer instance and adds it to ViewerGroup
     * @param   {Object}    rootElem - jQuery or HTML element node of the angular viewer, equivalent to $rootElement
     * @param   {Object}    mdDialog  - angular material $mdDialg object reference
     */
    function addViewer(rootElem, mdDialog) {
        if (!viewerGroup.contains(rootElem)) {
            viewerGroup.add(new Viewer(rootElem, mdDialog));
        }
    }

    /**
     * Searches the document tree for the next/previous focusable element given the currently focused element. Searches
     * in the direction given by forward. To find the first/last element in a focus trap, set gotoEnd to true.
     *
     * Samples:
     *     - Next focusable element: focusableSearch($(document.activeElement), true);
     *     - Previous focusable element: focusableSearch($(document.activeElement), false);
     *     - Very first focusable element in focus trap: focusableSearch($(#anyElementInTrap), false, true);
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
        let foundElement = forward ? element.find(focusSelector).filter(elemIsFocusable) : $();
        // the originally passed element as a reference
        let refElem = element;
        // only stores actual elements - is not empty
        let lastElementSet = gotoEnd ? foundElement : $();
        // loop until we locate an element
        while (gotoEnd || (foundElement.length === 0 && element.length > 0)) {

            // we have reached a focus trap, no more traversal is needed
            if (element.is('[rv-trap-focus]')) {
                // breaking here knowing that lastElementSet is very first/last focusable
                if (gotoEnd) {
                    return forward ? lastElementSet.last() : lastElementSet.first();
                // no elements have been found, so lets find the first/last focusable in focus trap to loop to
                } else {
                    // we've reached a focus trap but haven't found an element to set focus on
                    // this wraps focus such that if the current direction is forward and we're currently on the
                    // last focusable element, we want the very first focusable in this trap, similar to the direction
                    // being reversed and we're on the first element, we would want the very last element in the focus trap
                    return element.attr('rv-fullpage-app') === 'true' ? $() : focusableSearch(refElem, !forward, true);
                }
            }

            if (element.is(forward ? ':last-child' : ':first-child')) {
                element = element.parent();

                // backward searching can include the focus trap itself - forward searches skip past them
                if (!forward && element.filter(focusSelector).filter(elemIsFocusable).length > 0) {
                    foundElement = element;
                    lastElementSet = element;
                }

            } else {
                element = forward ? element.next() : element.prev();

                foundElement = element.find(focusSelector).addBack(focusSelector).filter(elemIsFocusable);
                // lastElementSet should only store actual elements (not empty jQuery objects)
                if (foundElement.length > 0) {
                    lastElementSet = foundElement;
                }
            }
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
        const histElem = lastVisibleHistoryElement();
        return linkedList.find(link => histElem.is(link.getDestinationElement(!forward)));
    }

    /**
     * Determines the element to set focus on.
     *
     * @function shiftFocus
     * @private
     * @param   {Boolean}    forward            true iff focus is moving forward (default), false otherwise
     * @param   {Boolean}    onlyUseHistory     if true, will only focus on element in history
     * @return  {Boolean}    true iff focus has moved in any direction, false otherwise
     */
    function shiftFocus(forward = true, onlyUseHistory = false) {
        const link = hasLink(forward);
        if (onlyUseHistory) {
            lastVisibleHistoryElement().focus(true);

        } else if (link) {
            // goto target if focusable
            if (link.getDestinationElement(forward).is(elemIsFocusable)) {
                link.getDestinationElement(forward).focus(true);
            // otherwise remove link if not focusable
            } else {
                linkedList.splice(linkedList.indexOf(link), 1);
                return shiftFocus(forward);
            }
        } else {
            const focusSearch = focusableSearch($(document.activeElement), forward);
            if (focusSearch.length === 0) {
                return false;
            }
            focusSearch.focus(true);
        }

        return true;
    }

    /**
     * Handles mousedown document events
     *
     * @private
     * @function onMouseDown
     * @param {Object} event - the onMouseDown event object
     */
    function onMouseDown(event) {
        const evtTarget = $(event.target);
        const viewer = viewerGroup.contains(evtTarget);

        if (viewer) {
            viewer.setStatus(statuses.ACTIVE);
            evtTarget
                .closest('.rv-esri-map, ' + focusSelector)
                .focus(true);
        } else {
            viewerGroup.deactivate();
        }
    }

    /**
     * Displays focus management dialog instructions and sets status to waiting when focus moves to
     * the viewer while state is inactive.
     *
     * @private
     * @function onFocusin
     * @param   {Object}    event   the focusin event object
     */
    function onFocusin(event) {
        const targetEl = $(event.target);
        const viewer = viewerGroup.contains(targetEl);

        // only care if viewer is inactive
        if (!viewer || viewer.status !== statuses.INACTIVE) {
            return;
        }

        history.push(targetEl);
        viewer.setStatus(statuses.WAITING);

        viewer.mdDialog.show({
            contentElement: viewer.rootElement.find('.rv-focus-dialog-content > div'),
            clickOutsideToClose: false,
            escapeToClose: false,
            disableParentScroll: false,
            parent: viewer.rootElement.find('rv-shell'),
            focusOnOpen: false
        }).then(() => resetTabindex(viewer));
    }

    /**
     * Sets tabindex for all elements of the viewer except the map so that when a user tabs
     * during a waiting state, the next focusable element outside the viewer is focused. This also
     * solves an issue where focus cannot be manually set to the browsers url bar, which in turn causes
     * focus to be trapped inside the document body.
     *
     * @private
     * @function resetTabindex
     * @param  {Object} viewer a viewer instance
     */
    function resetTabindex(viewer) {
        viewer.rootElement
            .find(focusSelector)
            .not('.rv-esri-map')
            .attr('tabindex', -1);
    }

    /**
     * Handles document keydown event when viewer focus management is active.
     *
     * @private
     * @function onKeydown
     * @param  {Object} event the keydown event object
     */
    function onKeydown(event) {
        const viewerActive = viewerGroup.status(statuses.ACTIVE);
        const viewerWaiting = viewerGroup.status(statuses.WAITING);
        keys[event.which] = true;

        if (viewerActive) {
            // set viewer inactive but allow tab action to be handled by the browser
            if (event.which === 9 && keys[27]) { // escape + tab keydown
                viewerActive.setStatus(statuses.INACTIVE);
            // shiftFocus must return true indicating focus has been moved, and only then
            // do we want to prevent the browser from moving focus itself
            } else if (event.which === 9 && shiftFocus(!event.shiftKey)) { // tab keydown only
                event.preventDefault(true);
            }

        } else if (viewerWaiting) {
            if (event.which === 13 || event.which === 32) { // enter or spacebar
                event.preventDefault(true);
                viewerWaiting.setStatus(statuses.ACTIVE);

            } else if (event.which === 9) { // tab key
                resetTabindex(viewerWaiting);
                viewerWaiting.setStatus(statuses.INACTIVE);
            }
        }
    }

    /**
     * Handles document keyup event when viewer focus management is active.
     *
     * @private
     * @function onKeyup
     * @param      {Object}     event the keyup event object
     */
    function onKeyup(event) {
        delete keys[event.which];
    }

    /**
     * Handles focusout event when viewer focus management is active.
     *
     * @private
     * @function onFocusout
     * @param  {Object} event the focusout event object
     */
    function onFocusout(event) {
        const viewer = viewerGroup.status(statuses.ACTIVE);
        if (viewer && !lockFocus && event.relatedTarget === null) {
            // Allow for a short time as determined by focusoutDelay in milliseconds so that when focus
            // leaves unexpectedly, focus can be manually set and we don't need to be back through history
            // Animations often cause focus loss when, for example, one element is being hidden while the
            // element we want focus on is being shown.
            focusoutTimerCancel = setTimeout(() => shiftFocus(false, true), focusoutDelay);
        }
    }

    /**
     * Initializes document event listeners and contains the jQuery prototypes overrides
     */
    function init() {
        // for consistency angular should use the status object when trying to infer a status string
        RV.focusStatusTypes = statuses;

        $(document)
            .on('keydown', onKeydown)
            .on('keyup', onKeyup)
            .on('mousedown', onMouseDown)
            .on('focusin', onFocusin)
            .on('focusout', onFocusout);

        /**
         * Creates a link between the last focusable element in history and the first focusable element in the target set
         *
         * @function noSourceLink
         * @param   {Object}    targetElemSet    the jQuery element set to find a focusable element
         */
        function noSourceLink(targetElemSet) {
            // similar to focusout, we wait a short time as determined by focusoutDelay in milliseconds so that
            // any immediate animations that hide history elements happen first (such as md-menu actions)
            setTimeout(() => link(lastVisibleHistoryElement(), targetElemSet), focusoutDelay + 10);
        }

        /**
         * Creates a link between the source element and the target element such that focus moves
         * forward/backward between the two elements - regardless of their actual tab order
         *
         * @function link
         * @param   {Object}    sourceEl         the jQuery element focus moves from
         * @param   {Object}    targetElemSet    the jQuery element set to find a focusable element
         */
        function link(sourceEl, targetElemSet) {
            const targetEl = targetElemSet
                .find(focusSelector)
                .addBack(focusSelector)
                .filter(elemIsFocusable)
                .first();

            if (targetEl.length === 0) {
                return;
            }

            linkedList = linkedList.filter(bundle => !bundle[1].is(targetEl));

            linkedList.push({
                0: sourceEl,
                1: targetEl,
                getDestinationElement: forward => forward ? targetEl : sourceEl
            });
        }

        $.extend({
            link: noSourceLink
        });

        $.fn.link = function (targetElement) {
            link($(this), $(targetElement));
        };

        /**
         * Sets focus on the provided element and updates focus history.
         *
         * @function setFocus
         * @param   {Object}    element     the jQuery element object to set focus on
         * @return  {Promise}   resolves to undefined when focus has been set
         */
        const orginalFocus = $.fn.focus;
        $.fn.focus = function (takeAction) {
            const el = $(this);

            if (el.length === 0) {
                return;
            }

            const viewer = viewerGroup.contains(el);
            // manually setting focus on viewer element
            if (takeAction && viewer) {
                lockFocus = true;
                orginalFocus.apply(this);
                clearTimeout(focusoutTimerCancel);
                lockFocus = false;

                const histIndex = history.findIndex(elem => elem.is(el));
                if (histIndex !== -1) {
                    history.length = histIndex;
                }

                if (el.is(':focus')) {
                    history.push(el);
                } else {
                    // applying focus didn't work, try going back to a history element
                    shiftFocus(false, true);
                }

            // allow elements outside the viewer to retain normal focus behavior
            } else if (!takeAction && !viewer) {
                orginalFocus.apply(this);
                clearTimeout(focusoutTimerCancel);

            // manual focus being set incorrectly, most likely an outside library
            } else {
                console.warn('Setting focus on viewer elements is not allowed');
            }
        };

        // these event functions are disabled for events stemming from within a viewer. Angular material was, for
        // example, preventing mouse clicks from bubbling for mouse clicks on menu items. In general we want to always
        // see events then decide if they require action
        jQuery.Event.prototype.stopImmediatePropagation = disableCommonPrototypes('stopImmediatePropagation');
        jQuery.Event.prototype.stopPropagation = disableCommonPrototypes('stopPropagation');
        jQuery.Event.prototype.preventDefault = disableCommonPrototypes('preventDefault');
    }

    /**
     * Sets focus on the provided element and updates focus history.
     *
     * @function disableCommonPrototypes
     * @param   {String}    funcName     jQuery event prototype function to disable
     * @return  {Function}  the disabled function
     */
    function disableCommonPrototypes(funcName) {
        return (() => {
            const originalFunc = jQuery.Event.prototype[funcName];
            return function (takeAction) {
                if (takeAction || !viewerGroup.contains($(this.target))) {
                    originalFunc.call(this);
                } else {
                    console.warn(`${funcName} is disabled on viewer elements`);
                }
            };
        })();
    }
})(RV, jQuery);
