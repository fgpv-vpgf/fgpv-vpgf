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
    function rvFiltersDefault($timeout, stateManager) {
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
            stateManager.state.filtersFulldata.display.isLoading = true;

            $timeout(() => {
                let table = el.find('.rv-data-table')
                    .first()
                    .on('init.dt', function () {
                        // wait for table to initialize fully: https://datatables.net/reference/event/init
                        stateManager.state.filtersFulldata.display.isLoading = false;
                        scope.$digest(); // need to kick in the digest cycle since we are using non-Angular even here.
                        self.draw();

                        //console.log('Table initialisation complete: ' + new Date().getTime());
                    })
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

        self.display = stateManager.state.filtersFulldata.display;

        self.draw = draw;

        activate();

        function activate() {
            // wait for morph on filters panel to complete and redraw the datatable
            $scope.$on('stateChangeComplete', (event, name, property, value, skip) => {
                console.log(event, name, property, value, skip);
                if (name === 'filters') {
                    self.draw();
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
