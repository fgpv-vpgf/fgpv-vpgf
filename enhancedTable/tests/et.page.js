const RAMPage = require('../../bin/test/ramp.page');

class Page extends RAMPage {

    /**
     * Opens the table by clicking on layer `layer`
     * If no layer is provided, open the first layer in the legend.
     */
    open(layer = this.legendLayer) {
        layer.click();
    }

    // Filter things
    /**
     * Return the element containing the datepicker button
     */
    get datepickerButton() {
        return browser.element('.md-datepicker-button');
    }

    /**
     * Returns the first selector drop down
     */
    get selectorDropDown() {
        return browser.element('.md-select-value');
    }

    /**
     * Return the element containing the dateInput
     */
    get dateInput() {
        return browser.element('.md-datepicker-input');
    }

    /**
     * Return an object containing the min and max number filter elements
     */
    get numberInput() {
        return {
            min: browser.element('.rv-min'),
            max: browser.element('.rv-max')
        }
    }

    // Details and zoom

    /**
     * Returns the first details button
     */
    get detailsButton() {
        return browser.element('.enhanced-table-details');
    }

    /**
     * Returns the first zoom button
     */
    get zoomButton() {
        return browser.element('.enhanced-table-zoom');
    }

    /**
     * Return move left button for the first column
     */
    get firstColumnLeftButton() {
        return browser.elements('.move-left').value[0];
    }

    /**
     * Return move right button for the last column
     */
    get lastColumnRightButton() {
        let list = browser.elements('.move-right').value;
        return list[list.length - 1];
    }

    /**
     * Return a move column button that isn't disabled
     */
    get nonDisabledMoveButton() {
        return browser.elements('.move-left').value[1];
    }

    /**
     * Returns the panel element the table is in.
     */
    get panel() {
        return browser.element('#enhancedTable');
    }
}

module.exports = new Page();
