const RAMPage = require('../../bin/test/ramp.page');

class Page extends RAMPage {

    beforeAll() {
        browser.url('enhancedTable/samples/et-index.html');
        $('.rv-loading-screen').waitForDisplayed(20000, true);
        module.exports.open();
        browser.pause(1500);
    }

    /**
     * Opens the table by clicking on layer `layer`
     * If no layer is provided, open the first layer in the legend.
     */
    open(layer = this.legendLayer) {
        layer.click();
    }

    get agBody() {
        return $('.ag-body-container');
    }

    // Filter things
    /**
     * Return the element containing the datepicker button
     */
    get datepickerButton() {
        return $('.md-datepicker-button');
    }

    /**
     * Returns the first selector drop down
     */
    get selectorDropDown() {
        return $('.md-select-value');
    }

    /**
     * Return the element containing the dateInput
     */
    get dateInput() {
        return $('.md-datepicker-input');
    }

    /**
     * Return an object containing the min and max number filter elements
     */
    get numberInput() {
        return {
            min: $('.rv-min'),
            max: $('.rv-max')
        }
    }

    // Details and zoom

    /**
     * Returns the first details button
     */
    get detailsButton() {
        return $('.enhanced-table-details');
    }

    /**
     * Returns the first zoom button
     */
    get zoomButton() {
        return $('.enhanced-table-zoom');
    }

    /**
     * Return move left button for the first column
     */
    get firstColumnLeftButton() {
        return $$('.move-left')[0];
    }

    /**
     * Return move right button for the last column
     */
    get lastColumnRightButton() {
        let list = $$('.move-right');
        return list[list.length - 1];
    }

    /**
     * Return a move column button that isn't disabled
     */
    get nonDisabledMoveButton() {
        return $$('.move-left:not(:disabled)')[1];
    }

    /**
     * Returns the panel element the table is in.
     */
    get panel() {
        return $('#enhancedTable');
    }
}

module.exports = new Page();