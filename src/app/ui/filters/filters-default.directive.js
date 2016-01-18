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

            /**
             * Creates a new datatables instance (destroying existing if any). It pulls the data from the stateManager display store.
             */
            function createTable() {
                containerNode = containerNode || el.find('.rv-filters-data-container');

                if (self.table) {
                    // destroy table with all events
                    self.table.destroy(true); //https://datatables.net/reference/api/destroy()
                    delete self.table; // kill the reference
                }

                // create a new table node
                const tableNode = angular.element('<table class="display nowrap rv-data-table"></table>');
                containerNode.append(tableNode);

                self.table = tableNode
                    .on('init.dt', () => {
                        // turn off loading indicator after the table initialized; cancel loading timeout as well
                        stateManager.display.filters.isLoading = false;
                        $timeout.cancel(stateManager.display.filters.loadingTimeout);

                        console.log('Filters: Table initialisation complete: ' + new Date().getTime());
                    })
                    .DataTable({
                        dom: 'rti',
                        columns: stateManager.display.filters.data.columns,
                        data: stateManager.display.filters.data.data,
                        deferRender: true,
                        scrollY: true,
                        scroller: true
                    });
            }
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
            $scope.$on('stateChangeComplete', (event, name) => { //, property, value, skip) => {
                if (name === 'filters') {
                    //console.log('Filters: ', event, name, property, value, skip);
                    self.draw();
                }
            });

            // watch filters data for changes; recreate table when data changes
            $scope.$watch('self.display.data', newValue => {
                if (newValue.data) {
                    //console.log('Filters: table data udpated', newValue);
                    self.createTable();
                }
            });
        }

        // re draw the table using scroller extension
        function draw() {
            if (self.table) {
                //console.log('Filters: drawing table');
                self.table.scroller.measure();
            }
        }
    }
})();
