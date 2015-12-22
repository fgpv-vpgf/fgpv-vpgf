(function () {
    'use strict';

    angular.module('app.ui.common')
        .directive('rvState', rvState);

    /**
     * `rvState` directive body. Essentially a modified ngShow directive. If the state change is animated, the directive notifies `StateManger` upon its completion.
     *
     * @return {object} directive body
     */
    function rvState($animate, stateManager) {
        const directive = {
            multiElement: true,
            restrict: 'A',
            link: linkFunc
        };

        return directive;

        /////////////////
        function linkFunc(scope, element, attr) {
            scope.stateManager = stateManager;

            scope.$watch('stateManager.get("' + [attr.rvState] + '")',
                value => {
                    // check if the transition should be animated
                    if (stateManager.isAnimated(attr.rvState)) { // animate hide/show
                        $animate[value ? 'removeClass' : 'addClass'](element, 'ng-hide', {
                            tempClasses: 'ng-hide-animate'
                        })
                        .then(() => { // resolve state change after animation ends
                            stateManager.resolve(attr.rvState);
                        });
                    } else { // hide/show element without animating it
                        element[value ? 'removeClass' : 'addClass']('ng-hide');
                        stateManager.resolve(attr.rvState);
                    }
                }
            );
        }
    }
})();
