(() => {

    // jscs:disable maximumLineLength
    const ZOOM_TO_ICON = '<md-icon class="rv-icon rv-zoom-to" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g id="zoom_in"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></g></svg></md-icon>';
    // jscs:enable maximumLineLength

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

                const requester = stateManager.display.filters.requester;
                const displayData = stateManager.display.filters.data;

                // forced delay of a 100 to prevent the loading indicator from flickering if the table is created too fast; it's annoying; it means that switching tables takes at least 100ms no matter how small the table is; in majority of cases it should take more than 100ms to get data and create a table anyway;
                const forcedDelay = $q(fulfill =>
                    $timeout(() => fulfill(), 100)
                );

                // create a new table node
                const tableNode = angular.element('<table class="display nowrap rv-data-table"></table>');
                containerNode.append(tableNode);

                // add icons and zoom to button only to the feature layers
                // TODO: remove when symbology for dynamic layers is sorted out and zoom to for dynamic layers is sorted out
                if (requester.legendEntry.layerType === 'esriFeature') {

                    // add symbol as the first column
                    // TODO: formatLayerAttributes function should figure out icon and store it in the attribute bundle
                    if (!displayData.data[0].hasOwnProperty('rvSymbol')) {
                        displayData.data.forEach((row, index) => {
                            const objId = row[displayData.oidField];
                            const renderer = geoService.layers[requester.layerId].layer.renderer;
                            const legend = requester.legendEntry.symbology;

                            // FIXME: mock fdata object for this particular item
                            // This will likely change with the new symbology generator
                            const fData = {
                                features: {
                                    [index]: {
                                        attributes: row
                                    }
                                },
                                oidIndex: {
                                    [objId]: index
                                }
                            };

                            const symbol = geoService.retrieveSymbol(objId, fData, renderer, legend);
                            row.rvSymbol = `<div class="rv-wrapper rv-symbol"><img src="${symbol}" /></div>`;
                        });

                        displayData.columns.unshift({
                            data: 'rvSymbol',
                            title: '',
                            orderable: false
                        });
                    }

                    // TODO: try to compile an angular compoent and insert that instead maybe with a normal click handler ???
                    // FIXME: turn this into a real button for keyboard accessibility
                    // get the first column after the symbol column
                    const interactiveColumn = displayData.columns.find(column =>
                        column.data !== 'rvSymbol');
                    addColumnInteractivity(interactiveColumn);
                }

                // ~~I hate DataTables~~ Datatables are cool!
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
                        columns: displayData.columns,
                        data: displayData.data,
                        order: [],
                        deferRender: true,
                        scrollY: true, // allow vertical scroller
                        scrollX: true, // allow horizontal scroller
                        autoWidth: false, // without autoWidth, few columns will be stretched to fill avaialbe width, and many columns will cause the table to scroll horizontally
                        scroller: {
                            displayBuffer: 3 // we tend to have fat tables which are hard to draw -> use small buffer https://datatables.net/reference/option/scroller.displayBuffer
                        }, // turn on virtual scroller extension
                        /*select: true,*/ // allow row select,
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

                self.table.on('click', 'md-icon.rv-zoom-to', event => {
                    const tr = $(event.target).closest('tr');
                    const row = self.table.row(tr);

                    // get object id from row data
                    const objId = row.data()[displayData.oidField];
                    const layer = geoService.layers[requester.layerId].layer

                    geoService.zoomToGraphic(layer, objId);
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

            // TODO: add details button
            /**
             * Adds zoom and details buttons to the column provided.
             * @param {Object} column from the formatted attributes bundle
             */
            function addColumnInteractivity(column) {
                // use render function to augment button to displayed data when the table is rendered
                column.render = (data) => {
                    return `<div class="rv-wrapper rv-icon-16"><span class="rv-data">${data}</span>${ZOOM_TO_ICON}</div>`;
                };
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
