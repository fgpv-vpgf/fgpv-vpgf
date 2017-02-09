(() => {
    'use strict';

    /**
     * @module rvHelpSearch
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvHelpSearch` directive provides a search field for the help dialog.
     *
     * TODO: as search is used in a couple of places (datatable, geosearch), turn this into a generic directive to be reused
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvHelpSearch', rvHelpSearch);

    /**
     * `rvHelpSearch` directive body.
     *
     * @function rvHelpSearch
     * @return {object} directive body
     */
    function rvHelpSearch() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/help/help-search.html',
            controller: () => {}
        };

        return directive;
    }
})();
