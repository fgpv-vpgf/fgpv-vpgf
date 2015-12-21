(function () {
    'use strict';

    angular.module('app.ui.common')
        .directive('rvState', rvState);

    /**
     * `rvState` directive body. Essentially a modified ngShow directive.
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
                    $animate[value ? 'removeClass' : 'addClass'](element, 'ng-hide', {
                        tempClasses: 'ng-hide-animate'
                    })
                    .then(() => { //resolve state change after animation ends
                        stateManager.resolve(attr.rvState);
                    });
                }
            );
        }
    }
})();
