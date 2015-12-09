(function () {
    'use strict';

    angular.module('app.ui.common')
        .directive('rvState', rvState);

    /**
     * `rvState` directive body. Essentially a modified ngIf directive.
     *
     * @return {object} directive body
     */
    function rvState($animate, stateManager) {
        const directive = {
            multiElement: true,
            transclude: 'element',
            priority: 600,
            terminal: true,
            restrict: 'A',
            link: linkFunc
        };

        return directive;

        /////////////////

        function linkFunc($scope, $element, $attr, ctrl, $transclude) {
            //TODO: Instead of removing the element every time, hide and un-hide it (the reason we arent just using ngIf)
            var block;
            var childScope;
            var previousElements;
            $scope.stateManager = stateManager;

            $scope.$watch('stateManager.get("' + [$attr.rvState] + '")',
                function ngIfWatchAction(value) {
                    if (value) {
                        if (!childScope) {
                            $transclude(function (clone, newScope) {
                                childScope = newScope;

                                //mark the end of the section in the DOM
                                clone[clone.length++] =
                                    document.createComment(
                                        ' end rvState: ' + $attr.rvState + ' '
                                    );

                                // Note: We only need the first/last node of the cloned nodes.
                                // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                // by a directive with templateUrl when its template arrives.
                                block = {
                                    clone: clone
                                };
                                $animate.enter(clone, $element.parent(), $element)
                                .then(() => { //resolve state change after animation ends
                                    stateManager.resolve($attr.rvState);
                                });
                            });
                        }
                    } else {

                        if (previousElements) {
                            previousElements.remove();
                            previousElements = null;
                        }
                        if (childScope) {
                            childScope.$destroy();
                            childScope = null;
                        }
                        if (block) {
                            previousElements = getBlockNodes(block.clone);

                            $animate.leave(previousElements, previousElements.parent())
                            .then(() => { //resolve state change after animation ends
                                stateManager.resolve($attr.rvState);
                            });
                        }
                    }
                });
        }

    }

    // directly from https://github.com/angular/angular.js/blob/4daafd3dbe6a80d578f5a31df1bb99c77559543e/src/Angular.js
    function getBlockNodes(nodes) {
        var node = nodes[0];
        var endNode = nodes[nodes.length - 1];
        var blockNodes;

        for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
            if (blockNodes || nodes[i] !== node) {
                if (!blockNodes) {
                    blockNodes = angular.element([].slice.call(nodes, 0, i));
                }
                blockNodes.push(node);
            }
        }

        return blockNodes || nodes;
    }
})();
