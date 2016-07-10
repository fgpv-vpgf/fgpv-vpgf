(() => {
    // jscs:disable maximumLineLength
    const ZOOM_TO_ICON = (tooltip, disabled) => `<md-icon class="${disabled ? 'disabled' : 'rv-icon'} rv-zoom-to" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g id="zoom_in"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></g></svg><md-tooltip role="tooltip"><div class="md-content md-show"><span>${tooltip}</span></div></md-tooltip></md-icon>`;
    const DETAILS_ICON = tooltip => `<md-icon class="rv-icon rv-description" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g id="description"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></g></svg><md-tooltip role="tooltip"><div class="md-content md-show"><span>${tooltip}</span></div></md-tooltip></md-icon>`;
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
    function rvFiltersDefault($timeout, $q, stateManager, $compile, geoService, $translate, layoutService) {
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

            layoutService.panes.filter = el;

            /**
             * Creates a new datatables instance (destroying existing if any). It pulls the data from the stateManager display store.
             */
            function createTable(oLang) {
                let zoomText = $translate.instant('filter.tooltip.zoom');
                const descriptionsText = $translate.instant('filter.tooltip.description');

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

                // add symbol as the first column
                // TODO: formatLayerAttributes function should figure out icon and store it in the attribute bundle
                if (!displayData.rows[0].hasOwnProperty('rvSymbol')) {
                    displayData.rows.forEach(row => {

                        let symbol = geoService.retrieveSymbol(row, displayData.renderer);
                        if (!symbol) {
                            // jscs:disable maximumLineLength
                            // TODO: have geoApi symbology detect and set empty gifs
                            symbol = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                            // jscs:enable maximumLineLength
                        }
                        row.rvSymbol = `<div class="rv-wrapper rv-symbol"><img src="${symbol}" /></div>`;
                    });

                    displayData.columns.unshift({
                        data: 'rvSymbol',
                        title: '',
                        orderable: false
                    });
                }

                const disabled = !geoService.validateProj(geoService.layers[requester.layerId]._layer.spatialReference);
                if (disabled) {
                    zoomText = $translate.instant('filter.tooltip.nozoom');
                }

                // TODO: try to compile an angular compoent and insert that instead maybe with a normal click handler ???
                // FIXME: turn this into a real button for keyboard accessibility
                // get the first column after the symbol column
                const interactiveColumn = displayData.columns.find(column =>
                    column.data !== 'rvSymbol');
                addColumnInteractivity(interactiveColumn, [ZOOM_TO_ICON(zoomText, disabled),
                    DETAILS_ICON(descriptionsText)]);

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
                        data: displayData.rows,
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
                        ],
                        oLanguage: oLang
                    });

                self.table.on('click', 'md-icon.rv-zoom-to', event => {
                    const tr = $(event.target).closest('tr');
                    const row = self.table.row(tr);

                    // get object id from row data
                    const objId = row.data()[displayData.oidField];
                    const layer = geoService.layers[requester.layerId];

                    geoService.zoomToGraphic(layer, requester.legendEntry.featureIdx, objId);
                });

                self.table.on('click', 'md-icon.rv-description', event => {
                    const tr = $(event.target).closest('tr');
                    const row = self.table.row(tr);
                    const layerRec = geoService.layers[requester.layerId];

                    // get object id from row data
                    const objId = row.data()[displayData.oidField];

                    // rather than re-calculating the image, hack-extract it from the symbol tag
                    // TODO: create a render function for the rvSymbol column to avoid hack-extracting the symbol from data
                    const imgArr = row.data().rvSymbol.split('"');
                    const img = imgArr[imgArr.indexOf('><img src=') + 1];

                    // faking an object that looks like it was generated by the identify module
                    // TODO use of _layerRecord should probably be changed to not use a private var
                    const detailsObj = {
                        isLoading: false,
                        data: [
                            {
                                name: geoService.getFeatureName(row.data(), layerRec, objId),
                                data: geoService.attributesToDetails(row.data(), displayData.fields),
                                oid: objId,
                                symbology: [
                                    { icon: img }
                                ]
                            }
                        ],
                        requestId: -1,
                        requester: {
                            format: 'EsriFeature',
                            name: requester.name,
                            featureIdx: requester.legendEntry.featureIdx,
                            layerRec
                        }
                    };

                    const details = {
                        data: [detailsObj]
                    };

                    stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);

                    const layer = geoService.layers[requester.layerId];
                    geoService.hilightGraphic(layer, requester.legendEntry.featureIdx, objId);
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

                    // clear hilight when table closes or new table is opened
                    // TODO verify this is the proper location for this line
                    geoService.clearHilight();
                }
            }

            // TODO: add details button
            /**
             * Adds zoom and details buttons to the column provided.
             * @param {Object} column from the formatted attributes bundle
             */
            function addColumnInteractivity(column, icons) {
                // use render function to augment button to displayed data when the table is rendered
                column.render = data => {
                    return `<div class="rv-wrapper rv-icon-16"><span class="rv-data">${data}</span>
                        ${icons.join('')}</div>`;
                };
            }
        }
    }

    /**
     * Controller watches for panel morph changes and redraws the table after the change is complete;
     * it also watches for dispaly data changes and re-creates the table when it does change.
     */
    function Controller($rootScope, $scope, $timeout, $translate, tocService, stateManager, events) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.filters;

        self. setDToLang =  setDToLang;
        self.getDToLang = getDToLang;
        self.draw = draw;

        let isFullyOpen = false; // flag inicating that filters panel fully opened
        let deferredAction = null; // deferred function to create a table

        activate();

        function activate() {
            // wait for morph on filters panel to complete and redraw the datatable
            $scope.$on('stateChangeComplete', (event, name, property, value) => { // , skip) => {
                if (name === 'filters') {
                    console.log('Filters: ', event, name, property, value); // , skip);
                    self.draw(value);

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
                if (newValue && newValue.rows) {
                    // console.log('Filters fullyOpen', isFullyOpen, self.display.isLoading);
                    // console.log('Filters: table data udpated', newValue);
                    if (isFullyOpen) {
                        self.createTable(self.getDToLang());
                    } else {
                        // we have to deferr table creating until after the panel fully opens, we if try to create the table while the animation is in progress, it freezes as all calculations that Datatables is doing blocks ui;
                        // this means when the panel first opens, it will take 300ms longer to display any table then upon subsequent table creation when the panel is already open and the user just switches between layers;
                        deferredAction = () => self.createTable(self.getDToLang());
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

            // load language object on language switch
            $rootScope.$on('$translateChangeSuccess', () => {
                if (self.table) {
                    // to manage language switch on DataTable
                    self.setDToLang();
                    // catch translation done signal
                    self.table.draw();
                }
            });
        }

        // set language for table
        function setDToLang() {
            const newLang = self.getDToLang();
            let oLang = self.table.context[0].oLanguage;

            oLang = Object.assign(oLang, newLang);
        }

        // return translated table language object
        function getDToLang() {
            let oLang = {
                sProcessing: $translate.instant('filter.default.label.processing'),
                sSearch: $translate.instant('filter.default.label.search'),
                sLengthMenu: $translate.instant('filter.default.label.lenght.menu'),
                sInfo: $translate.instant('filter.default.label.info'),
                sInfoEmpty: $translate.instant('filter.default.label.zero'),
                sInfoFiltered: $translate.instant('filter.default.label.filtered'),
                sInfoPostFix: $translate.instant('filter.default.label.postfix'),
                sLoadingRecords: $translate.instant('filter.default.label.loadrec'),
                sZeroRecords: $translate.instant('filter.default.label.zerorecords'),
                sEmptyTable: $translate.instant('filter.default.label.emptytable'),
                oPaginate: {
                    sFirst: $translate.instant('filter.default.label.first'),
                    sPrevious: $translate.instant('filter.default.label.previous'),
                    sNext: $translate.instant('filter.default.label.next'),
                    sLast: $translate.instant('filter.default.label.last')
                },
                oAria: {
                    sSortAscending:  $translate.instant('filter.default.aria.sortasc'),
                    sSortDescending: $translate.instant('filter.default.aria.sortdsc')
                }
            };
            return oLang;
        }

        // redraw the table using scroller extension
        function draw(value) {
            if (self.table) {
                console.log('Filters: drawing table');

                const scroll = self.table.scroller;
                if (value === 'default') {
                    // if scroll down to the bottom of the datatable and switch view from full to default,
                    // scroller.measure() creates blank out when redraw, set measure argument to false
                    scroll.measure(false);

                    // because of no redraw datatable info does not update, set info manually
                    // TODO: make sure it works for French translation as well
                    const info = self.table.containers()[0].getElementsByClassName('dataTables_info')[0];
                    const infos = info.innerText.split(' ');
                    infos[1] = scroll.page().start + 1;
                    infos[3] = scroll.page().end + 1;
                    info.innerText = infos.join(' ');
                } else if (value === 'full') {
                    // if scroll down to the bottom of the datatable, then up a little bit and switch view from default to full,
                    // scroller.measure(false) creates blank out when redraw, set measure argument to true
                    scroll.measure(true);
                }

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
