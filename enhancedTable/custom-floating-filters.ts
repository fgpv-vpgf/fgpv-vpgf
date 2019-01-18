import { NUMBER_FILTER_TEMPLATE, DATE_FILTER_TEMPLATE, TEXT_FILTER_TEMPLATE, SELECTOR_FILTER_TEMPLATE } from "./templates";
import { TextFloatingFilterComp } from "ag-grid-community/dist/lib/filter/floatingFilter";


function setUpMinMaxFilters(colDef, defaultValue, panelStateManager) {
    let min = panelStateManager.getColumnFilter([colDef.field + ' min']);
    let max = panelStateManager.getColumnFilter([colDef.field + ' max']);

    if (min !== undefined || max !== undefined) {
        // if value saved was null means filter was cleared
        // if value is undefined, means use default value in config
        // otherwise used saved value (will be a number)
        min = (min === null) ? '' : (min === undefined ? defaultValue.split(',')[0] : min);
        max = (max === null) ? '' : (max === undefined ? defaultValue.split(',')[1] : max);
        return defaultValue = `${min},${max}`;
    }

    return undefined;

}

/**Sets up number floating filter accounting for static types and default values*/
export function setUpNumberFilter(colDef: any, isItStatic: boolean, defaultValue: any, gridOptions: any, panelStateManager: any) {

    const minAndMaxFilters = setUpMinMaxFilters(colDef, defaultValue, panelStateManager);
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

/**Sets up date floating filter accounting for static types and default values*/
export function setUpDateFilter(colDef: any, isItStatic: boolean, mapApi: any, defaultValue: any, panelStateManager: any) {

    const minAndMaxFilters = setUpMinMaxFilters(colDef, defaultValue, panelStateManager);
    defaultValue = minAndMaxFilters !== undefined ? minAndMaxFilters : defaultValue;

    colDef.minWidth = 423;
    // Column should render and filter date properly
    colDef.filter = 'agDateColumnFilter';
    colDef.filterParams.comparator = function (filterDate, entryDate) {
        let entry = new Date(entryDate);
        if (entry > filterDate) {
            return 1;
        } else if (entry < filterDate) {
            return -1;
        } else {
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
        let element = document.createElement('span');
        element.innerHTML = getDateString(cell.value);
        return element;
    }
    colDef.getQuickFilterText = function (params) {
        return getDateString(params.value);
    }
}

/**Sets up text floating filter accounting for static types, default values and selector types*/
export function setUpTextFilter(colDef: any, isStatic: boolean, lazyFilterEnabled: boolean,
    searchStrictMatchEnabled: boolean, defaultValue: any, map: any, panelStateManager: any) {

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
        let disregardAccents = function (s) {
            let r = s.toLowerCase();
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

        // for individual columns
        colDef.filterParams.textFormatter = function (s) {
            return disregardAccents(s);
        }

        // for global search
        colDef.getQuickFilterText = function (params) {
            return disregardAccents(params.value);
        }
    }

    if (!lazyFilterEnabled) {
        // Default to "regex" filtering for text columns
        colDef.filterParams.textCustomComparator = function (filter, value, filterText) {
            const re = new RegExp(`^${filterText.replace(/\*/, '.*')}`);
            return re.test(value);
        }
    }
}

/**Sets up a selector floating filter accounting for static types and default values*/
export function setUpSelectorFilter(colDef: any, isItStatic: boolean, defaultValue: any, gridOptions: any, mapApi: any, panelStateManager: any) {

    // if there was a previously saved value, that takes precedence over default config selector filter
    // if the previously saved value was null, it means the selector filter was cleared on table close/reload
    // so no default filter is set
    let value = (panelStateManager.getColumnFilter(colDef.field) !== undefined) ?
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
    }
}

/**Helper method to setUpDateFilter*/
function getDateString(value) {
    const date = new Date(value)
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return date.toLocaleDateString('en-CA', options);
}

/**
* Floating filter component enhanced for Static Text Filters
*/
export class TextFloatingFilter {

    init(params) {
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = TEXT_FILTER_TEMPLATE(params.defaultValue, params.isStatic);
        this.scope = params.map.$compile(this.eGui);
        this.scope.input = params.defaultValue !== undefined ? params.defaultValue : '';
        this.scope.inputChanged = () => {
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, this.scope.input);
            this.onFloatingFilterChanged({ model: this.getModel() });
        }

        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-input').ready(() => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        });
    };

    /** Helper function to determine filter model */
    getModel(): any {
        return {
            type: 'contains',
            filter: this.scope.input
        }
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }

    onParentModelChanged(parentModel: any) {
        if (parentModel === null) {
            this.scope.input = '';
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, this.scope.input);
        }
    }
}

/**
* Floating filter component enhanced for number
* Has separate min and max input boxes
*/
export class NumberFloatingFilter {

    init(params: any) {
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        (<any>this.eGui).class = 'rv-min-max';
        this.eGui.innerHTML = NUMBER_FILTER_TEMPLATE(params.defaultValue, params.isStatic);

        if (params.defaultValue === undefined) {
            this.currentValues = { min: null, max: null };
        } else {
            let minVal = params.defaultValue.split(',')[0] === '' ? null : Number(params.defaultValue.split(',')[0]);
            let maxVal = params.defaultValue.split(',')[1] === '' ? null : Number(params.defaultValue.split(',')[1]);
            this.currentValues = { min: minVal, max: maxVal };
        }

        this.minFilterInput = this.eGui.querySelector(".rv-min");
        this.maxFilterInput = this.eGui.querySelector(".rv-max");

        this.minFilterInput.addEventListener('input', this.onMinInputBoxChanged.bind(this));
        this.maxFilterInput.addEventListener('input', this.onMaxInputBoxChanged.bind(this));

        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-min-max').ready(() => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        });
    }

    /** Update filter nimimum */
    onMinInputBoxChanged() {
        if (this.minFilterInput.value === '') {
            this.currentValues.min = null;
        } else {
            this.currentValues.min = Number(this.minFilterInput.value);
        }

        // save value on panel reload manager
        let key = this.params.currColumn.field + ' min';
        this.params.panelStateManager.setColumnFilter(key, this.currentValues.min);

        this.onFloatingFilterChanged({ model: this.getModel() });
    }

    /** Update filter maximum */
    onMaxInputBoxChanged() {
        if (this.maxFilterInput.value === '') {
            this.currentValues.max = null;
        } else {
            this.currentValues.max = Number(this.maxFilterInput.value);
        }

        // save value on panel reload manager
        let key = this.params.currColumn.field + ' max';
        this.params.panelStateManager.setColumnFilter(key, this.currentValues.max);

        this.onFloatingFilterChanged({ model: this.getModel() });
    }

    /** Helper function to determine filter model */
    getModel(): any {
        if (this.currentValues.min !== null && this.currentValues.max !== null) {
            return {
                type: 'inRange',
                filter: this.currentValues.min,
                filterTo: this.currentValues.max
            };
        } else if (this.currentValues.min !== null && this.currentValues.max === null) {
            return {
                type: 'greaterThanOrEqual',
                filter: this.currentValues.min
            };
        } else if (this.currentValues.min === null && this.currentValues.max !== null) {
            return {
                type: 'lessThanOrEqual',
                filter: this.currentValues.max
            };
        } else {
            return {};
        }
    }

    /** Pass through parent change for all filter clear */
    onParentModelChanged(parentModel: any) {
        if (parentModel === null) {
            this.minFilterInput.value = '';
            this.maxFilterInput.value = '';
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' max', null);
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' min', null);
        }
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }
}

/** Return a floating filter enhanced for dates */
export class DateFloatingFilter {

    init(params: any) {
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(DATE_FILTER_TEMPLATE(params.value, params.isStatic))[0];
        (<any>this.eGui).class = 'rv-date-picker'
        this.scope = params.map.$compile(this.eGui);

        this.scope.min = params.value !== undefined &&
            params.value.split(',')[0] !== '' ?
            new Date(params.value.split(',')[0]) : null;

        this.scope.max = params.value !== undefined &&
            params.value.split(',')[1] !== '' ?
            new Date(params.value.split(',')[1]) : null;

        this.scope.minChanged = () => {
            // save value on panel reload manager
            let key = this.params.currColumn.field + ' min';
            this.params.panelStateManager.setColumnFilter(key, this.scope.min !== null ? this.scope.min.toString() : null);
            this.onFloatingFilterChanged({ model: this.getModel() });
        };

        this.scope.maxChanged = () => {
            // save value on panel reload manager
            let key = this.params.currColumn.field + ' max';
            this.params.panelStateManager.setColumnFilter(key, this.scope.max !== null ? this.scope.max.toString() : null);
            this.onFloatingFilterChanged({ model: this.getModel() });
        };

        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-date-picker').ready(() => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        });
    }

    /** Helper function to determine filter model */
    getModel(): any {
        const min = this.scope.min !== null
            ? `${this.scope.min.getFullYear()}-${this.scope.min.getMonth() + 1}-${this.scope.min.getDate()}`
            : null;
        const max = this.scope.max !== null
            ? `${this.scope.max.getFullYear()}-${this.scope.max.getMonth() + 1}-${this.scope.max.getDate()}`
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
                type: 'lessThanOrEqual',
                dateFrom: max
            };
        } else {
            return null;
        }
    }

    /** Pass through parent change for all filter clear */
    onParentModelChanged(parentModel: any) {
        if (parentModel === null) {
            this.scope.min = null;
            this.scope.max = null;
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' max', null);
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field + ' min', null);
        }
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }
}

/**
* Floating filter component enhanced for Static Text Filters
*/
export class SelectorFloatingFilter {

    init(params: any) {
        this.params = params;
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(SELECTOR_FILTER_TEMPLATE(params.value, params.isStatic))[0];
        (<any>this.eGui).class = 'rv-selector';
        this.scope = params.map.$compile(this.eGui);


        function getDefaultOptions(substr) {
            return substr !== '[' && substr !== ']' && substr !== ', ';
        }

        this.scope.selectedOptions = params.value !== undefined ? params.value.split('"').filter(getDefaultOptions) : '';

        // keep track of the number of distinct row values for the column
        // these will form the selector drop down
        function getDistinctRows(rowData) {
            let distinctRows = {};
            rowData.filter(row => {
                return distinctRows.hasOwnProperty(row[params.currColumn.headerName]) ? false : (distinctRows[row[params.currColumn.headerName]] = true);
            });
            return distinctRows;
        }

        this.scope.options = Object.keys(getDistinctRows(params.tableOptions.rowData));

        // fires when user makes selection changes and closes the drop down menu window
        this.scope.selectionChanged = () => {

            // stores selected options for panel reload manager to reuse
            let selectedOptions = '[';
            this.scope.selectedOptions.forEach(option => {
                if (this.scope.selectedOptions[this.scope.selectedOptions.length - 1] === option) {
                    selectedOptions += `"${option}"`
                } else {
                    selectedOptions += `"${option}", `
                }
            });
            selectedOptions += ']';
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, selectedOptions);
            this.onFloatingFilterChanged({ model: this.getModel() })
        }

        // in case there are default filters, change model as soon as element is ready in DOM
        $('.rv-selector').ready(() => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        });

    }

    /** Helper function to determine filter model */
    getModel(): any {
        let selectedOptions = this.scope.selectedOptions;
        let optionsList = '';

        // add all selection options and pass it onto the filter
        [].forEach.call(selectedOptions, function (option) {
            optionsList += option;
        });

        return { type: 'contains', filter: optionsList };
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }

    /** Pass through parent change for all filter clear.*/
    onParentModelChanged(parentModel: any) {
        if (parentModel === null) {
            this.scope.selectedOptions = [];
            this.params.panelStateManager.setColumnFilter(this.params.currColumn.field, null);
        }
    }
}

export interface NumberFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    currentValues: any;
    minFilterInput: any;
    maxFilterInput: any;
    isStatic: boolean;
    value: any;
    params: any;
}

export interface DateFloatingFilter {
    onFloatingFilterChanged: any;
    scope: any;
    eGui: HTMLElement;
    isStatic: boolean;
    value: any;
    params: any;
}

export interface TextFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    defaultValue: any;
    value: any;
    scope: any;
    params: any;
}

export interface SelectorFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    defaultValue: any;
    value: any;
    scope: any;
    params: any;
}
