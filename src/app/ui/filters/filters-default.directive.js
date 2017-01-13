(() => {
    // button blueprints to be added to the table rows
    // `self` property is named so intentionally, as it will be passed on a scope to the ROW_BUTTON_TEMPLATE
    const ROW_BUTTONS = {
        details: {
            name: 'rv-details-marker',
            scope: null,
            self: {
                isFunction: angular.isFunction,
                icon: 'action:description',
                label: 'filter.tooltip.description',
                tooltip: 'filter.tooltip.description',
                action: angular.noop,
                enabled: true
            }
        },
        zoom: {
            name: 'rv-zoom-marker',
            scope: null,
            self: {
                isFunction: angular.isFunction,
                icon: 'action:zoom_in',
                label: zoom => `filter.tooltip.${zoom ? 'zoom' : 'nozoom'}`,
                tooltip: zoom => `filter.tooltip.${zoom ? 'zoom' : 'nozoom'}`,
                action: angular.noop,
                enabled: true
            }
        }
    };

    // jscs:disable maximumLineLength
    // actual button template
    const ROW_BUTTON_TEMPLATE = (row, disabled) =>
        `<md-button
            aria-label="{{ self.isFunction(self.label) ? self.label(self.enabled) : self.label | translate }}"
            class="md-icon-button rv-icon-16 rv-button-24"
            ng-click="self.action(${row})"
            ng-disabled="${disabled}">

            <md-tooltip ng-if="self.tooltip" md-direction="top">{{ self.isFunction(self.tooltip) ? self.tooltip(self.enabled) : self.tooltip | translate }}</md-tooltip>
            <md-icon md-svg-src="{{ self.isFunction(self.icon) ? self.icon(self.enabled) : self.icon }}"></md-icon>

        </md-button>`;
    // jscs:enable maximumLineLength

    /**
     * @module rvFiltersDefault
     * @memberof app.ui
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
     * @function rvFiltersDefault
     * @return {object} directive body
     */
    function rvFiltersDefault($timeout, $q, stateManager, $compile, geoService, $translate,
        layoutService, detailService, $rootElement, $filter) {

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
         * @function link
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
             *
             * @function createTable
             * @param {Object} oLang    Translation object for the table
             */
            function createTable(oLang) {
                const callbacks = {
                    onTableDraw,
                    onTableInit,
                    onZoomClick,
                    onDetailsClick
                };

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

                // disabled zoom row button if projection is not valid
                const isZoomEnabled = geoService.validateProj(
                    geoService.layers[requester.layerId]._layer.spatialReference);
                ROW_BUTTONS.zoom.self.enabled = isZoomEnabled;

                // assign callbacks to row buttons
                ROW_BUTTONS.details.self.action = row => {
                    const currentLayout = layoutService.currentLayout();
                    if (currentLayout === 'small' || currentLayout === 'medium') {
                        onDetailsClick(row, true);
                    } else {
                        onDetailsClick(row);
                    }
                };

                ROW_BUTTONS.zoom.self.action = onZoomClick;

                // make new common scopes for row buttons
                Object.values(ROW_BUTTONS).forEach(button => {
                    const buttonScope = scope.$new(true);
                    buttonScope.self = button.self;

                    if (button.name === 'rv-zoom-marker') {
                        // disabled zoom button if layer is not visible
                        buttonScope.self.visibility = requester.legendEntry.options.visibility;
                    }

                    button.scope = buttonScope;
                });

                // get the first column after the symbol column
                const interactiveColumn = displayData.columns.find(column =>
                    column.data !== 'rvSymbol');
                addColumnInteractivity(interactiveColumn, ROW_BUTTONS);

                // returns array of column indexes we want in the CSV export
                const exportColumns = (columns) => {
                    // map columns to their ordinal indexes. but mark the symbol column as -1.
                    // then filter out the -1. result is an array of column indexes that
                    // are not the symbol column.
                    return columns
                        .map((column, i) => column.data === 'rvSymbol' ? -1 : i)
                        .filter(idx => idx > -1);
                };

                // returns array of column info where .data field has any period characters escaped
                const escapedColumns = (columns) => {
                    // deep copy so we don't change the displayData.columns array.
                    // that array is used in other places, and messing with it will
                    // break things.
                    const copyArray = angular.copy(columns);
                    copyArray.forEach(column => {
                        column.data = column.data.replace(/\./g, '\\.');
                    });
                    return copyArray;
                };

                // set width from field length if it is a string field type. If it is the oid field,
                // set width to 100px because we have the oid, the details and zoom to button. If it is
                // another type of field, set width to be the title.
                displayData.columns.forEach(column => {
                    const field = displayData.fields.find(field => field.name === column.data);

                    if (typeof field !== 'undefined') {
                        if (field.type === 'esriFieldTypeString') {
                            const width = getColumnWidth(column.title, field.length);
                            column.width = `${width}px`;
                            column.render = renderEllipsis(width);
                        } else if (field.type === 'esriFieldTypeOID') {
                            // set column to be 100px width because of details and zoom to buttons
                            column.width = '100px';
                        } else if (field.type === 'esriFieldTypeDate') {
                            // convert each date cell to a better format
                            displayData.rows.forEach(r => r[field.name] = $filter('dateTimeZone')(r[field.name]));
                        } else {
                            const width = getColumnWidth(column.title);
                            column.width = `${width}px`;
                            column.render = renderEllipsis(width);
                        }
                    } else {
                        // set symbol column width
                        column.width = '30px';
                    }
                });

                // ~~I hate DataTables~~ Datatables are cool!
                self.table = tableNode
                    .on('init.dt', callbacks.onTableInit)
                    .on('draw.dt', callbacks.onTableDraw)
                    .DataTable({
                        dom: 'rti',
                        columns: escapedColumns(displayData.columns),
                        data: displayData.rows,
                        order: [],
                        deferRender: true,
                        scrollY: true, // allow vertical scroller
                        scrollX: true, // allow horizontal scroller
                        autoWidth: false, // without autoWidth, few columns will be stretched to fill avaialbe width, and many columns will cause the table to scroll horizontally
                        scroller: {
                            displayBuffer: 3 // we tend to have fat tables which are hard to draw -> use small buffer https://datatables.net/reference/option/scroller.displayBuffer
                        }, // turn on virtual scroller extension
                        // keys: true, TODO: if enable, we need to set the renderer on the on focus event instead of what we do now. Before we can use this we need to solve a bug with scroller extension.
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
                                title: self.display.requester.name,
                                exportOptions: {
                                    columns: exportColumns(displayData.columns)
                                }
                            }
                        ],
                        oLanguage: oLang
                    });

                /**
                 * Get column width from column title and field length.
                 * @function getColumnWidth
                 * @private
                 * @param {Object} title    column title
                 * @param {Object} length   optional column length (characters)
                 * @param {Object}  maxLength   optional maximum column length (pixels)
                 * @return {Number} width    width of the column
                 */
                function getColumnWidth(title, length = 0, maxLength = 200) {
                    // get title length (minimum 50px)
                    let metricsTitle = getTextWidth(title);
                    metricsTitle = metricsTitle < 50 ? 50 : metricsTitle;

                    // get column length (only type string have length)
                    if (length) {
                        // generate a string with that much characters and get width
                        let metricsContent = getTextWidth(Array(length).join('x'));

                        // set the column length from field length (maximum will be maxLength)
                        metricsContent = metricsContent <= maxLength ? metricsContent : maxLength;

                        // check if it is lower then title length. If so, use title length
                        metricsTitle = metricsContent < metricsTitle ? metricsTitle : metricsContent;
                    }

                    return metricsTitle;
                }

                /**
                 * Render long text width ellipsis (https://datatables.net/blog/2016-02-26)
                 * @function RenderEllipsis
                 * @private
                 * @param {Object} width    column width
                 * @return {String} text    text for td element or string who contain html element
                 */
                function renderEllipsis(width) {
                    const esc = (text) => {
                        return text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;');
                    };

                    return (text, type) => {
                        // order, search and type get the original data
                        if (type !== 'display') {
                            return text;
                        }

                        if (typeof text !== 'number' && typeof text !== 'string') {
                            return text;
                        }

                        text = text.toString(); // cast numbers

                        // if text width smaller then column width, return text
                        if (getTextWidth(text) < width) {
                            return text;
                        }

                        // for wcag we add a text input read only. This element is focusable so we can have tooltips.
                        return `<input type="text" readonly title="${esc(text)}" value="${esc(text)}"
                                    class="rv-render-ellipsis"></input>
                                <span class="rv-render-tooltip">${esc(text)}</span>`;
                    };
                }

                /**
                 * Get text width (http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript)
                 * @function getTextWidth
                 * @private
                 * @param {String} input    text ot calculate width from
                 * @return {Number} width    text width
                 */
                function getTextWidth(input) {
                    // re-use canvas object for better performance
                    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
                    const context = canvas.getContext('2d');
                    context.font = '14px Roboto';

                    return context.measureText(input).width;
                }

                /**
                 * Table initialization callback. This will hide the loading indicator.
                 * @function onTableInit
                 * @private
                 */
                function onTableInit() {
                    // turn off loading indicator after the table initialized or the forced delay whichever takes longer; cancel loading timeout as well
                    forcedDelay.then(() => {
                        // TODO: these ought to be moved to a helper function in displayManager
                        stateManager.display.filters.isLoading = false;
                        $timeout.cancel(stateManager.display.filters.loadingTimeout);
                    });
                }

                /**
                 * Table draw callback. This will replace row placeholder button with real angular directives.
                 * @function onTableDraw
                 * @private
                 */
                function onTableDraw() {
                    console.log('rows are drawn');

                    // find all the button placeholders
                    Object.values(ROW_BUTTONS).forEach(button => {

                        // set the disabled argument value
                        button.disabledArg = (button.name === 'rv-zoom-marker') ?
                            '!self.enabled || !self.visibility.value' : '';

                        // and replace when with properly compiled directives
                        tableNode.find(button.name).each((index, item) => {
                            item = angular.element(item);
                            const row = item.attr('row'); // get the row number of the button

                            const template = ROW_BUTTON_TEMPLATE(row, button.disabledArg);
                            const rowButtonDirective =  $compile(template)(button.scope);

                            item.replaceWith(rowButtonDirective);
                        });
                    });
                }

                /**
                 * Row zoom click handler. Will zoom to the feature clicked.
                 * @function onZoomClick
                 * @private
                 * @param  {Number} rowNumber number of the row clicked
                 */
                function onZoomClick(rowNumber) {
                    const data = self.table.row(rowNumber).data();

                    // get object id from row data
                    const objId = data[displayData.oidField];
                    const layer = geoService.layers[requester.layerId];
                    const zoomLayer = requester.legendEntry;
                    const filterPanel = $rootElement.find('rv-panel[type="filters"]');
                    const otherPanels = $rootElement.find('rv-appbar, rv-mapnav, rv-panel:not([type="filters"])');
                    let ignoreClick = true;

                    geoService.zoomToGraphic(layer, zoomLayer, requester.legendEntry.featureIdx, objId);

                    const removeZoomtoTransparency = () => {
                        otherPanels.removeClass('rv-lt-lg-hide');
                        filterPanel.removeClass('zoomto-transparent');
                        filterPanel.off('.zoomTO');
                        $(window).off('.zoomTo');
                    };

                    otherPanels.addClass('rv-lt-lg-hide');
                    filterPanel.addClass('zoomto-transparent');

                    filterPanel.on('click.zoomTO mousedown.zoomTO touchstart.zoomTO', () =>
                        ignoreClick ? ignoreClick = false : removeZoomtoTransparency()
                    );

                    // ensures that resizing from sm/md to lg and back does not persist transparency
                    $(window).on('resize.zoomTO', () =>
                        layoutService.currentLayout() === 'large' ? removeZoomtoTransparency() : undefined
                    );
                }

                /**
                 * Row details click handler. Will display details for the feature clicked.
                 * @function onDetailsClick
                 * @private
                 * @param  {Number} rowNumber number of the row clicked
                 */
                function onDetailsClick(rowNumber, useDialog = false) {
                    const data = self.table.row(rowNumber).data();
                    const layerRec = geoService.layers[requester.layerId];

                    // get object id from row data
                    const objId = data[displayData.oidField];

                    // faking an object that looks like it was generated by the identify module
                    // TODO use of _layerRecord should probably be changed to not use a private var
                    // TODO: check if the previous todo is no longer valid
                    const detailsObj = {
                        isLoading: false,
                        data: [
                            {
                                name: geoService.getFeatureName(data, layerRec, objId),
                                data: geoService.attributesToDetails(data, displayData.fields),
                                oid: objId,
                                symbology: [
                                    { svgcode: data.rvSymbol }
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

                    if (useDialog) {
                        stateManager.display.details.selectedItem = detailsObj;
                        detailService.expandPanel(false);
                    } else {
                        stateManager.toggleDisplayPanel('mainDetails', details, {}, 0);
                    }

                    const layer = geoService.layers[requester.layerId];
                    geoService.hilightGraphic(layer, requester.legendEntry.featureIdx, objId);
                }

                /**
                 * Adds zoom and details buttons to the column provided.
                 * @function addColumnInteractivity
                 * @param {Object} column from the formatted attributes bundle
                 */
                function addColumnInteractivity(column, buttons) {
                    // use render function to augment button to displayed data when the table is rendered

                    // we have to do some horrible string manipulations because Datatables required the `render` function to return a string
                    // it's not possble to return a compiled directive from the `render` function since directives compile directly into dom nodes
                    // first, button placeholder nodes are rendered as part of the cell data
                    // then, on `draw.dt`, these placeholders are replaced with proper compiled button directives
                    column.render = (data, type, row, meta) => {
                        const buttonPlaceholdersTemplate = Object.values(buttons).map(button =>
                            `<${button.name} row="${meta.row}"></${button.name}>`)
                            .join('');

                        return `<div class="rv-wrapper"><span class="rv-data">${data}</span>
                            ${buttonPlaceholdersTemplate}
                        </div>`;
                    };
                }
            }

            /**
             * Destroys the table and its node if it exists.
             * @function destroyTable
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
        }
    }

    /**
     * Controller watches for panel morph changes and redraws the table after the change is complete;
     * it also watches for dispaly data changes and re-creates the table when it does change.
     * @function Controller
     */
    function Controller($rootScope, $scope, $timeout, $translate, tocService, stateManager, events, filterService,
        configService) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.filters;

        self.draw = draw;

        const languageObjects = {};

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
                            deferredAction();
                            deferredAction = null;
                        }
                    }
                }
            });

            // watch filterService onCreate to make a new table
            $scope.$watch(() => filterService.filterTimeStamps.onCreated, val => {
                if (val !== null) {
                    if (isFullyOpen) {
                        self.createTable(getDToLang());
                    } else {
                        // we have to deferr table creating until after the panel fully opens, we if try to create the table while the animation is in progress, it freezes as all calculations that Datatables is doing blocks ui;
                        // this means when the panel first opens, it will take 300ms longer to display any table then upon subsequent table creation when the panel is already open and the user just switches between layers;
                        deferredAction = () => self.createTable(getDToLang());
                    }
                }
            });

            $scope.$watch(() => filterService.filterTimeStamps.onDeleted, val => {
                if (val !== null) {
                    self.destroyTable();
                }
            });

            $scope.$watch(() => filterService.filterTimeStamps.onChanged, val => {
                if (val !== null) {
                    self.table.draw();
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
                    setDToLang();
                    // catch translation done signal
                    self.table.draw();
                }
            });

            /**
             * Set language for table
             *
             * @function setDToLang
             * @private
             */
            function setDToLang() {

                const newLang = getDToLang();
                let oLang = self.table.context[0].oLanguage;

                angular.merge(oLang, newLang);

                return oLang;
            }

            /**
             * Return translated table language object
             *
             * @function getDToLang
             * @private
             * @returns {Object}    Object containing all translated strings for the datatable
             */
            function getDToLang() {
                const lang = $translate.proposedLanguage() || $translate.use();
                if (languageObjects[lang]) {
                    return languageObjects[lang];
                }

                const oLangSrc = {
                    sProcessing: 'processing',
                    sSearch: 'search',
                    sLengthMenu: 'length.menu',
                    sInfo: 'info',
                    sInfoEmpty: 'zero',
                    sInfoFiltered: 'filtered',
                    sInfoPostFix: 'postfix',
                    sLoadingRecords: 'loadrec',
                    sZeroRecords: 'zerorecords',
                    sEmptyTable: 'emptytable'
                };
                const oPaginateSrc = {
                    sFirst: 'first',
                    sPrevious: 'previous',
                    sNext: 'next',
                    sLast: 'last'
                };
                const oAriaSrc = {
                    sSortAscending: 'sortasc',
                    sSortDescending: 'sortdsc'
                };
                const oLang = { oPaginate: {}, oAria: {} };
                Object.keys(oLangSrc).forEach(key =>
                    oLang[key] = $translate.instant(`filter.default.label.${oLangSrc[key]}`));
                Object.keys(oPaginateSrc).forEach(key =>
                    oLang.oPaginate[key] = $translate.instant(`filter.default.label.${oPaginateSrc[key]}`));
                Object.keys(oAriaSrc).forEach(key =>
                    oLang.oAria[key] = $translate.instant(`filter.default.aria.${oAriaSrc[key]}`));

                languageObjects[lang] = oLang;

                return languageObjects[lang];
            }
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
                    // set index to make sure it works for French and English translation
                    // TODO: make it work when new language is added
                    const info = self.table.table().container().getElementsByClassName('dataTables_info')[0];
                    const infos = info.innerText.split(' ');
                    const index = (configService.currentLang() === 'en-CA') ? 1 : 3;
                    infos[index] = scroll.page().start + 1;
                    infos[index + 2] = scroll.page().end + 1;
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
         * @function triggerTableButton
         * @param  {Number|String} index button selector: https://datatables.net/reference/api/button()
         */
        function triggerTableButton(index) {
            // see `buttons` array in the DataTable constructor object in the directive above
            const button = self.table.button(index);
            if (button) {
                button.trigger();
            }
        }
    }
})();
