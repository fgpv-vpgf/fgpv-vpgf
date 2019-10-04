"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var take_1 = require("rxjs/internal/operators/take");
var panel_manager_1 = require("./panel-manager");
var templates_1 = require("./templates");
var config_manager_1 = require("./config-manager");
var custom_floating_filters_1 = require("./custom-floating-filters");
var custom_header_1 = require("./custom-header");
var panel_state_manager_1 = require("./panel-state-manager");
var panel_loader_1 = require("./panel-loader");
var NUMBER_TYPES = ['esriFieldTypeOID', 'esriFieldTypeDouble', 'esriFieldTypeInteger'];
var DATE_TYPE = 'esriFieldTypeDate';
var TEXT_TYPE = 'esriFieldTypeString';
var TableBuilder = /** @class */ (function () {
    function TableBuilder() {
        this.feature = 'table';
    }
    TableBuilder.prototype.init = function (mapApi) {
        var _this = this;
        this.mapApi = mapApi;
        this.panelManager = new panel_manager_1.PanelManager(mapApi);
        this.panelManager.reload = this.reloadTable.bind(this);
        this.mapApi.layers.reload.subscribe(function (baseLayer, interval) {
            if (!interval && baseLayer === _this.panelManager.currentTableLayer) {
                _this.reloadTable(baseLayer);
            }
        });
        this.mapApi.ui.configLegend.elementRemoved.subscribe(function (legendBlock) {
            if (legendBlock === _this.panelManager.legendBlock) {
                _this.panelManager.panel.close();
            }
        });
        // toggle the enhancedTable if toggleDataTable is called from Legend API
        this.mapApi.ui.configLegend.dataTableToggled.subscribe(function (_a) {
            var apiLayer = _a.apiLayer, legendBlock = _a.legendBlock;
            // Open the table if its closed, never been created or this is a different layer (by comparing API layers, instead of legendBlocks, since reload changes legendBlock)
            if (_this.panelManager.panel.isClosed || !_this.panelManager.panelStateManager || _this.panelManager.panelStateManager.baseLayer !== apiLayer) {
                // creates a 'loader' panel to be opened if data hasn't loaded after 200ms
                _this.deleteLoaderPanel();
                _this.loadingPanel = new panel_loader_1.PanelLoader(_this.mapApi, legendBlock);
                _this.loadingTimeout = setTimeout(function () {
                    legendBlock.loadingPanel = _this.loadingPanel;
                    legendBlock.formattedData;
                }, 200);
                _this.findMatchingLayer(legendBlock);
            }
            else {
                _this.panelManager.panel.close();
            }
        });
    };
    TableBuilder.prototype.findMatchingLayer = function (legendBlock) {
        var _this = this;
        if (legendBlock.blockType === 'node') {
            // make sure the item clicked is a node, and not group or other
            var layer = void 0;
            if (legendBlock.parentLayerType === 'esriDynamic') {
                layer = this.mapApi.layers.allLayers.find(function (l) {
                    return l.id === legendBlock.layerRecordId && l.layerIndex === parseInt(legendBlock.itemIndex);
                });
            }
            else {
                layer = this.mapApi.layers.getLayersById(legendBlock.layerRecordId)[0];
            }
            if (layer) {
                // if layer was created unsubscribe to layer added observable
                // create + open the enhancedTable
                this.legendBlock = legendBlock;
                this.panelManager.setLegendBlock(legendBlock);
                if (this.layerAdded !== undefined) {
                    this.layerAdded.unsubscribe();
                }
                this.loadingPanel.setSize(layer.table.maximize); //make sure loading panel is maximized/minimized according to config
                this.openTable(layer);
            }
            else {
                // if layer was not created, subscribe to layer added observable
                this.layerAdded = this.mapApi.layers.layerAdded.subscribe(function (l) {
                    if (l.id === legendBlock.layerRecordId) {
                        // if matching layer is found, call this function again so that enhancedTable can be created
                        _this.findMatchingLayer(legendBlock);
                    }
                });
            }
        }
    };
    TableBuilder.prototype.openTable = function (baseLayer) {
        var _this = this;
        if (baseLayer.panelStateManager === undefined) {
            // if no PanelStateManager exists for this BaseLayer, create a new one
            baseLayer.panelStateManager = new panel_state_manager_1.PanelStateManager(baseLayer, this.legendBlock);
        }
        this.panelManager.panelStateManager = baseLayer.panelStateManager;
        var attrs = baseLayer.getAttributes();
        this.attributeHeaders = baseLayer.attributeHeaders;
        if (attrs.length === 0) {
            // make sure all attributes are added before creating the table (otherwise table displays without SVGs)
            this.mapApi.layers.attributesAdded.pipe(take_1.take(1)).subscribe(function (attr) {
                if (attr.attributes.length > 0) {
                    _this.configManager = new config_manager_1.ConfigManager(baseLayer, _this.panelManager);
                    _this.panelManager.configManager = _this.configManager;
                    _this.createTable(attr);
                }
                else {
                    _this.openTable(baseLayer);
                }
            });
        }
        else {
            this.configManager = new config_manager_1.ConfigManager(baseLayer, this.panelManager);
            this.panelManager.configManager = this.configManager;
            this.createTable({
                attributes: attrs,
                layer: baseLayer
            });
        }
    };
    TableBuilder.prototype.deleteLoaderPanel = function () {
        if (this.loadingPanel) {
            this.loadingPanel.close();
            if (this.legendBlock.loadingPanel) {
                this.legendBlock.loadingPanel = undefined;
            }
        }
        if ($('#enhancedTableLoader') !== undefined) {
            $('#enhancedTableLoader').remove();
        }
    };
    TableBuilder.prototype.createTable = function (attrBundle) {
        var _this = this;
        var self = this;
        var cols = [];
        var layerProxy = attrBundle.layer._layerProxy;
        layerProxy.formattedAttributes.then(function (a) {
            // get column order according to the config if defined
            // else get default columns
            var columns = Object.keys(_this.configManager.columnConfigs).length > 0 ? ['rvInteractive', 'rvSymbol'].concat(Object.keys(_this.configManager.columnConfigs)) :
                Object.keys(a.rows[0]);
            columns.forEach(function (columnName) {
                if (columnName === 'rvSymbol' ||
                    columnName === 'rvInteractive' ||
                    _this.configManager.filteredAttributes.length === 0 ||
                    _this.configManager.filteredAttributes.indexOf(columnName) > -1) {
                    // only create column if it is valid according to config, or a symbol/interactive column
                    // set up the column according to the specifications from ColumnConfigManger
                    var column = _this.configManager.columnConfigs[columnName];
                    // If the column has no config, create a default config for it
                    if (column === undefined) {
                        column = new config_manager_1.ColumnConfigManager(_this.configManager, undefined);
                        _this.configManager.columnConfigs[columnName] = column;
                    }
                    var colDef = {
                        width: column.width || 100,
                        minWidth: column.width,
                        maxWidth: column.width,
                        headerName: _this.attributeHeaders[columnName] ? _this.attributeHeaders[columnName]['name'] : '',
                        headerTooltip: _this.attributeHeaders[columnName] ? _this.attributeHeaders[columnName]['name'] : '',
                        field: columnName,
                        filterParams: {},
                        filter: 'agTextColumnFilter',
                        floatingFilterComponentParams: { suppressFilterButton: true, mapApi: _this.mapApi },
                        floatingFilterComponent: undefined,
                        cellRenderer: function (cell) {
                            var translated = $("<span>{{ 'plugins.enhancedTable.table.complexValue' | translate }}</span>");
                            self.mapApi.$compile(translated);
                            return cell.value || !isNaN(cell.value) ? (typeof cell.value === 'object' ? translated[0] : cell.value) : '';
                        },
                        suppressSorting: false,
                        suppressFilter: column.searchDisabled,
                        sort: column.sort,
                        suppressMovable: true,
                        hide: column.column !== undefined && column.column.visible !== undefined ? !column.column.visible : false
                    };
                    // set up floating filters and column header
                    var fieldInfo = a.fields.find(function (field) { return field.name === columnName; });
                    if (fieldInfo) {
                        var isSelector = column.isSelector;
                        var isStatic = column.isFilterStatic;
                        if (!column.searchDisabled || column.searchDisabled === undefined) {
                            // only set up floating filters if search isn't disabled
                            // floating filters of type number, date, text
                            // text can be of type text or selector
                            if (NUMBER_TYPES.indexOf(fieldInfo.type) > -1) {
                                custom_floating_filters_1.setUpNumberFilter(colDef, isStatic, column.value, _this.tableOptions, _this.panelManager.panelStateManager);
                            }
                            else if (fieldInfo.type === DATE_TYPE) {
                                custom_floating_filters_1.setUpDateFilter(colDef, isStatic, _this.mapApi, column.value, _this.panelManager.panelStateManager);
                            }
                            else if (fieldInfo.type === TEXT_TYPE && attrBundle.layer.table !== undefined) {
                                if (isSelector) {
                                    custom_floating_filters_1.setUpSelectorFilter(colDef, isStatic, column.value, _this.tableOptions, _this.mapApi, _this.panelManager.panelStateManager);
                                }
                                else {
                                    custom_floating_filters_1.setUpTextFilter(colDef, isStatic, _this.configManager.lazyFilterEnabled, _this.configManager.searchStrictMatchEnabled, column.value, _this.mapApi, _this.panelManager.panelStateManager);
                                }
                            }
                        }
                        setUpHeaderComponent(colDef, _this.mapApi, _this.tableOptions);
                    }
                    // symbols and interactive columns are set up for every table
                    setUpSymbolsAndInteractive(columnName, colDef, cols, _this.mapApi, layerProxy);
                }
            });
            Object.assign(_this.tableOptions, {
                columnDefs: cols,
                rowData: attrBundle.attributes
            });
            // Show toast on layer refresh is refresh interval is set
            var refreshInterval = _this.legendBlock.proxyWrapper.layerConfig.refreshInterval;
            if (refreshInterval) {
                _this.panelManager.toastInterval = setInterval(function () {
                    _this.panelManager.showToast();
                }, refreshInterval * 60000);
            }
            // Reset floatingFilter to true, will be updated onGridReady to match last value of panelStateManager.showFilter
            _this.tableOptions.floatingFilter = true;
            _this.panelManager.open(_this.tableOptions, attrBundle.layer, _this);
            _this.tableApi = _this.tableOptions.api;
        });
    };
    TableBuilder.prototype.reloadTable = function (baseLayer) {
        this.panelManager.panel.close();
        this.openTable(baseLayer);
    };
    return TableBuilder;
}());
exports.default = TableBuilder;
/* Helper function to set up symbols and interactive columns*/
function setUpSymbolsAndInteractive(columnName, colDef, cols, mapApi, layerProxy) {
    if (columnName === 'rvSymbol' || columnName === 'rvInteractive') {
        // symbols and interactive columns don't have options for sort, filter and have default widths
        colDef.suppressSorting = true;
        colDef.suppressFilter = true;
        colDef.lockPosition = true;
        if (columnName === 'rvSymbol') {
            colDef.maxWidth = 82;
            // set svg symbol for the symbol column
            colDef.cellRenderer = function (cell) {
                return cell.value;
            };
            colDef.cellStyle = function (cell) {
                return {
                    paddingTop: '7px'
                };
            };
        }
        else if (columnName === 'rvInteractive') {
            colDef.maxWidth = 40;
            // sets details and zoom buttons for the row
            var zoomDef = Object.assign({}, colDef);
            zoomDef.field = 'zoom';
            zoomDef.cellRenderer = function (params) {
                var eSpan = $(templates_1.ZOOM_TEMPLATE(params.data[layerProxy.oidField]));
                mapApi.$compile(eSpan);
                params.eGridCell.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        eSpan.click();
                    }
                });
                params.eGridCell.style.padding = 0;
                return eSpan[0];
            };
            cols.splice(0, 0, zoomDef);
            colDef.cellRenderer = function (params) {
                var eSpan = $(templates_1.DETAILS_TEMPLATE(params.data[layerProxy.oidField]));
                mapApi.$compile(eSpan);
                params.eGridCell.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        eSpan.click();
                    }
                });
                params.eGridCell.style.padding = 0;
                return eSpan[0];
            };
        }
        cols.splice(0, 0, colDef);
    }
    else {
        cols.push(colDef);
    }
}
/*Helper function to set up column headers*/
function setUpHeaderComponent(colDef, mApi, tableOptions) {
    colDef.headerComponent = custom_header_1.CustomHeader;
    colDef.headerComponentParams = {
        mapApi: mApi,
        tableOptions: tableOptions
    };
}
TableBuilder.prototype.tableOptions = {
    enableSorting: true,
    floatingFilter: true,
    autoSizePadding: 75,
    suppressColumnVirtualisation: true,
    suppressDragLeaveHidesColumns: true,
    ensureDomOrder: true,
    defaultColDef: {
        width: 100
    }
};
TableBuilder.prototype.id = 'fancyTable';
TableBuilder.prototype._name = 'enhancedTable';
TableBuilder.prototype.translations = {
    'en-CA': {
        search: {
            placeholder: 'Search table'
        },
        table: {
            filter: {
                clear: 'Clear filters',
                apply: 'Apply filters to map'
            },
            hideColumns: 'Hide columns',
            complexValue: 'Complex Value'
        },
        menu: {
            split: 'Split View',
            max: 'Maximize',
            print: 'Print',
            export: 'Export',
            options: 'More options',
            filter: {
                extent: 'Filter by extent',
                show: 'Show filters'
            }
        },
        detailsAndZoom: {
            details: 'Details',
            zoom: 'Zoom To Feature'
        },
        columnFilters: {
            selector: 'selection',
            date: {
                min: 'date min',
                max: 'date max'
            },
            text: 'text'
        }
    },
    'fr-CA': {
        search: {
            placeholder: 'Texte à rechercher'
        },
        table: {
            filter: {
                clear: 'Effacer les filtres',
                apply: 'Appliquer des filtres à la carte' // TODO: Add official French translation
            },
            hideColumns: 'Masquer les colonnes',
            complexValue: 'Valeur Complexes'
        },
        menu: {
            split: 'Diviser la vue',
            max: 'Agrandir',
            print: 'Imprimer',
            export: 'Exporter',
            options: 'Plus d’options',
            filter: {
                extent: 'Filtrer par étendue',
                show: 'Afficher les filtres'
            }
        },
        detailsAndZoom: {
            details: 'Détails',
            zoom: "Zoom à l'élément"
        },
        columnFilters: {
            selector: 'sélection',
            date: {
                min: 'date min',
                max: 'date max'
            },
            text: 'texte'
        }
    }
};
window.enhancedTable = TableBuilder;
