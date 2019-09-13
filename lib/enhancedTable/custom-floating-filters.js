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
            if (isNaN(s)) {
                // check if s is a number before trying to convert it to lowercase (otherwise throws error)
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
            }
            return s;
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
    // default to regex filtering for text columns
    if (!lazyFilterEnabled) {
        colDef.filterParams.textCustomComparator = function (filter, value, filterText) {
            var re = new RegExp("^" + filterText.replace(/\*/, '.*'));
            return re.test(value);
        };
    }
    else {
        colDef.filterParams.textCustomComparator = function (filter, value, filterText) {
            // treat * as a regular special char with lazy filter on
            var newFilterText = filterText.replace(/\*/, '\\*');
            // surround filter text with .* to match anything before and after
            var re = new RegExp("^.*" + newFilterText + ".*");
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
        this.preLoadedValue();
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
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    TextFloatingFilter.prototype.preLoadedValue = function () {
        var reloadedVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field);
        if (typeof reloadedVal === 'string') {
            // UNESCAPE all special chars (remove the backslash) when reloading table
            var escRegex = /\\[(!"#$%&\'+,.\\\/:;<=>?@[\]^`{|}~)]/g;
            // remFilter stores the remaining string text after the last special char (or the entire string, if there are no special chars at all)
            var remFilter = reloadedVal;
            var newFilter = '';
            var escMatch = escRegex.exec(reloadedVal);
            var lastIdx = 0;
            while (escMatch) {
                // update all variables after finding an escaped special char, preserving all text except the backslash
                newFilter = newFilter + reloadedVal.substr(lastIdx, escMatch.index - lastIdx) + escMatch[0].slice(-1);
                lastIdx = escMatch.index + 2;
                remFilter = reloadedVal.substr(escMatch.index + 2);
                escMatch = escRegex.exec(reloadedVal);
            }
            newFilter = newFilter + remFilter;
            reloadedVal = newFilter;
        }
        if (reloadedVal !== undefined) {
            this.eGui.innerHTML = templates_1.TEXT_FILTER_TEMPLATE(reloadedVal, this.params.isStatic);
            this.scope = this.params.map.$compile(this.eGui);
            this.scope.input = reloadedVal;
        }
        else {
            this.eGui.innerHTML = templates_1.TEXT_FILTER_TEMPLATE(this.params.defaultValue, this.params.isStatic);
            this.scope = this.params.map.$compile(this.eGui);
            this.scope.input = this.params.defaultValue !== undefined ? this.params.defaultValue : '';
        }
    };
    /** Helper function to determine filter model */
    TextFloatingFilter.prototype.getModel = function () {
        var newFilter = this.scope.input;
        if (newFilter && typeof newFilter === 'string') {
            var escRegex = /[(!"#$&\'+,.\\\/:;<=>?@[\]^`{|}~)]/g;
            newFilter = newFilter.replace(escRegex, '\\$&');
        }
        return {
            type: 'contains',
            filter: newFilter
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
        this.currentValues = this.preLoadedValue;
        this.minFilterInput = this.eGui.querySelector(".rv-min");
        this.maxFilterInput = this.eGui.querySelector(".rv-max");
        this.minFilterInput.addEventListener('input', this.onMinInputBoxChanged.bind(this));
        this.maxFilterInput.addEventListener('input', this.onMaxInputBoxChanged.bind(this));
        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-min-max').ready(function () {
            _this.onFloatingFilterChanged({ model: _this.getModel() });
        });
    };
    Object.defineProperty(NumberFloatingFilter.prototype, "preLoadedValue", {
        /**
         * Helper function to init
         * Determines if preloaded value exists.
         * If so fills col filter from either panelStateManager or default value from config
         */
        get: function () {
            var reloadedMinVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field + ' min');
            var reloadedMaxVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field + ' max');
            var defaultMinVal = (this.params.defaultValue === undefined ||
                this.params.defaultValue.split(',')[0] === '') ? null :
                Number(this.params.defaultValue.split(',')[0]);
            var defaultMaxVal = (this.params.defaultValue === undefined ||
                this.params.defaultValue.split(',')[1] === '') ? null :
                Number(this.params.defaultValue.split(',')[1]);
            if (reloadedMinVal !== undefined || reloadedMaxVal !== undefined) {
                this.eGui.innerHTML = templates_1.NUMBER_FILTER_TEMPLATE(reloadedMinVal + "," + reloadedMaxVal, this.params.isStatic);
                return {
                    min: reloadedMinVal !== undefined ? reloadedMinVal : null,
                    max: reloadedMaxVal !== undefined ? reloadedMaxVal : null,
                };
            }
            else {
                this.eGui.innerHTML = templates_1.NUMBER_FILTER_TEMPLATE(this.params.defaultValue, this.params.isStatic);
                return {
                    min: defaultMinVal,
                    max: defaultMaxVal
                };
            }
        },
        enumerable: true,
        configurable: true
    });
    /** Update filter minimum */
    NumberFloatingFilter.prototype.onMinInputBoxChanged = function () {
        if (this.minFilterInput.value === '') {
            this.currentValues.min = null;
        }
        else if (this.minFilterInput.value === '-') {
            this.currentValues.min = '-';
        }
        else if (isNaN(this.minFilterInput.value)) {
            // TODO: error message for wrong input type
            this.minFilterInput.value = this.currentValues.min;
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
        else if (this.maxFilterInput.value === '-') {
            this.currentValues.max = '-';
        }
        else if (isNaN(this.maxFilterInput.value)) {
            // TODO: error message for wrong input type
            this.maxFilterInput.value = this.currentValues.max;
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
        // handle filtering negative values by replacing - with the largest negative number
        if (this.currentValues.min !== null && this.currentValues.max !== null) {
            return {
                type: 'inRange',
                filter: this.currentValues.min === '-' ? Number.MIN_SAFE_INTEGER : this.currentValues.min,
                filterTo: this.currentValues.max === '-' ? Number.MIN_SAFE_INTEGER : this.currentValues.max
            };
        }
        else if (this.currentValues.min !== null && this.currentValues.max === null) {
            return {
                type: 'greaterThanOrEqual',
                filter: this.currentValues.min === '-' ? Number.MIN_SAFE_INTEGER : this.currentValues.min
            };
        }
        else if (this.currentValues.min === null && this.currentValues.max !== null) {
            return {
                type: 'lessThanOrEqual',
                filter: this.currentValues.max === '-' ? Number.MIN_SAFE_INTEGER : this.currentValues.max
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
        this.preLoadedValue();
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
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    DateFloatingFilter.prototype.preLoadedValue = function () {
        var defaultMinVal = this.params.value !== undefined &&
            this.params.value.split(',')[0] !== '' ?
            new Date(this.params.value.split(',')[0]) : null;
        var defaultMaxVal = this.params.value !== undefined &&
            this.params.value.split(',')[1] !== '' ?
            new Date(this.params.value.split(',')[1]) : null;
        var reloadedMinVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field + ' min');
        var reloadedMaxVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field + ' max');
        if (reloadedMinVal !== undefined || reloadedMaxVal !== undefined) {
            this.eGui = $(templates_1.DATE_FILTER_TEMPLATE(reloadedMinVal + "," + reloadedMaxVal, this.params.isStatic))[0];
            this.eGui.class = 'rv-date-picker';
            this.scope = this.params.map.$compile(this.eGui);
            this.scope.min = reloadedMinVal !== undefined ? reloadedMinVal : null;
            this.scope.max = reloadedMaxVal !== undefined ? reloadedMaxVal : null;
        }
        else {
            this.eGui = $(templates_1.DATE_FILTER_TEMPLATE(this.params.value, this.params.isStatic))[0];
            this.eGui.class = 'rv-date-picker';
            this.scope = this.params.map.$compile(this.eGui);
            this.scope.min = defaultMinVal;
            this.scope.max = defaultMaxVal;
        }
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
        this.preLoadedValue();
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
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    SelectorFloatingFilter.prototype.preLoadedValue = function () {
        var reloadedVal = this.params.panelStateManager.getColumnFilter(this.params.currColumn.field) === null ? '' :
            this.params.panelStateManager.getColumnFilter(this.params.currColumn.field);
        function getDefaultOptions(substr) {
            return substr !== '[' && substr !== ']' && substr !== ', ';
        }
        this.eGui = reloadedVal !== undefined ?
            $(templates_1.SELECTOR_FILTER_TEMPLATE(reloadedVal, this.params.isStatic))[0] :
            $(templates_1.SELECTOR_FILTER_TEMPLATE(this.params.value, this.params.isStatic))[0];
        this.eGui.class = 'rv-selector';
        this.scope = this.params.map.$compile(this.eGui);
        // tab index is set to -3 by default
        // keep this here so the selector is keyboard accessible
        this.eGui.tabIndex = 0;
        this.scope.selectedOptions = reloadedVal !== undefined ?
            reloadedVal.split('"').filter(getDefaultOptions) :
            (this.params.value !== undefined ?
                this.params.value.split('"').filter(getDefaultOptions) : '');
    };
    /** Helper function to determine filter model */
    SelectorFloatingFilter.prototype.getModel = function () {
        var optionsList = (this.scope.selectedOptions.length === 1 && this.scope.selectedOptions[0] === '') ?
            [] : this.scope.selectedOptions.map(function (option) { return "'" + option + "'"; }).join();
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
