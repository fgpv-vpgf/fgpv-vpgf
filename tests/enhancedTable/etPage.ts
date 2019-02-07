/**
 * Opens the table by clicking on layer `layer`
 * If no layer is provided, open the first layer in the legend.
 */
export async function open(remote) {
    await remote.sleep(10000)
    const layer = await remote.findByCssSelector('rv-legend-control > button')
    await layer.click()
    await remote.sleep(5000)
}

export async function agBody(remote) {
    return await remote.findByCssSelector('.ag-body-container');
}
/**
* Return the element containing the datepicker button
*/
export async function datepickerButton(remote) {
    return await remote.findByCssSelector('.md-datepicker-button');
}

/**
 * Returns the first selector drop down
 */
export async function selectorDropDown(remote) {
    return await remote.findByCssSelector('.md-select-value');
}

/**
 * Return the element containing the dateInput
 */
export async function dateInput(remote) {
    return await remote.findByCssSelector('.md-datepicker-input');
}

export async function minNumberInput(remote) {
    return await remote.findByCssSelector('.rv-min');
}

export async function maxNumberInput(remote) {
    return await remote.findByCssSelector('.rv-max');
}

/**
 * Returns the first details button
 */
export async function detailsButton(remote) {
    return await remote.findByCssSelector('.enhanced-table-details');
}

/**
 * Returns the first zoom button
 */
export async function zoomButton(remote) {
    return await remote.findByCssSelector('.enhanced-table-zoom');
}

/**
 * Returns the panel element the table is in.
 */
export async function panel(remote) {
    return await remote.findByCssSelector('#enhancedTable');
}

/**
 * Return move left button for the first column
 */
export async function firstColumnLeftButton(remote) {
    const cols = await remote.findAllByCssSelector('.move-left');
    return cols[0];
}

/**
 * Return move right button for the last column
 */
export async function lastColumnRightButton(remote) {
    let list =  await remote.findAllByCssSelector('.move-right');
    return list[list.length - 1];
}

/**
 * Return a move column button that isn't disabled
 */
export async function nonDisabledMoveButton(remote) {
    const btn = await remote.findAllByCssSelector('.move-left:not(:disabled)');
    return btn[1]
}