(() => {
    'use strict';

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
        .module('app.ui.common')
        .directive('rvDragula', rvDragula);

    function rvDragula($compile, dragulaService, keyNames) {
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

            //RV.debugging(['trackFocus']);

            // set container and the mirror container to be the same element as we need
            const dragulaOptions = {
                containers: [el[0]],
                mirrorContainer: el[0]
            };

            // extend default options with extras from the the parent scope
            angular.extend(dragulaOptions, dragulaScope.self[attr.rvDragulaOptions]);

            dragulaService.options(dragulaScope, attr.rvDragula, dragulaOptions);

            // compile original dragula directive in some html without actually inserting it into the page
            $compile(`<div dragula="'${attr.rvDragula}'" dragula-model="${attr.rvDragulaModel}"></div>`)(
                dragulaScope);



            const drake = dragulaService.find(dragulaScope, 'toc-bag')
                .drake;

            let isDragging = false;
            // let isPositionChanged = 0; // +1 for every move up; -1 for every move down; 0 means didn't move or returned to the same

            let dragElement; // item being dragged
            let source; // container of the item being dragged

            const fakeListEndElement = angular.element('<li class="gu-mirror"></li>');
            let realListEndElement;

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

            el.on('keydown', '[rv-drag-handle]', event => {
                const target = angular.element(event.target);

                // if the event target is not a drag handle, exit
                /*if (typeof target.attr('rv-drag-handle') === 'undefined') {
                    return;
                }*/

                // if the target cannot be moved, exit
                if (!drake.canMove(target[0])) { // `canMove` takes a raw dom node
                    return;
                }

                // if source and dragElement cannot be found, exit
                if (!findElements(target[0])) { // TODO: fix
                    return;
                }

                switch (event.keyCode) {
                    case keyNames.ENTER:
                    case keyNames.SPACE:
                        // start or stop dragging mode depending on the state
                        if (!isDragging) {
                            startDragging(event, dragElement, source);
                        } else {
                            cancelDragging(event, dragElement, target, source);

                            scope.$digest(); // run digest cycle so repeater can update the template according to the changed model
                            scope.$applyAsync(() => // schedule setting focus back to the drag handle on a future digest cycle after template is updated
                                focusOnDragHandle(dragElement));
                            scope.$apply(); // kick in another digest cycle, so the call above would fire a soon as possible
                        }
                        break;

                    case keyNames.DOWN_ARROW:

                        if (isDragging) {
                            // get item that will be above the dragElement after drop
                            const targetAboveElement = dragElement.next();
                            let targetBelowElement;

                            // if there is only one item after the dragElement, use fake element added to the list as the targetVelowItem (this is needed by `accepts ` function, read comments there)
                            if (targetAboveElement[0] === realListEndElement[0]) {
                                targetBelowElement = fakeListEndElement;
                            // targetAboveElement will be null, if the dragElement is at the end of the list already
                            } else if (targetAboveElement.length === 0) {
                                return;
                            // get the next item as the targetBelowElement
                            } else  {
                                targetBelowElement = targetAboveElement.next();
                            }

                            tryReorder(target, dragElement, source, targetBelowElement);

                        } else {
                            focusOnDragHandle(dragElement.next());
                        }
                        break;

                    case keyNames.UP_ARROW:
                        if (isDragging) {
                            const targetBelowElement = dragElement.prev();

                            // targetBelowElement will be null if the drag element is a the top of the list
                            if (targetBelowElement.lenght === 0) {
                                return;
                            }

                            tryReorder(target, dragElement, source, targetBelowElement);

                        } else {
                            focusOnDragHandle(dragElement.prev());
                        }
                        break;

                    case keyNames.ESCAPE:
                        // otherwise things like pressing ESC will close the panel instead of cancelling draggign mode
                        if (isDragging) {
                            cancelDragging(event, dragElement, target, source);
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        break;
                    case keyNames.TAB:
                        // cancel dragging mode
                        if (isDragging) {
                            cancelDragging(event, dragElement, target, source);
                        }
                        break;

                    default:
                }

                // kill events when in dragging mode
                if (isDragging) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

            function isContainer(el) {
                return drake.containers.indexOf(el) !== -1;
            }

            function getParent(el) {
                return el.parentNode === window.document ? null : el.parentNode;
            }

            function focusOnDragHandle(element) {
                element.find('[rv-drag-handle]:first').focus();
            }


            function startDragging(event, dragElement, source) {
                isDragging = true;

                realListEndElement = source.last();
                source.append(fakeListEndElement);
                dragElement.addClass('rv-mirror');
                dragulaOptions.rvDragStart(event, dragElement, source);

                angular.element(window.document).on('focusin', focusOutHandler);
            }

            function cancelDragging(event, dragElement, target, source) {
                isDragging = false;

                fakeListEndElement.remove();
                dragElement.removeClass('rv-mirror');
                dragulaOptions.rvDragCancel(event, dragElement, target, source);

                angular.element(window.document).off('focusin', focusOutHandler);
            }

            function focusOutHandler(event) {
                console.log(event);

                if (!$.contains(el[0], event.target)) {
                    cancelDragging(event, dragElement, event.target, source);
                }
            }

            function tryReorder(target, dragElement, source, targetBelowElement) {
                if (!dragulaOptions.accepts(dragElement[0], null, source[0], targetBelowElement[0])) { // dragular accepts takes raw dom nodes
                    return false;
                }

                const dragIndex = source.children().index(dragElement);

                targetBelowElement.before(dragElement); // move the dragElement

                const dropIndex = source.children().index(dragElement);
                const sourceModel = drake.models[0];

                // call dragula drop handler and restart dragging mode
                dragulaOptions.rvDragDrop(event, dragElement, target, source, targetBelowElement);
                dragulaOptions.rvDragStart(event, dragElement, source);

                // update model after the layer has been moved in the map stack
                sourceModel.splice(dropIndex, 0, sourceModel.splice(dragIndex, 1)[0]);

                target.focus(); // reset focus to the drag handle after moving the node

                return true;
            }
        }
    }
})();
