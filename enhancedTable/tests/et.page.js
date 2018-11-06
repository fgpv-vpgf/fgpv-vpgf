const RAMPage = require('../../bin/test/ramp.page');

class Page extends RAMPage {
    /**
     * Opens the table by clicking on the first layer in the legend.
     */
    open() {
        this.legendLayer.click();
    }

    /**
     * Returns the panel element the table is in.
     */
    get panel() {
        return browser.element('#enhancedTable');
    }
}

module.exports = new Page();
