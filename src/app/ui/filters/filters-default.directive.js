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
    function rvFiltersDefault($timeout, $q, stateManager, $compile, geoService) {
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
        function link(scope, el) { // scope, el, attr, ctrl) {
            const self = scope.self;
            let containerNode;

            self.createTable = createTable;
            self.destroyTable = destroyTable;

            /**
             * Creates a new datatables instance (destroying existing if any). It pulls the data from the stateManager display store.
             */
            function createTable() {
                // TODO: move hardcoded stuff in consts
                containerNode = containerNode || el.find('.rv-filters-data-container');
                self.destroyTable();

                // forced delay of a 100 to prevent the loading indicator from flickering if the table is created too fast; it's annoying; it means that switching tables takes at least 100ms no matter how small the table is; in majority of cases it should take more than 100ms to get data and create a table anyway;
                const forcedDelay = $q(fulfill =>
                    $timeout(() => fulfill(), 100)
                );

                // create a new table node
                const tableNode = angular.element('<table class="display nowrap rv-data-table"></table>');
                containerNode.append(tableNode);

                const renderer = geoService.layers[stateManager.display.filters.requester.id].layer.renderer;
                const legend = geoService.layers[stateManager.display.filters.requester.id].state.symbology;
                console.log('ggggggggggggggg', stateManager.display.filters.requester);
                const fDataPromise = geoService.layers[stateManager.display.filters.requester.id].attribs;
                console.log(fDataPromise);

                // jscs:disable maximumLineLength
                fDataPromise.then(data => {
                    const featureIdx = stateManager.display.filters.data.featureIndex;
                    stateManager.display.filters.data.data.forEach(row => {
                        let fData = data[featureIdx];
                        const objId = row[0];
                        const icon = geoService.retrieveSymbol(objId, fData, renderer, legend);
                        row[0] += ' <img src=\"' + icon + '\" class="symbology-icon" />';
                        row[0] += ' <md-icon md-svg-src="action:visibility" class="ng-scope ng-isolate-scope material-icons" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g id="zoom_in"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></g></svg></md-icon>';
                    });
                    // jscs:enable maximumLineLength

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
                            scrollY: true, // allow vertical scroller
                            scrollX: true, // allow horizontal scroller
                            autoWidth: false, // without autoWidth, few columns will be stretched to fill avaialbe width, and many columns will cause the table to scroll horizontally
                            scroller: {
                                displayBuffer: 3 // we tend to have fat tables which are hard to draw -> use small buffer https://datatables.net/reference/option/scroller.displayBuffer
                            }, // turn on virtual scroller extension
                            select: true, // allow row select,
                            buttons: [
                                // 'excelHtml5',
                                // 'pdfHtml5',
                                {
                                    extend: 'print',
                                    title: self.display.requester.name
                                },
                                {
                                    extend: 'csvHtml5',
                                    title: self.display.requester.name
                                },
                            ]
                        });
                    // on select row and clicking the zoom button
                    self.table.on('select', function (e, dt, type, indexes) {
                        self.table.on('click', 'md-icon.material-icons', function () {
                            // FIXME: Assumes OBJECTID always first column; make it not so
                            const id = dt.context[0].aoData[indexes[0]]._aData[0];
                            const objId = id.split(' ')[0];
                            const layerId = self.display.requester.id;
                            const featureIndex = self.display.data.featureIndex;
                            const layer = geoService.layers[layerId].layer;
                            let layerUrl = layer.url + '/';

                            console.log('EEEEEFFFFFFFGGGGGSSSSSSSSSSSS', geoService.layers[layerId]);

                            if (layer.layerInfos) {
                                layerUrl += featureIndex + '/';
                            }

                            geoService.zoomToGraphic(layerUrl, layer, objId);
                        });
                    });
                });
            }

            /**
             * Destroys the table and its node if it exists.
             */
            function destroyTable() {
                if (self.table) {
                    // destroy table with all events
                    self.table.destroy(true); // https://datatables.net/reference/api/destroy()
                    delete self.table; // kill the reference
                }
            }
        }
    }

    /**
     * Controller watches for panel morph changes and redraws the table after the change is complete;
     * it also watches for dispaly data changes and re-creates the table when it does change.
     */
    function Controller($scope, $timeout, tocService, stateManager, events) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.filters;

        self.draw = draw;

        let isFullyOpen = false; // flag inicating that filters panel fully opened
        let deferredAction = null; // deferred function to create a table

        activate();

        function activate() {
            // wait for morph on filters panel to complete and redraw the datatable
            $scope.$on('stateChangeComplete', (event, name, property, value) => { // , skip) => {
                if (name === 'filters') {
                    console.log('Filters: ', event, name, property, value); // , skip);
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
                    // console.log('Filters fullyOpen', isFullyOpen, self.display.isLoading);
                    // console.log('Filters: table data udpated', newValue);
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

            // wait for print event and print the table
            $scope.$on(events.rvDataPrint, () => {
                console.log('Printing Datatable');

                triggerTableButton(0);
            });

            // wait for data export CSV event and export
            $scope.$on(events.rvDataExportCSV, () => {
                console.log('Exporting CSV Datatable');

                triggerTableButton(1);
            });
        }

        // re draw the table using scroller extension
        function draw() {
            if (self.table) {
                console.log('Filters: drawing table');
                self.table.scroller.measure();

                // self.table.columns.adjust().draw();
            }
        }

        /**
         * Triggers a button on the table with the specified index
         * @param  {Number|String} index button selector: https://datatables.net/reference/api/button()
         */
        function triggerTableButton(index) {
            const button = self.table.button(index);
            if (button) {
                button.trigger();
            }
        }
    }
})();
