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
     * Returns the panel element the table is in.
     */
    get panel() {
        return browser.element('#enhancedTable');
    }
}

module.exports = new Page();
