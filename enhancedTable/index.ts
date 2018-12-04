import { GridOptions, GridApi } from 'ag-grid-community';
import { take } from 'rxjs/internal/operators/take';
import { PanelManager } from './panel-manager';

const NUMBER_TYPES = ["esriFieldTypeOID", "esriFieldTypeDouble", "esriFieldTypeInteger"];
const DATE_TYPE = "esriFieldTypeDate";
const TEXT_TYPE = "esriFieldTypeString";

class TableBuilder {
    intention = 'table';
    attributeHeaders: any;

    init(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = new PanelManager(mapApi);

        this.mapApi.layers.click.subscribe(baseLayer => {
            const attrs = baseLayer.getAttributes();
            this.attributeHeaders = baseLayer.attributeHeaders;
            if (attrs.length === 0) {
                // make sure all attributes are added before creating the table (otherwise table displays without SVGs)
                this.mapApi.layers.attributesAdded.pipe(take(1)).subscribe(attrs => {
                    if (
                        attrs.attributes[0] &&
                        attrs.attributes[0]['rvSymbol'] !== undefined &&
                        attrs.attributes[0]['rvInteractive'] !== undefined
                    ) {
                        this.createTable(attrs);
                    }
                });
            } else {
                this.createTable({
                    attributes: attrs,
                    layer: baseLayer
                });
            }
        });

        // toggle the enhancedTable if toggleDataTable is called from Legend API
        this.mapApi.ui.configLegend._legendStructure._root._tableToggled.subscribe(legendBlock => {
            if (legendBlock.blockType === 'node') {
                // make sure the item clicked is a node, and not group or other
                let layer;
                if (legendBlock.parentLayerType === 'esriDynamic') {
                    layer = this.mapApi.layers.allLayers.find(function (l) {
                        return l.id === legendBlock.layerRecordId && l.layerIndex === parseInt(legendBlock.itemIndex);
                    });
                } else {
                    layer = this.mapApi.layers.getLayersById(legendBlock.layerRecordId)[0];
                }
                if (layer) {
                    this.mapApi.layers._click.next(layer);
                }
            }
        });
    }

    createTable(attrBundle: AttrBundle) {
        let cols: Array<any> = [];

        attrBundle.layer._layerProxy.formattedAttributes.then(a => {
            Object.keys(attrBundle.attributes[0]).forEach(columnName => {
                let colDef = {
                    headerName: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                    headerTooltip: this.attributeHeaders[columnName] ? this.attributeHeaders[columnName]['name'] : '',
                    minWidth: undefined,
                    maxWidth: undefined,
                    field: columnName,
                    filter: 'agTextColumnFilter',
                    filterParams: {},
                    floatingFilterComponent: undefined,
                    floatingFilterComponentParams: { suppressFilterButton: true },
                    cellRenderer: undefined,
                    suppressSorting: false,
                    suppressFilter: false,
                    getQuickFilterText: undefined
                };

                const fieldInfo = a.fields.find(field => field.name === columnName)
                if (fieldInfo) {
                    if (NUMBER_TYPES.indexOf(fieldInfo.type) > -1) {
                        //Column should filter numbers properly
                        colDef.filter = 'agNumberColumnFilter';
                        colDef.filterParams = {
                            inRangeInclusive: true
                        };
                        colDef.floatingFilterComponent = getNumberFloatingFilterComponent();
                    } else if (fieldInfo.type === DATE_TYPE) {
                        colDef.minWidth = 423;
                        // Column should render and filter date properly
                        colDef.filter = 'agDateColumnFilter';
                        colDef.filterParams = {
                            comparator: function (filterDate, entryDate) {
                                let entry = new Date(entryDate);
                                if (entry > filterDate) {
                                    return 1;
                                } else if (entry < filterDate) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            }
                        };
                        colDef.floatingFilterComponent  = getDateFloatingFilterComponent(this.mapApi);
                        colDef.cellRenderer = function (cell) {
                            let element = document.createElement('span');
                            element.innerHTML = getDateString(cell.value);
                            return element;
                        }
                        colDef.getQuickFilterText = function (params) {
                            return getDateString(params.value);
                        }
                    } else if (fieldInfo.type === TEXT_TYPE && !attrBundle.layer.table.lazyFilter) {
                        // Default to "regex" filtering for text columns
                        colDef.filterParams = {
                            textCustomComparator: function (filter, value, filterText) {
                                const re = new RegExp(`^${filterText.replace(/\*/, '.*')}`);
                                return re.test(value);
                            }
                        };
                    }
                }
                if (columnName === 'rvSymbol') {
                    colDef.cellRenderer = function (cellImg) {
                        return cellImg.value;
                    };
                }

                if (columnName === 'rvSymbol' || columnName === 'rvInteractive') {
                    colDef.suppressSorting = true;
                    colDef.suppressFilter = true;
                    colDef.maxWidth = 100;
                    cols.splice(0, 0, colDef);
                } else {
                    cols.push(colDef);
                }
            });

            (<any>Object).assign(this.tableOptions, {
                columnDefs: cols,
                rowData: attrBundle.attributes
            });

            this.panel.open(this.tableOptions, attrBundle.layer);
            this.tableApi = this.tableOptions.api;
        });
    }
}

function getNumberFloatingFilterComponent() {
    function NumberFloatingFilter() {
    }

    NumberFloatingFilter.prototype.init = function (params) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = `<input class="rv-min" style="width:50%" type="text" placeholder="MIN"/>
                            <input class="rv-max" style="width:50%" type="text" placeholder="MAX"/>`
        this.currentValues = {min: null, max: null};
        this.minFilterInput = this.eGui.querySelector(".rv-min");
        this.maxFilterInput = this.eGui.querySelector(".rv-max");
        var that = this;

        function onMinInputBoxChanged() {
            if (that.minFilterInput.value === '') {
                that.currentValues.min = null;
            } else {
                that.currentValues.min = Number(that.minFilterInput.value);
            }
            that.onFloatingFilterChanged({model: getModel()});
        }

        function onMaxInputBoxChanged() {
            if (that.maxFilterInput.value === '') {
                that.currentValues.max = null;
            } else {
                that.currentValues.max = Number(that.maxFilterInput.value);
            }
            that.onFloatingFilterChanged({model: getModel()});
        }

        function getModel() {
            if (that.currentValues.min !== null && that.currentValues.max !== null) {
                return {
                    type: 'inRange',
                    filter: that.currentValues.min,
                    filterTo: that.currentValues.max
                };
            } else if (that.currentValues.min !== null && that.currentValues.max === null) {
                return {
                    type: 'greaterThanOrEqual',
                    filter: that.currentValues.min
                };
            } else if (that.currentValues.min === null && that.currentValues.max !== null) {
                return {
                    type: 'lessThanOrEqual',
                    filter: that.currentValues.max
                };
            } else {
                return {};
            }
        }

        this.minFilterInput.addEventListener('input', onMinInputBoxChanged);
        this.maxFilterInput.addEventListener('input', onMaxInputBoxChanged);
    };

    NumberFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.minFilterInput.value = '';
            this.maxFilterInput.value = '';
        }
    };

    NumberFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };

    return NumberFloatingFilter;
}

function getDateFloatingFilterComponent(mapApi) {
    function DateFloatingFilter() {
    }

    DateFloatingFilter.prototype.init = function (params) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        const template = mapApi.$compileWithScope(`<span><md-datepicker ng-change="minChanged()" ng-model="min"></md-datepicker><md-datepicker ng-change="maxChanged()" ng-model="max"></md-datepicker></span>`);
        this.scope = template.scope;
        this.scope.min = null;
        this.scope.max = null;
        this.eGui = template.html[0];
        var that = this;

        this.scope.minChanged = function() {
            that.onFloatingFilterChanged({model: getModel()});
        };

        this.scope.maxChanged = function() {
            that.onFloatingFilterChanged({model: getModel()});
        };

        function getModel() {
            const min = that.scope.min !== null
                      ? `${that.scope.min.getFullYear()}-${that.scope.min.getMonth() + 1}-${that.scope.min.getDate()}`
                      : null;
            const max = that.scope.max !== null
                      ? `${that.scope.max.getFullYear()}-${that.scope.max.getMonth() + 1}-${that.scope.max.getDate()}`
                      : null;
            if (min !== null && max !== null) {
                return {
                    type: 'inRange',
                    dateFrom: min,
                    dateTo: max
                };
            } else if (min && max === null) {
                return {
                    type: 'greaterThanOrEqual',
                    dateFrom: min
                };
            } else if (min === null && max) {
                return {
                    type:'lessThanOrEqual',
                    dateFrom: max
                };
            } else {
                return null;
            }
        }
    };

    DateFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.scope.min = null;
            this.scope.max = null;
        }
    };

    DateFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };

    return DateFloatingFilter;
}

function getDateString(value) {
    const date = new Date(value)
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return date.toLocaleDateString('en-CA', options);
}

interface AttrBundle {
    attributes: any[];
    layer: any;
}

interface TableBuilder {
    intention: string;
    id: string;
    mapApi: any;
    tableOptions: GridOptions;
    tableApi: GridApi;
    panel: PanelManager;
    translations: any;
}

TableBuilder.prototype.tableOptions = {
    enableSorting: true,
    floatingFilter: true,
    defaultColDef: {
        width: 100
    },
    autoSizePadding: 75,
    suppressColumnVirtualisation: true
};

TableBuilder.prototype.id = 'fancyTable';

TableBuilder.prototype.translations = {
    'en-CA': {
        search: {
            placeholder: 'Search table'
        },
        table: {
            filter: {
                clear: 'Clear filters'
            },
            hideColumns: 'Hide columns'
        },
        menu: {
            split: 'Split View',
            max: 'Maximize',
            print: 'Print',
            export: 'Export',
            filter: {
                extent: 'Filter by extent',
                show: 'Show filters'
            }
        }
    },
    'fr-CA': {
        search: {
            placeholder: 'Texte à rechercher'
        },
        table: {
            filter: {
                clear: 'Effacer les filtres'
            },
            hideColumns: 'Hide columns' // TODO: Add French translation
        },
        menu: {
            split: 'Diviser la vue',
            max: 'Agrandir',
            print: 'Imprimer',
            export: 'Exporter',
            filter: {
                extent: 'Filtrer par étendue',
                show: 'Afficher les filtres'
            }
        }
    }
};

(<any>window).enhancedTable = TableBuilder;
