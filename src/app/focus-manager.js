/* global RV, jQuery */
// eslint-disable-next-line max-statements

// delay in milliseconds from time focus is lost to when action is taken
const focusoutDelay = 200;
// all the possible states a viewer can be in - only one at any given time
const statuses = {
    NONE: undefined,
    INACTIVE: 'NOT_ACTIVE',
    WAITING: 'WAITING',
    ACTIVE: 'ACTIVE'
};
// focus selectors we want to target
const focusSelector = [
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'md-select:not([disabled])',
    'md-checkbox:not([disabled])',
    'md-switch:not([disabled])',
    'md-slider:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled]):not([nofocus])',
    '.rv-esri-map',
    '[tabindex=-2]',
    '[tabindex=-3]'
].join(', ');

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
// when true focus manager will only consider history elements for focus movement
let restoreFromHistory = false;
// true between the time a mouse click occurs and the tab key is pressed
// clicking on an element moves focus to the closest parent focusable element since for example
// clicking on an icon in a button should place focus on the button, the icon is not a valid focusable element
// during traversal focus is lost until a valid target is reached. We want to ignore focus loss during this process.
// We are guaranteed to reach a valid target during traversal so there is no need for focusout intervention.
let ignoreFocusLoss = false;

const jQwindow = $(window);

/**
 * Represents one viewer on a page, with multiple viewers being possible. Tracks viewer state,
 * determines if elements belong to it, and stores limited angular services passed in.
 */
class Viewer {
    /**
     * @param   {Object}    rootElem - jQuery or HTML element node of the angular viewer, equivalent to $rootElement
     * @param   {Object}    mdDialog  - angular material $mdDialg object reference
     */
    constructor (rootElem, mdDialog, isFullscreen) {
        this.rootElement = $(rootElem);
        this.id = this.rootElement.attr('id');
        this.status = statuses.INACTIVE;
        this.isFullscreen = isFullscreen;

        this.mdDialog = mdDialog;
        this._mdDialogLock = false;
        this._mdDialogChain = [];

        if (this.isFullscreen) {
            this.setStatus(statuses.ACTIVE);
        }
    }

    /**
     * Executes the callback function which performs some angular material dialog action.
     * $mdDialog ignores actions while it is in the middle of an animation, so this method queues
     * the callbacks so that the are fired in order when $mdDialog is ready.
     *
     * Note that dialogCallback must return a promise that resolves when $mdDialog is in a ready state
     *
     * @param   {Function}  dialogCallback       a function to be invoked when $mdDialog is ready (must return a promise)
     * @param   {Boolean}   doNotQueue  internal method use for recursion, do not set
     */
    setDialogAction (dialogCallback, doNotQueue = false) {
        if (this._mdDialogLock && !doNotQueue) {
            // indicates dialog animation in progress, will resolve at a later time from queue
            this._mdDialogChain.push(dialogCallback);

        // no animation in progress implies an empty queue, start resolving dialogCallback
        } else {
            this._mdDialogLock = true;
            // Starting animation callback
            dialogCallback().then(() => {
                // Animation has completed, however the queue may have pending items
                // If this is the case start recursing from front of queue
                // This also takes care of queue items being added during recursions
                if (this._mdDialogChain.length > 0) {
                    this.setDialogAction(this._mdDialogChain.shift(), true);
                } else {
                    // Queue is empty, release the lock
                    this._mdDialogLock = false;
                }
            });
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
            this.setDialogAction(this.mdDialog.hide);
        }

        this.status = status;
        // add attribute to the rootElement so angular directives can be aware of their focus state
        this.rootElement.attr('rv-focus-status', status);
        return this;
    }

    /**
     * Determines if a given element is a part of this viewer. This includes elements which are either trapped inside a viewer, or are
     * declared as being a member of a viewer.
     *
     * @param   {Object}    el      jQuery element object to check if contained in this viewer
     * @return  {Object}    this viewer instance if contained, undefined otherwise
     */
    contains (el) {
        const container = el.closest(`[rv-focus-member="${this.id}"]`);
        return container.length > 0 || this.trapped(el) ? this : undefined;
    }

    /**
     * Determines if a given element is trapped inside a viewer. When strict is true, the element must be trapped directly by the rootElement.
     * @param   {Object}    el      jQuery element object to check if contained in this viewer
     * @param   {Boolean}   strict  whether the element must strictly be a direct child of the viewers focus trap
     * @return  {Object}    this viewer instance if contained, undefined otherwise
     */
    trapped (el, strict = false) {
        const trap = el.closest(`[rv-trap-focus="${this.id}"]`);
        return (strict && trap.is(this.rootElement)) || (!strict && trap.length > 0) ? this : undefined;
    }

    /**
     * Removes the tabindex for all elements of the viewer except the map and allowed negative values so that when a user tabs
     * during a waiting state, the next focusable element outside the viewer is focused. This also
     * solves an issue where focus cannot be manually set to the browsers url bar, which in turn causes
     * focus to be trapped inside the document body.
     */
    clearTabindex () {
        this.rootElement
            .find(focusSelector)
            .not('.rv-esri-map')
            .not('[tabindex=-2]')
            .not('[tabindex=-3]')
            .attr('tabindex', '-1');
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
     * Returns the viewer, if one exists, that element is trapped inside
     * @param   {Object}    el - jQuery element object to check if contained in any viewer
     * @return  {Object}    Viewer instance which contains the element, or undefined if not contained
     */
    trapped (el) {
        return this.viewerList.find(v => v.trapped(el));
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
    addViewer
};

/**
 * Creates a new Viewer instance and adds it to ViewerGroup
 * @param   {Object}    rootElem - jQuery or HTML element node of the angular viewer, equivalent to $rootElement
 * @param   {Object}    mdDialog  - angular material $mdDialg object reference
 */
function addViewer(rootElem, mdDialog, isFullscreen) {
    if (!viewerGroup.trapped(rootElem)) {
        viewerGroup.add(new Viewer(rootElem, mdDialog, isFullscreen));
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
// eslint-disable-next-line complexity
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
                // however if focus should be leaving a fullpage viewer, do not wrap an return an empty element (none found)
                const viewer = viewerGroup.contains(element);
                return element.is(viewer.rootElement) && viewer.isFullscreen ?
                    $() : focusableSearch(refElem, !forward, true);
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
        !el.parents().hasClass('md-leave-add') &&
        !el.is('[nofocus]');
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
        lastVisibleHistoryElement().rvFocus();

    } else if (link && link[0][0] !== link[1][0]) {     // check that the link created is not the element with itself
        // goto target if focusable
        if (link.getDestinationElement(forward).is(elemIsFocusable)) {
            link.getDestinationElement(forward).rvFocus();
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
        focusSearch.rvFocus();
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
    const viewer = viewerGroup.contains(evtTarget); // check if the viewer was clicked

    // fixes issue where md-backdrop is briefly created outside the viewer, and on click makes the waiting dialog appear
    // ignoring the click when it happens on an md-backdrop
    if (evtTarget.is('md-backdrop')) {
        return;
    }

    if (!viewer) {
        viewerGroup.deactivate();
        return;
    }

    // disable scroll just once to prevent the page scrolling the viewer into the full view which is quite annoying
    // fgpv-vpgf/fgpv-vpgf#2665
    const oldScroll = jQwindow.scrollTop();
    jQwindow.one('scroll', () =>
        jQwindow.scrollTop(oldScroll));

    ignoreFocusLoss = true;
    viewer.setStatus(statuses.ACTIVE);
    evtTarget
        .closest('.rv-esri-map, ' + focusSelector)
        .rvFocus();
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
    const viewer = viewerGroup.trapped(targetEl);

    // only care if viewer is inactive
    if (!viewer || viewer.status !== statuses.INACTIVE) {
        return;
    }

    history.push(targetEl);
    viewer.setStatus(statuses.WAITING);

    viewer.setDialogAction(() =>
        viewer.mdDialog
            .show({
                contentElement: viewer.rootElement.find('.rv-focus-dialog-content > div'),
                clickOutsideToClose: false,
                escapeToClose: false,
                disableParentScroll: false,
                parent: viewer.rootElement.find('rv-shell'),
                focusOnOpen: false
            })
            .then(() => viewer.clearTabindex()));
}

/**
 * Handles document keydown event when viewer focus management is active.
 *
 * @private
 * @function onKeydown
 * @param  {Object} event the keydown event object
 */
// eslint-disable-next-line complexity
function onKeydown(event) {
    /*jshint maxcomplexity:12 */
    const viewerActive = viewerGroup.status(statuses.ACTIVE);
    const viewerWaiting = viewerGroup.status(statuses.WAITING);
    const hasFocus = $(document.activeElement);
    keys[event.which] = true;

    if (viewerActive) {
        // set viewer inactive but allow tab action to be handled by the browser
        if (event.which === 9 && keys[27]) { // escape + tab keydown
            viewerActive.setStatus(statuses.INACTIVE);

        } else if (event.which === 9) { // tab keydown only
            ignoreFocusLoss = false;
            const shiftState = shiftFocus(!event.shiftKey, restoreFromHistory);
            // prevent browser from changing focus iff our change took effect OR ours failed but did so on a non-direct child of the viewer trap
            // In general we ALWAYS want to prevent browser focus movements but on full page viewers shiftfocus will fail (correct behaviour) so we
            // want to allow the browser to take over so that focus can move to the url.
            event.preventDefault(shiftState || !viewerActive.trapped(hasFocus, true));
            restoreFromHistory = false;

        // allow arrow key movement (up, down) on menu items. preventDefault not needed as arrow keys are not handled by the browser
        } else if (event.which === 38 || event.which === 40) {
            const isMenuItem = hasFocus.closest('md-menu-content').length > 0;
            if (isMenuItem) {
                shiftFocus(event.which === 40);
            }
        }

    } else if (viewerWaiting) {
        if (event.which === 13 || event.which === 32) { // enter or spacebar
            event.preventDefault(true);
            viewerWaiting.setStatus(statuses.ACTIVE);

        } else if (event.which === 9) { // tab key
            viewerWaiting.clearTabindex();
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

    if (ignoreFocusLoss) {
        return;
    }

    const viewer = viewerGroup.status(statuses.ACTIVE);
    if ($(event.target).closest('[rv-ignore-focusout]').length > 0) {
        restoreFromHistory = true;

    } else if (viewer && !lockFocus && event.relatedTarget === null) {
        // Allow for a short time as determined by focusoutDelay in milliseconds so that when focus
        // leaves unexpectedly, focus can be manually set and we don't need to be back through history
        // Animations often cause focus loss when, for example, one element is being hidden while the
        // element we want focus on is being shown.
        focusoutTimerCancel = setTimeout(() => {
            // check if focus is still off the viewer after the delay - if so shift focus back
            if (!viewer.trapped($(document.activeElement))) {
                shiftFocus(false, true);
            }
        }, focusoutDelay);
    }
}

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

// sets focus on the next focusable element starting at the currently scoped element
$.fn.nextFocus = function () {
    focusableSearch($(this), true).rvFocus();
};

// move original focus implementation to new prototype property for later use for approved movement
HTMLElement.prototype.origfocus = HTMLElement.prototype.focus;

/**
 * Sets focus on the provided element if the provided element is contained in the viewer, or is a viewer component.
 *
 * You may not use this method if the element is not part of a viewer.
 *
 * @function rvFocus
 * @param   {Object}    opts    configuration obect for setting focus, currently only supports on property (delay) which is the amount of time to delay a focus movement.
 */
HTMLElement.prototype.rvFocus = $.fn.rvFocus = function (opts = {}) {
    const jqueryElem = $(this);
    const elem = jqueryElem[0];

    if (!viewerGroup.trapped(jqueryElem) && !opts.exempt) {
        console.warn('focusManager', 'You cannot use *rvFocus* on elements that are outside the viewer');
        return;
    }

    // Calling rvFocus implies the viewer should be active, unless there is no viewer registered which throws an error. Default to normal focus.
    try {
        viewerGroup
            .contains(jqueryElem)
            .setStatus(statuses.ACTIVE);
    } catch(e) {
        elem.origfocus(); // browser implementation
    }

    // clear any delayed focus movements
    clearTimeout(focusoutTimerCancel);

    const focusDelay = opts.delay ? opts.delay : 0;
    setTimeout(() => {
        // starting focus movement
        lockFocus = true;
        elem.origfocus(); // browser implementation
        lockFocus = false;

        // check focus history, if exists make it last element in history, else do nothing
        const histIndex = history.findIndex(elem => elem.is(jqueryElem));
        history.length = histIndex !== -1 ? histIndex : history.length;

        if (jqueryElem.is(':focus')) {
            history.push(jqueryElem);
        } else {
            // applying focus didn't work, try going back to a history element
            shiftFocus(false, true);
        }
    }, focusDelay);
};

/**
 * Wrapper for original focus which does not affect the use of focus() on non-viewer elements.
 *
 * You may not use this method if the element is a part of a viewer.
 *
 * @function focus
 */
HTMLElement.prototype.focus = $.fn.focus = function () {
    const el = $(this);

    const initElem = el.closest('[rv-focus-init]');
    const exemptElem = el.closest('[rv-focus-exempt]');
    const isAllowedInitFocus = initElem.length > 0 && !$.contains(initElem[0], document.activeElement);
    const isAllowedByExemption = exemptElem.length > 0;
    const isAllowedByTabIndex = el.attr('tabindex') === '-3';

    // allow caller to set initial focus if scoped element or any ancestor has attribute rv-focus-init
    if (isAllowedInitFocus || isAllowedByTabIndex || isAllowedByExemption) {
        // must process via rvFocus so that FM is aware of the change, and can add it to the history.
        // otherwise calling origfocus bypasses FM, which makes it think focus is being lost and tries to recover
        el[0].rvFocus({ exempt: true }); // more performant to use el[0] instead of el, since jQuery focus is implemented on HTMLElement.prototype.focus

    } else if (viewerGroup.trapped(el)) {
        console.warn('focusManager', `*rvFocus* must be used to set focus ` +
            `on elements that are a part of the viewer`);
        return;
    } else {
        el[0].origfocus();
    }
};

// these event functions are disabled for events stemming from within a viewer. Angular material was, for
// example, preventing mouse clicks from bubbling for mouse clicks on menu items. In general we want to always
// see events then decide if they require action
jQuery.Event.prototype.stopImmediatePropagation = disableCommonPrototypes('stopImmediatePropagation');
jQuery.Event.prototype.stopPropagation = disableCommonPrototypes('stopPropagation');
jQuery.Event.prototype.preventDefault = disableCommonPrototypes('preventDefault');

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
            if (takeAction || !viewerGroup.trapped($(this.target))) {
                originalFunc.call(this);
            } else {
                console.warn('focusManager', `*${funcName}* is disabled on elements ` +
                    `inside or part of the viewer`);
            }
        };
    })();
}

// Watches body for element insertions for more "fine grained control" of host page elements.
const bodyObserver = new MutationObserver(mutations => {
    mutations
        .filter(m => m.type === 'childList' && m.addedNodes && m.addedNodes.length > 0)
        .forEach(m => {
            const nodeList = m.addedNodes;
            nodeList.forEach(node => {
                /** ----- AM Menu Component -----
                 * We allow the angular material menu component to set its own initial focus by default. However when there is no focusable
                 * element in the component, AM does not set focus which leaves focus on the triggering element. This is turn makes it impossible to close
                 * the menu using the escape key.
                 *
                 * The solution is to predict if a focusable element exists, and if not to set focus on the overall menu element.
                 */
                const angularMenu = $(node).first().find('md-menu-content');
                if (angularMenu.length > 0 && angularMenu.find(focusSelector).length === 0) {
                    angularMenu.attr('tabindex', '-1');
                    angularMenu.rvFocus();
                }
            });
        });
});

bodyObserver.observe(document.body, { attributes: false, childList: true });
