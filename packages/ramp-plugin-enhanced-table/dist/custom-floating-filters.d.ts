/**Sets up number floating filter accounting for static types and default values*/
export declare function setUpNumberFilter(colDef: any, isItStatic: boolean, defaultValue: any, gridOptions: any, panelStateManager: any): void;
/**Sets up date floating filter accounting for static types and default values*/
export declare function setUpDateFilter(colDef: any, isItStatic: boolean, mapApi: any, defaultValue: any, panelStateManager: any): void;
/**Sets up text floating filter accounting for static types, default values and selector types*/
export declare function setUpTextFilter(colDef: any, isStatic: boolean, lazyFilterEnabled: boolean, searchStrictMatchEnabled: boolean, defaultValue: any, map: any, panelStateManager: any): void;
/**Sets up a selector floating filter accounting for static types and default values*/
export declare function setUpSelectorFilter(colDef: any, isItStatic: boolean, defaultValue: any, gridOptions: any, mapApi: any, panelStateManager: any): void;
/**
 * Floating filter component enhanced for Static Text Filters
 */
export declare class TextFloatingFilter {
    init(params: any): void;
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    preLoadedValue(): void;
    /** Helper function to determine filter model */
    getModel(): any;
    /** Return component GUI */
    getGui(): HTMLElement;
    onParentModelChanged(parentModel: any): void;
}
/**
 * Floating filter component enhanced for number
 * Has separate min and max input boxes
 */
export declare class NumberFloatingFilter {
    init(params: any): void;
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    readonly preLoadedValue: any;
    /** Update filter minimum */
    onMinInputBoxChanged(): void;
    /** Update filter maximum */
    onMaxInputBoxChanged(): void;
    /** Helper function to determine filter model */
    getModel(): any;
    /** Pass through parent change for all filter clear */
    onParentModelChanged(parentModel: any): void;
    /** Return component GUI */
    getGui(): HTMLElement;
}
/** Return a floating filter enhanced for dates */
export declare class DateFloatingFilter {
    init(params: any): void;
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    preLoadedValue(): void;
    /** Helper function to determine filter model */
    getModel(): any;
    /** Pass through parent change for all filter clear */
    onParentModelChanged(parentModel: any): void;
    /** Return component GUI */
    getGui(): HTMLElement;
}
/**
 * Floating filter component enhanced for Static Text Filters
 */
export declare class SelectorFloatingFilter {
    init(params: any): void;
    /**
     * Helper function to init
     * Determines if preloaded value exists.
     * If so fills col filter from either panelStateManager or default value from config
     */
    preLoadedValue(): void;
    /** Helper function to determine filter model */
    getModel(): any;
    /** Return component GUI */
    getGui(): HTMLElement;
    /** Pass through parent change for all filter clear.*/
    onParentModelChanged(parentModel: any): void;
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
