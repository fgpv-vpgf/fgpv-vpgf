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
     * `rvFiltersDefault` directive displays the datatable with layer data.
     *
     * @return {object} directive body
     */
    function rvFiltersDefault($timeout, $q, stateManager) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/filters/filters-default.html',
            scope: {},
            link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Add a `createTable` to self. The table, after creation, is assigned to `self.table`.
         * @param  {Object} scope directive scope
         * @param  {Object} el    node element
         */
        function link(scope, el) { //scope, el, attr, ctrl) {
            const self = scope.self;
            let containerNode;

            self.createTable = createTable;
            self.destroyTable = destroyTable;

            /**
             * Creates a new datatables instance (destroying existing if any). It pulls the data from the stateManager display store.
             */
            function createTable() {
                containerNode = containerNode || el.find('.rv-filters-data-container');
                self.destroyTable();

                // forced delay of a 100 to prevent the loading indicator from flickering if the table is created too fast; it's annoying; it means that switching tables takes at least 100ms no matter how small the table is; in majority of cases it should take more than 100ms to get data and create a table anyway;
                const forcedDelay = $q(fulfill =>
                    $timeout(() => fulfill(), 100)
                );

                // create a new table node
                const tableNode = angular.element('<table class="display nowrap rv-data-table"></table>');
                containerNode.append(tableNode);

                // I hate DataTables
                self.table = tableNode
                    .on('init.dt', () => {
                        // turn off loading indicator after the table initialized or the forced delay whichever takes longer; cancel loading timeout as well
                        forcedDelay.then(() => {
                            // TODO: these ought to be moved to a helper function in displayManager
                            stateManager.display.filters.isLoading = false;
                            $timeout.cancel(stateManager.display.filters.loadingTimeout);
                        });
                    })
                    .DataTable({
                        dom: 'rti',
                        columns: stateManager.display.filters.data.columns,
                        data: stateManager.display.filters.data.data,
                        deferRender: true,
                        scrollY: true, // allow verstical scroller
                        scrollX: true, // allow horizontal scroller
                        autoWidth: false, // without autoWidth, few columns will be stretched to fill avaialbe width, and many columns will cause the table to scroll horizontally
                        scroller: true // turn on virtual scroller extension
                    });
            }

            /**
             * Destroys the table and its node if it exists.
             */
            function destroyTable() {
                if (self.table) {
                    // destroy table with all events
                    self.table.destroy(true); //https://datatables.net/reference/api/destroy()
                    delete self.table; // kill the reference
                }
            }
        }
    }

    /**
     * Controller watches for panel morph changes and redraws the table after the change is complete;
     * it also watches for dispaly data changes and re-creates the table when it does change.
     */
    function Controller($scope, $timeout, tocService, stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.filters;

        self.draw = draw;

        let isFullyOpen = false; // flag inicating that filters panel fully opened
        let deferredAction = null; // deferred function to create a table

        activate();

        function activate() {
            // wait for morph on filters panel to complete and redraw the datatable
            $scope.$on('stateChangeComplete', (event, name, property, value) => { //, skip) => {
                if (name === 'filters') {
                    console.log('Filters: ', event, name, property, value); //, skip);
                    self.draw();

                    if (property === 'active') {
                        isFullyOpen = value;

                        if (value && deferredAction) { // if fully opened and table creation was deferred, call it
                            deferredAction.call();
                            deferredAction = null;
                        }
                    }
                }
            });

            // watch filters data for changes; recreate table when data changes
            $scope.$watch('self.display.data', newValue => {
                if (newValue && newValue.data) {
                    //console.log('Filters fullyOpen', isFullyOpen, self.display.isLoading);
                    //console.log('Filters: table data udpated', newValue);
                    if (isFullyOpen) {
                        self.createTable();
                    } else {
                        // we have to deferr table creating until after the panel fully opens, we if try to create the table while the animation is in progress, it freezes as all calculations that Datatables is doing blocks ui;
                        // this means when the panel first opens, it will take 300ms longer to display any table then upon subsequent table creation when the panel is already open and the user just switches between layers;
                        deferredAction = () => self.createTable();
                    }
                } else {
                    // destory table is data is set to null
                    self.destroyTable();
                }
            });
        }

        // re draw the table using scroller extension
        function draw() {
            if (self.table) {
                console.log('Filters: drawing table');
                self.table.scroller.measure();

                //self.table.columns.adjust().draw();
            }
        }
    }
})();
