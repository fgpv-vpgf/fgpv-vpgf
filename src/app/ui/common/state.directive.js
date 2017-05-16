// FIXME add top level docs
angular.module('app.ui')
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

    /***************/

    function linkFunc(scope, element, attr) {
        scope.stateManager = stateManager;

        scope.$watch(`stateManager.state.${attr.rvState}.active`,
            value => {
                let skip = stateManager.state[attr.rvState].activeSkip;

                // check if the transition should be animated
                if (!skip) { // animate hide/show
                    $animate[value ? 'removeClass' : 'addClass'](
                        element, 'ng-hide',
                        {
                            tempClasses: 'ng-hide-animate'
                        })
                        .then(() => callback()); // resolve state change after animation ends
                } else { // hide/show element without animating it
                    element[value ? 'removeClass' : 'addClass']('ng-hide');
                    callback();
                }
            }
        );

        function callback() {
            stateManager.callback(attr.rvState, 'active');
        }
    }
}
