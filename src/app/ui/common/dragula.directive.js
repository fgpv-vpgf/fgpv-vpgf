/* global RV */

/**
 * @module rvDragula
 * @memberof app.ui
 * @restrict A
 * @description
 *
 * The `rvDragula` directive is used to workaround angular-dragula propensity of requesting new scopes on the elements.
 * This directive uses inherited scope and the compiles an angular-dragula directive on some random piece of html providing it with proper parameters.
 *
 * `rv-dragula` - [string] name of the dragula bag; mimics the original `dragula` property from the `dragula` directive
 * `rv-dragula-model` - [array] collection to serve as model for dragula reorder; mimics the original `dragula-model` property from the `dragula` directive
 * `rv-dragula-options` - [string] name of the object on the inherited scope (on `self`) providing any overrides for dragule init properies; use this to set up `accept` and other callbacks
 *
 */
angular
    .module('app.ui')
    .directive('rvDragula', rvDragula);

function rvDragula($compile, dragulaService, keyNames, events) {
    const directive = {
        restrict: 'A',
        link: link,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /***/

    function link(scope, el, attr) { // , ctrl) {
        const dragulaScope = scope;

        // recreate dragular instance when projection is changed
        events.$on(events.rvProjectiontChanged, () => {
            createDragular();
        });

        // recreate dragular instance when language is changed
        events.$on(events.rvLanguageChanged, () => {
            createDragular();
        });

        createDragular();

        /**
         * Create dragular instance
         *
         * @function createDragular
         */
        function createDragular() {
            // destroy previous dragular instance
            if (dragulaService.find(dragulaScope, attr.rvDragula)) {
                dragulaService.destroy(dragulaScope, attr.rvDragula);
            }

            // set container and the mirror container to be the same element as we need
            const dragulaOptions = {
                containers: [el[0]],
                mirrorContainer: el[0],
                rvDragCancel: () => { },
                rvDragDrop: () => { },
                rvDragStart: () => { },
                rvDragDropModel: () => { }
            };

            // extend default options with extras from the the parent scope
            angular.extend(dragulaOptions, dragulaScope.self[attr.rvDragulaOptions]);
            dragulaService.options(dragulaScope, attr.rvDragula, dragulaOptions);

            // compile original dragula directive in some html without actually inserting it into the page
            $compile(`<div dragula="'${attr.rvDragula}'" dragula-model="${attr.rvDragulaModel}"></div>`)(
                dragulaScope);

            // get dragula instance of dragula
            const drake = dragulaService.find(dragulaScope, attr.rvDragula)
                .drake;

            keyboardDragula(el, scope, drake, dragulaOptions);
        }
    }

    /**
     * Initializes keyboard dragula.
     * @param  {Object} el             directive element
     * @param  {Object} scope          current scope
     * @param  {Object} drake          dragula instance
     * @param  {Object} dragulaOptions dragula options
     */
    function keyboardDragula(el, scope, drake, dragulaOptions) {
        let isDragging = false; // true when the item is grabbed
        let isReordering = false; // true when the item is moved in dom (used to prevent escaping focus from dropping element)

        let dragElement; // item being dragged
        let source; // container of the item being dragged

        const fakeListEndElement = angular.element('<li class="gu-mirror"></li>');
        let realListEndElement;

        let dragIndex; // start index position
        let dropIndex; // end index position
        let targetBelowElement; // element just below the drop position

        const dragHandleSelector = '[rv-drag-handle] > button';

        // on focusout from the draghandle, drop element and stop dragging if not actively reordering
        el.on('focusout', dragHandleSelector, focusOutHandler);

        // handle keydown events on a drag handle
        el.on('keydown', dragHandleSelector, keyDownHandler);

        return;

        /**
         * Drop element in place if focus moves away from the drag handle when not actively reordering.
         * @param  {Object} event event object
         */
        function focusOutHandler(event) {
            console.log('dragulaDirective', 'event', event,
                `isReordering ${isReordering} isDragging ${isDragging}`);
            if (isDragging && !isReordering) {
                dropElement(event, event.target);
            }
        }

        /**
         * Depending on key pressed, start or stop dragging, move selected item in dom, or move selector up and down the list.
         * @param  {Object} event event object
         */
        function keyDownHandler(event) {
            console.log('dragulaDirective', event.keyCode);
            const target = angular.element(event.target);

            // if the target cannot be moved, exit
            if (!drake.canMove(target[0])) { // `canMove` takes a raw dom node
                return;
            }

            // if source and dragElement cannot be found, exit
            if (!findElements(target[0])) { // take a raw dom node
                return;
            }

            const keySwitch = {
                [keyNames.ENTER]: startOrStop,
                [keyNames.SPACEBAR]: startOrStop,
                [keyNames.DOWN_ARROW]: moveDown,
                [keyNames.UP_ARROW]: moveUp,
                [keyNames.ESCAPE]: escapeStop,
                [keyNames.TAB]: tabStop
            };

            const keyHandler = keySwitch[event.keyCode] || angular.noop;
            keyHandler();

            return;

            function startOrStop() {
                // start or stop dragging mode depending on the state
                if (!isDragging) {
                    startDragging(event);
                } else {
                    dropElement(event, event.target);
                }
            }

            function moveDown() {
                if (isDragging) {
                    // get item that will be above the dragElement after drop
                    const targetAboveElement = dragElement.next();

                    // if there is only one item after the dragElement, use fake element added to the list as the targetVelowItem (this is needed by `accepts ` function, read comments there)
                    if (targetAboveElement[0] === realListEndElement[0]) {
                        targetBelowElement = fakeListEndElement;
                    // targetAboveElement will be null, if the dragElement is at the end of the list already
                    } else if (targetAboveElement.length === 0) {
                        return;
                    // get the next item as the targetBelowElement
                    } else {
                        targetBelowElement = targetAboveElement.next();
                    }

                    moveElement(target);

                } else {
                    setFocusToDragHandle(dragElement.next());
                }

                killEvent(event);
            }

            function moveUp() {
                if (isDragging) {
                    targetBelowElement = dragElement.prev();

                    // targetBelowElement will be null if the drag element is a the top of the list
                    if (targetBelowElement.lenght === 0) {
                        return;
                    }

                    moveElement(target);

                } else {
                    setFocusToDragHandle(dragElement.prev());
                }

                killEvent(event);
            }

            function escapeStop() {
                // otherwise things like pressing ESC will close the panel instead of cancelling draggign mode
                if (isDragging) {
                    dropElement(event, target);
                    killEvent(event);
                }
            }

            function tabStop() {
                // cancel dragging mode
                if (isDragging) {
                    dropElement(event, target);
                }
            }
        }

        /**
         * Kills default and event propagation.
         * @param  {object} event event object
         */
        function killEvent(event) {
            event.preventDefault(true);
            event.stopPropagation(true);
        }

        /**
         * Check if the supplied element is a dragula container
         * @param  {Object}  el raw dom node
         * @return {Boolean}    true if container
         */
        function isContainer(el) {
            return drake.containers.indexOf(el) !== -1;
        }

        /**
         * Returns parent of the supplied element
         * @param  {Object} el raw dom node
         * @return {Object}    parent of the supplied dome node
         */
        function getParent(el) {
            return el.parentNode === window.document ? null : el.parentNode;
        }

        /**
         * Set focus to the drag handle of the supplied dom node if any.
         */
        function setFocusToDragHandle(element) {
            element.find(`${dragHandleSelector}:first`).rvFocus();
        }

        /**
         * Find draggable element and its source from the click event target
         * @param  {Object} item target of the click event
         * @return {Boolean}      true if elements are found; false otherwise
         */
        function findElements(item) {
            dragElement = item;

            while (getParent(dragElement) && isContainer(getParent(dragElement)) === false) {
                dragElement = getParent(dragElement); // drag target should be a top element
                if (!dragElement) {

                    dragElement = undefined;
                    return false;
                }
            }

            // store references
            source = angular.element(getParent(dragElement));
            dragElement = angular.element(dragElement);

            return true;
        }

        /**
         * Starts dragging, adding dragging classes and determines dragindex
         * @param  {Object} event       event object
         * @param  {Object} dragElement element being moved
         * @param  {Object} source      element's parent container
         */
        function startDragging(event) {
            isDragging = true;

            realListEndElement = source.last();
            source.append(fakeListEndElement);
            dragElement.addClass('rv-mirror');
            dragulaOptions.rvDragStart(event, dragElement, source);

            dragIndex = source.children().index(dragElement);
        }

        /**
         * Stops dragging, removes dragging classes and determines dropIndex
         * @param  {Object} event       event object
         * @param  {Object} target      drag handle
         */
        function stopDragging(event, target) {
            isDragging = false;

            fakeListEndElement.remove();
            dragElement.removeClass('rv-mirror');
            dragulaOptions.rvDragCancel(event, dragElement, target, source);

            dropIndex = source.children().index(dragElement);
        }

        /**
         * Moves element in the dom if it's allowed
         * @param  {Object} target             drag handle
         * @return {Boolean}                    true if move is allowed; false otherwise
         */
        function moveElement(target) {
            if (!dragulaOptions.accepts(dragElement[0], null, source[0], targetBelowElement[0])) { // dragular accepts takes raw dom nodes
                return false;
            }

            isReordering = true; // prevents escaping focus from ending dragging

            targetBelowElement.before(dragElement); // move the dragElement
            target.rvFocus(); // reset focus on the drag handle of the moved element

            isReordering = false;

            return true;
        }

        /**
         * Drop the element into its current position and call to reorder layers in the map stack
         * @param  {Object} event  event object
         * @param  {Object} target active draghandle
         */
        function dropElement(event, target) {
            stopDragging(event, target);

            if (dropIndex !== dragIndex) {
                const sourceModel = drake.models[0];

                // call dragula drop handler and restart dragging mode
                dragulaOptions.rvDragDrop(event, dragElement, target, source, targetBelowElement);

                // update model after the layer has been moved in the map stack
                sourceModel.splice(dropIndex, 0, sourceModel.splice(dragIndex, 1)[0]);

                // synchronize the layer order
                dragulaOptions.rvDragDropModel();

                // this is only needed when moving an item down as ng-repeater will yank and reinsert it; when moving the item up; the other element is yanked and reinserted
                scope.$digest(); // run digest cycle so repeater can update the template according to the changed model
                scope.$applyAsync(() => // schedule setting focus back to the drag handle on a future digest cycle after template is updated
                    setFocusToDragHandle(dragElement));
                scope.$apply();
            }
        }
    }
}
