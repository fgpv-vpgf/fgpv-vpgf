import { NUMBER_FILTER_TEMPLATE, DATE_FILTER_TEMPLATE } from "./templates";

/**
 * Floating filter component enhanced for number
 * Has separate min and max input boxes
 */
export class NumberFloatingFilter {

    init(params: any) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = NUMBER_FILTER_TEMPLATE;
        this.currentValues = {min: null, max: null};
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
        this.onFloatingFilterChanged({model: this.getModel()});
    }

    /** Update filter maximum */
    onMaxInputBoxChanged() {
        if (this.maxFilterInput.value === '') {
            this.currentValues.max = null;
        } else {
            this.currentValues.max = Number(this.maxFilterInput.value);
        }
        this.onFloatingFilterChanged({model: this.getModel()});
    }

    /** Helper function to determine filter model */
    getModel(): NumberFilterModel {
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
            return null;
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
export class DateFloatingFilter {

    init(params: any) {
        this.onFloatingFilterChanged = params.onFloatingFilterChanged;
        this.eGui = $(DATE_FILTER_TEMPLATE)[0];
        this.scope = params.mapApi.$compile(this.eGui);
        this.scope.min = null;
        this.scope.max = null;

        this.scope.minChanged = () => {
            this.onFloatingFilterChanged({model: this.getModel()});
        };

        this.scope.maxChanged = () => {
            this.onFloatingFilterChanged({model: this.getModel()});
        };
    }

    /** Helper function to determine filter model */
    getModel(): DateFilterModel {
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
                type:'lessThanOrEqual',
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

export interface NumberFloatingFilter {
    onFloatingFilterChanged: any;
    eGui: HTMLElement;
    currentValues: any;
    minFilterInput: any;
    maxFilterInput: any;
}

export interface DateFloatingFilter {
    onFloatingFilterChanged: any;
    scope: any;
    eGui: HTMLElement;
}

interface NumberFilterModel {
    type: string;
    filter: number;
    filterTo?: number;
}

interface DateFilterModel {
    type: string;
    dateFrom: string;
    dateTo?: string;
}
