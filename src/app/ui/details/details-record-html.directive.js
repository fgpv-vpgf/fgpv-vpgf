(() => {
    'use strict';

    /**
     * @module rvDetailsRecordHtml
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordHtml` directive inserts raw html identify result into the template.
     * NOTE: "Grounwater information network" returns the whole page with its own JavaScript and CSS styles which try to take over the page. It seems this page also executes its own ajax calls to fetch the data.
     * This can be a security risk as we are executing external JavaScript code.
     * Maybe, instead of trying to render html content inside the details panel, display a link to open a new page with that html content.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsRecordHtml', rvDetailsRecordHtml);

    function rvDetailsRecordHtml() {
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

        function link(scope, el) {
            el.append(scope.self.data);
        }
    }
})();
