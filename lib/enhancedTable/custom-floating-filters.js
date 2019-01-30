"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var templates_1 = require("./templates");
function setUpMinMaxFilters(colDef, defaultValue, panelStateManager) {
    var min = panelStateManager.getColumnFilter([colDef.field + ' min']);
    var max = panelStateManager.getColumnFilter([colDef.field + ' max']);
    if (min !== undefined || max !== undefined) {
        // if value saved was null means filter was cleared
        // if value is undefined, means use default value in config
        // otherwise used saved value (will be a number)
        min = (min === null) ? '' : (min === undefined ? defaultValue.split(',')[0] : min);
        max = (max === null) ? '' : (max === undefined ? defaultValue.split(',')[1] : max);
        return defaultValue = min + "," + max;
    }
    return undefined;
}
/**Sets up number floating filter accounting for static types and default values*/
function setUpNumberFilter(colDef, isItStatic, defaultValue, gridOptions, panelStateManager) {
    var minAndMaxFilters = setUpMinMaxFilters(colDef, defaultValue, panelStateManager);
    defaultValue = minAndMaxFilters !== undefined ? minAndMaxFilters : defaultValue;
    $.extend(colDef.floatingFilterComponentParams, {
        isStatic: isItStatic,
        defaultValue: defaultValue,
        panelStateManager: panelStateManager,
        currColumn: colDef
    });
    //Column should filter numbers properly
    colDef.filter = 'agNumberColumnFilter';
    colDef.filterParams.inRangeInclusive = true;
    colDef.floatingFilterComponent = NumberFloatingFilter;
}
exports.setUpNumberFilter = setUpNumberFilter;
/**Sets up date floating filter accounting for static types and default values*/
function setUpDateFilter(colDef, isItStatic, mapApi, defaultValue, panelStateManager) {
    var minAndMaxFilters = setUpMinMaxFilters(colDef, defaultValue, panelStateManager);
    defaultValue = minAndMaxFilters !== undefined ? minAndMaxFilters : defaultValue;
    colDef.minWidth = 423;
    // Column should render and filter date properly
    colDef.filter = 'agDateColumnFilter';
    colDef.filterParams.comparator = function (filterDate, entryDate) {
        var entry = new Date(entryDate);
        if (entry > filterDate) {
            return 1;
        }
        else if (entry < filterDate) {
            return -1;
        }
        else {
            return 0;
        }
    };
    $.extend(colDef.floatingFilterComponentParams, {
        isStatic: isItStatic,
        value: defaultValue,
        map: mapApi,
        panelStateManager: panelStateManager,
        currColumn: colDef
    });
    colDef.floatingFilterComponent = DateFloatingFilter;
    colDef.cellRenderer = function (cell) {
        var element = document.createElement('span');
        element.innerHTML = getDateString(cell.value);
        return element;
    };
    colDef.getQuickFilterText = function (params) {
        return getDateString(params.value);
    };
}
exports.setUpDateFilter = setUpDateFilter;
/**Sets up text floating filter accounting for static types, default values and selector types*/
function setUpTextFilter(colDef, isStatic, lazyFilterEnabled, searchStrictMatchEnabled, defaultValue, map, panelStateManager) {
    // if PanelStateManager has a value saved, it is going to override the default value in the config
    defaultValue = panelStateManager.getColumnFilter(colDef.field) !== undefined ?
        panelStateManager.getColumnFilter(colDef.field) :
        defaultValue;
    $.extend(colDef.floatingFilterComponentParams, {
        isStatic: isStatic,
        defaultValue: defaultValue,
        map: map,
        panelStateManager: panelStateManager,
        currColumn: colDef
    });
    colDef.floatingFilterComponent = TextFloatingFilter;
    if (!searchStrictMatchEnabled) {
        // modified from: https://www.ag-grid.com/javascript-grid-filter-text/#text-formatter
        var disregardAccents_1 = function (s) {
            var r = s.toLowerCase();
            r = r.replace(new RegExp("[àáâãäå]", 'g'), "a");
            r = r.replace(new RegExp("æ", 'g'), "ae");
            r = r.replace(new RegExp("ç", 'g'), "c");
            r = r.replace(new RegExp("[èéêë]", 'g'), "e");
            r = r.replace(new RegExp("[ìíîï]", 'g'), "i");
            r = r.replace(new RegExp("ñ", 'g'), "n");
            r = r.replace(new RegExp("[òóôõö]", 'g'), "o");
            r = r.replace(new RegExp("œ", 'g'), "oe");
            r = r.replace(new RegExp("[ùúûü]", 'g'), "u");
            r = r.replace(new RegExp("[ýÿ]", 'g'), "y");
            return r;
        };
        // for individual columns
        colDef.filterParams.textFormatter = function (s) {
            return disregardAccents_1(s);
        };
        // for global search
        colDef.getQuickFilterText = function (params) {
            return disregardAccents_1(params.value);
        };
    }
    if (!lazyFilterEnabled) {
        // Default to "regex" filtering for text columns
        colDef.filterParams.textCustomComparator = function (filter, value, filterText) {
            var re = new RegExp("^" + filterText.replace(/\*/, '.*'));
            return re.test(value);
        };
    }
}
exports.setUpTextFilter = setUpTextFilter;
/**Sets up a selector floating filter accounting for static types and default values*/
function setUpSelectorFilter(colDef, isItStatic, defaultValue, gridOptions, mapApi, panelStateManager) {
    // if there was a previously saved value, that takes precedence over default config selector filter
    // if the previously saved value was null, it means the selector filter was cleared on table close/reload
    // so no default filter is set
    var value = (panelStateManager.getColumnFilter(colDef.field) !== undefined) ?
        (panelStateManager.getColumnFilter(colDef.field) === null ? undefined :
            panelStateManager.getColumnFilter(colDef.field)) :
        defaultValue;
    $.extend(colDef.floatingFilterComponentParams, {
        isStatic: isItStatic,
        value: value,
        tableOptions: gridOptions,
        map: mapApi,
        currColumn: colDef,
        panelStateManager: panelStateManager
    });
    colDef.floatingFilterComponent = SelectorFloatingFilter;
    // our custom comparator looks to see if row values are contained within selected value
    // since selector can select multiple values
    colDef.filterParams = {
        textCustomComparator: function (filter, value, filterText) {
            return filterText.includes(value);
        }
    };
}
exports.setUpSelectorFilter = setUpSelectorFilter;
/**Helper method to setUpDateFilter*/
function getDateString(value) {
    var date = new Date(value);
    var options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return date.toLocaleDateString('en-CA', options);
}
/**
* Floating filter component enhanced for Static Text Filters
*/
var TextFloatingFilter = /** @class */ (function () {
    function TextFloatingFilter() {
    }
    TextFloatingFilter.prototype.init = function (params) {
        var _this = this;
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = templates_1.TEXT_FILTER_TEMPLATE(params.defaultValue, params.isStatic);
        this.scope = params.map.$compile(this.eGui);
        this.scope.input = params.defaultValue !== undefined ? params.defaultValue : '';
        this.scope.inputChanged = function () {
            _this.params.panelStateManager.setColumnFilter(_this.params.currColumn.field, _this.scope.input);
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        };
        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-input').ready(function () {
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        });
    };
    ;
    /** Helper function to determine filter model */
    TextFloatingFilter.prototype.getModel = function () {
        return {
            type: 'contains',
            filter: this.scope.input
        };
    };
    /** Return component GUI */
    TextFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };
    TextFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.scope.input = '';
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, this.scope.input);
        }
    };
    return TextFloatingFilter;
}());
exports.TextFloatingFilter = TextFloatingFilter;
/**
* Floating filter component enhanced for number
* Has separate min and max input boxes
*/
var NumberFloatingFilter = /** @class */ (function () {
    function NumberFloatingFilter() {
    }
    NumberFloatingFilter.prototype.init = function (params) {
        var _this = this;
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.class = 'rv-min-max';
        this.eGui.innerHTML = templates_1.NUMBER_FILTER_TEMPLATE(params.defaultValue, params.isStatic);
        if (params.defaultValue === undefined) {
            this.currentValues = { min: null, max: null };
        }
        else {
            var minVal = params.defaultValue.split(',')[0] === '' ? null : Number(params.defaultValue.split(',')[0]);
            var maxVal = params.defaultValue.split(',')[1] === '' ? null : Number(params.defaultValue.split(',')[1]);
            this.currentValues = { min: minVal, max: maxVal };
        }
        this.minFilterInput = this.eGui.querySelector(".rv-min");
        this.maxFilterInput = this.eGui.querySelector(".rv-max");
        this.minFilterInput.addEventListener('input', this.onMinInputBoxChanged.bind(this));
        this.maxFilterInput.addEventListener('input', this.onMaxInputBoxChanged.bind(this));
        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-min-max').ready(function () {
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        });
    };
    /** Update filter nimimum */
    NumberFloatingFilter.prototype.onMinInputBoxChanged = function () {
        if (this.minFilterInput.value === '') {
            this.currentValues.min = null;
        }
        else {
            this.currentValues.min = Number(this.minFilterInput.value);
        }
        // save value on panel reload manager
        var key = this.params.currColumn.field + ' min';
        this.params.panelStateManager.setColumnFilter(key, this.currentValues.min);
        this.onFloatingFilterChanged({ model: this.getModel() });
    };
    /** Update filter maximum */
    NumberFloatingFilter.prototype.onMaxInputBoxChanged = function () {
        if (this.maxFilterInput.value === '') {
            this.currentValues.max = null;
        }
        else {
            this.currentValues.max = Number(this.maxFilterInput.value);
        }
        // save value on panel reload manager
        var key = this.params.currColumn.field + ' max';
        this.params.panelStateManager.setColumnFilter(key, this.currentValues.max);
        this.onFloatingFilterChanged({ model: this.getModel() });
    };
    /** Helper function to determine filter model */
    NumberFloatingFilter.prototype.getModel = function () {
        if (this.currentValues.min !== null && this.currentValues.max !== null) {
            return {
                type: 'inRange',
                filter: this.currentValues.min,
                filterTo: this.currentValues.max
            };
        }
        else if (this.currentValues.min !== null && this.currentValues.max === null) {
            return {
                type: 'greaterThanOrEqual',
                filter: this.currentValues.min
            };
        }
        else if (this.currentValues.min === null && this.currentValues.max !== null) {
            return {
                type: 'lessThanOrEqual',
                filter: this.currentValues.max
            };
        }
        else {
            return {};
        }
    };
    /** Pass through parent change for all filter clear */
    NumberFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.minFilterInput.value = '';
            this.maxFilterInput.value = '';
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' max', null);
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' min', null);
        }
    };
    /** Return component GUI */
    NumberFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };
    return NumberFloatingFilter;
}());
exports.NumberFloatingFilter = NumberFloatingFilter;
/** Return a floating filter enhanced for dates */
var DateFloatingFilter = /** @class */ (function () {
    function DateFloatingFilter() {
    }
    DateFloatingFilter.prototype.init = function (params) {
        var _this = this;
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(templates_1.DATE_FILTER_TEMPLATE(params.value, params.isStatic))[0];
        this.eGui.class = 'rv-date-picker';
        this.scope = params.map.$compile(this.eGui);
        this.scope.min = params.value !== undefined &&
            params.value.split(',')[0] !== '' ?
            new Date(params.value.split(',')[0]) : null;
        this.scope.max = params.value !== undefined &&
            params.value.split(',')[1] !== '' ?
            new Date(params.value.split(',')[1]) : null;
        this.scope.minChanged = function () {
            // save value on panel reload manager
            var key = _this.params.currColumn.field + ' min';
            _this.params.panelStateManager.setColumnFilter(key, _this.scope.min !== null ? _this.scope.min.toString() : null);
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        };
        this.scope.maxChanged = function () {
            // save value on panel reload manager
            var key = _this.params.currColumn.field + ' max';
            _this.params.panelStateManager.setColumnFilter(key, _this.scope.max !== null ? _this.scope.max.toString() : null);
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        };
        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-date-picker').ready(function () {
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        });
    };
    /** Helper function to determine filter model */
    DateFloatingFilter.prototype.getModel = function () {
        var min = this.scope.min !== null
            ? this.scope.min.getFullYear() + "-" + (this.scope.min.getMonth() + 1) + "-" + this.scope.min.getDate()
            : null;
        var max = this.scope.max !== null
            ? this.scope.max.getFullYear() + "-" + (this.scope.max.getMonth() + 1) + "-" + this.scope.max.getDate()
            : null;
        if (min !== null && max !== null) {
            return {
                type: 'inRange',
                dateFrom: min,
                dateTo: max
            };
        }
        else if (min && max === null) {
            return {
                type: 'greaterThanOrEqual',
                dateFrom: min
            };
        }
        else if (min === null && max) {
            return {
                type: 'lessThanOrEqual',
                dateFrom: max
            };
        }
        else {
            return null;
        }
    };
    /** Pass through parent change for all filter clear */
    DateFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.scope.min = null;
            this.scope.max = null;
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' max', null);
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' min', null);
        }
    };
    /** Return component GUI */
    DateFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };
    return DateFloatingFilter;
}());
exports.DateFloatingFilter = DateFloatingFilter;
/**
* Floating filter component enhanced for Static Text Filters
*/
var SelectorFloatingFilter = /** @class */ (function () {
    function SelectorFloatingFilter() {
    }
    SelectorFloatingFilter.prototype.init = function (params) {
        var _this = this;
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(templates_1.SELECTOR_FILTER_TEMPLATE(params.value, params.isStatic))[0];
        this.eGui.class = 'rv-selector';
        this.scope = params.map.$compile(this.eGui);
        function getDefaultOptions(substr) {
            return substr !== '[' && substr !== ']' && substr !== ', ';
        }
        this.scope.selectedOptions = params.value !== undefined ? params.value.split('"').filter(getDefaultOptions) : '';
        // keep track of the number of distinct row values for the column
        // these will form the selector drop down
        function getDistinctRows(rowData) {
            var distinctRows = {};
            rowData.filter(function (row) {
                return distinctRows.hasOwnProperty(row[params.currColumn.headerName]) ? false : (distinctRows[row[params.currColumn.headerName]] = true);
            });
            return distinctRows;
        }
        this.scope.options = Object.keys(getDistinctRows(params.tableOptions.rowData));
        // fires when user makes selection changes and closes the drop down menu window
        this.scope.selectionChanged = function () {
            // stores selected options for panel reload manager to reuse
            var selectedOptions = '[';
            _this.scope.selectedOptions.forEach(function (option) {
                if (_this.scope.selectedOptions[_this.scope.selectedOptions.length - 1] === option) {
                    selectedOptions += "\"" + option + "\"";
                }
                else {
                    selectedOptions += "\"" + option + "\", ";
                }
            });
            selectedOptions += ']';
            _this.params.panelStateManager.setColumnFilter(_this.params.currColumn.field, selectedOptions);
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        };
        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-selector').ready(function () {
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        });
    };
    /** Helper function to determine filter model */
    SelectorFloatingFilter.prototype.getModel = function () {
        var selectedOptions = this.scope.selectedOptions;
        var optionsList = '';
        // add all selection options and pass it onto the filter
        [].forEach.call(selectedOptions, function (option) {
            optionsList += option;
        });
        return { type: 'contains', filter: optionsList };
    };
    /** Return component GUI */
    SelectorFloatingFilter.prototype.getGui = function () {
        return this.eGui;
    };
    /** Pass through parent change for all filter clear.*/
    SelectorFloatingFilter.prototype.onParentModelChanged = function (parentModel) {
        if (parentModel === null) {
            this.scope.selectedOptions = [];
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, null);
        }
    };
    return SelectorFloatingFilter;
}());
exports.SelectorFloatingFilter = SelectorFloatingFilter;
