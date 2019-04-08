/**
 * Opens the table by clicking on layer `layer`
 * If no layer is provided, open the first layer in the legend.
 */
export declare function open(remote: any): Promise<void>;
export declare function agBody(remote: any): Promise<any>;
/**
* Return the element containing the datepicker button
*/
export declare function datepickerButton(remote: any): Promise<any>;
/**
 * Returns the first selector drop down
 */
export declare function selectorDropDown(remote: any): Promise<any>;
/**
 * Return the element containing the dateInput
 */
export declare function dateInput(remote: any): Promise<any>;
export declare function minNumberInput(remote: any): Promise<any>;
export declare function maxNumberInput(remote: any): Promise<any>;
/**
 * Returns the first details button
 */
export declare function detailsButton(remote: any): Promise<any>;
/**
 * Returns the first zoom button
 */
export declare function zoomButton(remote: any): Promise<any>;
/**
 * Returns the panel element the table is in.
 */
export declare function panel(remote: any): Promise<any>;
/**
 * Return move left button for the first column
 */
export declare function firstColumnLeftButton(remote: any): Promise<any>;
/**
 * Return move right button for the last column
 */
export declare function lastColumnRightButton(remote: any): Promise<any>;
/**
 * Return a move column button that isn't disabled
 */
export declare function nonDisabledMoveButton(remote: any): Promise<any>;
