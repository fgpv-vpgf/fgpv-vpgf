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

            // FIX: generating datatble in the hidden node is a bit funky, so there is a delay to let us open the panel
            // to see the table;
            // obviously it shouldn't be happening in production.
            // TODO: write proper logic to generate the table while hidden and then redraw it on show
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
            }, 10000); // wait for ten seconds so we can open data panel
        }
    }

    /**
     * Skeleton controller function with test message.
     */
    function Controller($scope, $timeout, tocService, stateManager) {
        'ngInject';
        const self = this;

        $scope.stateManager = stateManager;

        self.display = tocService.display.filters;

        self.draw = draw;

        activate();

        function activate() {
            // TODO: watching mode change on stateManager is triggered when variable changes, no callback upon
            // completing the transtion, that's why we need a delay here; update this after stateManager refactor
            $scope.$watch('stateManager.getMode("filters")', newValue => {
                if (newValue) {
                    console.log(newValue, 'reDRAW!');
                    $timeout(self.draw, 1000);
                }
            });
        }

        // re draw the table using scroller extension
        function draw() {
            if (self.table) {
                self.table.scroller.measure();
            }
        }
    }
})();
