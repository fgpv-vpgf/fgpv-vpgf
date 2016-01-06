(() => {

    /**
     * @ngdoc directive
     * @name rvFiltersDefault
     * @module app.ui.filters
     * @description
     *
     * The `rvFiltersDefault` directive is a filters and datatable panel component.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersDefault', rvFiltersDefault);

    /**
     * `rvFiltersDefault` directive body.
     *
     * @return {object} directive body
     */
    function rvFiltersDefault($timeout) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-default.html',
            scope: {},
            link: linkFunc,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Skeleton link function.
         */
        function linkFunc(scope, el) { //scope, el, attr, ctrl) {
            const self = scope.self;

            $timeout(() => {

                let table = el.find('.rv-data-table')
                    .first()
                    .DataTable({
                        dom: 'rti',
                        ajax: 'content/fake_data.json',
                        deferRender: true,
                        scrollY: true,
                        scroller: true,
                        columns: [
                            {
                                title: 'ID'
                            },
                            {
                                title: 'First Name'
                            },
                            {
                                title: 'Last Name'
                            },
                            {
                                title: 'ZIP'
                            },
                            {
                                title: 'Country'
                            }
                        ]
                    });

                self.table = table;
            }, 10000);
        }
    }

    /**
     * Skeleton controller function with test message.
     */
    function Controller(tocService) {
        'ngInject';
        const self = this;

        self.display = tocService.display.filters;

        self.draw = () => {
            self.table.scroller.measure();
        };

        activate();

        function activate() {

        }
    }
})();
