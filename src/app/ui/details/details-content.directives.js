(() => {
    'use strict';

    /**
     * @module rvDetailsContent
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvDetailsContent` directive renders the data content of details.
     * To improve efficency a document fragment is first created prior to
     * DOM insertion.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsContent', rvDetailsContent);

    /**
     * `rvDetailsContent` directive body.
     *
     * @function rvDetailsContent
     * @return {object} directive body
     */
    function rvDetailsContent() {
        const directive = {
            restrict: 'A',
            templateUrl: 'app/ui/details/details-content.html',
            scope: {
                item: '=rvItem',
                mapPoint: '=rvMapPoint',
                isHidden: '=?rvIsHidden'
            },
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }
})();
