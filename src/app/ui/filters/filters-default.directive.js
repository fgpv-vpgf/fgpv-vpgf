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
            let containerNode;

            self.createTable = createTable;

            function createTable() {
                if (!containerNode) {
                    containerNode = el.find('.rv-filters-data-container');
                }

                if (self.table) {
                    // destroy table with all events
                    self.table.destroy(true); //https://datatables.net/reference/api/destroy()
                    delete self.table; // kill the reference
                }

                let tableNode = angular.element('<table class="display nowrap rv-data-table"></table>');
                containerNode.append(tableNode);

                //let tableInitialized = false;
                console.log(containerNode, tableNode);

                //.clear()

                self.table = tableNode
                    .on('init.dt', () => {
                        // wait for table to initialize fully: https://datatables.net/reference/event/init

                        //scope.$digest(); // need to kick in the digest cycle since we are using non-Angular event here.
                        //tableInitialized = true;

                        stateManager.display.filters.isLoading = false;

                        //self.draw();
                        console.log('Table initialisation complete: ' + new Date()
                            .getTime());
                    })
                    .DataTable({
                        dom: 'rti',
                        columns: stateManager.display.filters.data.columns,
                        data: stateManager.display.filters.data.data,
                        deferRender: true,
                        scrollY: true,
                        scroller: true
                    });

                //self.table = table;
                /*if (tableInitialized) {
                    self.draw();
                    self.table.destroy(true);
                }*/
            }

            // FIX: generating datatble in the hidden node is a bit funky, so there is a delay to let us open the panel
            // to see the table;
            // obviously it shouldn't be happening in production.
            // TODO: write proper logic to generate the table while hidden and then redraw it on show
            //stateManager.state.filtersFulldata.display.isLoading = true;

            /*$timeout(() => {
                let table = el.find('.rv-data-table')
                    .first()
                    .on('init.dt', function () {
                        // wait for table to initialize fully: https://datatables.net/reference/event/init
                        //stateManager.state.filtersFulldata.display.isLoading = false;
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
            }, 10000); // wait for ten seconds so we can open data panel*/
        }
    }

    /**
     * Skeleton controller function with test message.
     */
    function Controller($scope, $timeout, tocService, stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.filters;

        self.draw = draw;

        activate();

        function activate() {
            // wait for morph on filters panel to complete and redraw the datatable
            $scope.$on('stateChangeComplete', (event, name, property, value, skip) => {
                if (name === 'filters') {
                    console.log(event, name, property, value, skip);
                    self.draw();
                }
            });

            console.log(self.display);
            $scope.$watch('self.display.data', newValue => {
                if (newValue.data) {
                    self.createTable();
                }
                console.log(newValue);
            });
        }

        // re draw the table using scroller extension
        function draw() {
            console.log('drawing', self.table);
            if (self.table) {
                self.table.scroller.measure();
            }
        }
    }
})();
