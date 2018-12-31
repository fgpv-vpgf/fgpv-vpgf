import { NUMBER_FILTER_TEMPLATE, DATE_FILTER_TEMPLATE, STATIC_TEXT_FIELD_DISABLED } from "./templates";

let map, value;
let isStatic = false;

/**Sets up number floating filter accounting for static types and default values*/
export function setUpNumberFilter(colDef: any, isItStatic: boolean, defaultValue: any, gridOptions: any) {
    //Column should filter numbers properly
    colDef.filter = 'agNumberColumnFilter';
    colDef.filterParams = {
        inRangeInclusive: true
    };
    isStatic = isItStatic;
    colDef.floatingFilterComponent = NumberFloatingFilter;
    //value = defaultValue;
}

/**Sets up date floating filter accounting for static types and default values*/
export function setUpDateFilter(colDef: any, isItStatic: boolean, mapApi: any) {
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
    map = mapApi;
    isStatic = isItStatic;
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
export function setUpTextFilter(colDef: any, isStatic: boolean, isSelector: boolean, lazyFilterEnabled: boolean, defaultValue: any) {
    //value = defaultValue;
    if (!lazyFilterEnabled && !isSelector) {

        if (isStatic) {
            colDef.floatingFilterComponent = StaticTextFloatingFilter;
        } else {
            // Default to "regex" filtering for text columns
            colDef.filterParams = {
                textCustomComparator: function (filter, value, filterText) {
                    const re = new RegExp(`^${filterText.replace(/\*/, '.*')}`);
                    return re.test(value);
                }
            };
        }

    } /*TODO: add a selector floating filter
         else if (isSelector) {
         // if this text filter needs to be converted into a selector type
         colDef.floatingFilterComponent = getSelectorFloatingFilterComponent(isStatic);
     }*/
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
class StaticTextFloatingFilter {

    init(params) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = STATIC_TEXT_FIELD_DISABLED(value);
        var that = this;

        function getModel() {
            return {};
        }
    };

    getGui() {
        return this.eGui;
    };

    getModelAsString(model) {
        return model ? model : '';
    }

}

/**
* Floating filter component enhanced for number
* Has separate min and max input boxes
*/
class NumberFloatingFilter {

    init(params: any) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = NUMBER_FILTER_TEMPLATE(value, isStatic);
        this.currentValues = { min: null, max: null };
        this.minFilterInput = this.eGui.querySelector(".rv-min");
        this.maxFilterInput = this.eGui.querySelector(".rv-max");

        this.minFilterInput.addEventListener('input', this.onMinInputBoxChanged.bind(this));
        this.maxFilterInput.addEventListener('input', this.onMaxInputBoxChanged.bind(this));
    }

    /** Update filter nimimum */
    onMinInputBoxChanged() {
        if (this.minFilterInput.value === '') {
            this.currentValues.min = null;
        } else {
            this.currentValues.min = Number(this.minFilterInput.value);
        }
        this.onFloatingFilterChanged({ model: this.getModel() });
    }

    /** Update filter maximum */
    onMaxInputBoxChanged() {
        if (this.maxFilterInput.value === '') {
            this.currentValues.max = null;
        } else {
            this.currentValues.max = Number(this.maxFilterInput.value);
        }
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
        }
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }
}

/** Return a floating filter enhanced for dates */
class DateFloatingFilter {

    init(params: any) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(DATE_FILTER_TEMPLATE(value, isStatic))[0];
        this.scope = map.$compile(this.eGui);
        this.scope.min = null;
        this.scope.max = null;

        this.scope.minChanged = () => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        };

        this.scope.maxChanged = () => {
            this.onFloatingFilterChanged({ model: this.getModel() });
        };
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
        }
    }

    /** Return component GUI */
    getGui(): HTMLElement {
        return this.eGui;
    }

}

interface NumberFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    currentValues: any;
    minFilterInput: any;
    maxFilterInput: any;
    isStatic: boolean;
    value: any;
}

interface DateFloatingFilter {
    onFloatingFilterChanged: any;
    scope: any;
    eGui: HTMLElement;
    isStatic: boolean;
    value: any;
}

interface StaticTextFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    defaultValue: any;
    value: any;
}
