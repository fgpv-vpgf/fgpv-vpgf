(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rdDetailsHtml
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rdDetailsHtml` directive description.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsHtml', rvDetailsHtml);

    function rvDetailsHtml() {
        const directive = {
            restrict: 'E',
            scope: {
                data: '=data'
            },
            link: link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr, ctrl) {
            el.append(scope.self.data);
        }
    }
})();
