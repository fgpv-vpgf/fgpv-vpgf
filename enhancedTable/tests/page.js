const RAMPage = require('../../tests/ramp.page');

class Page extends RAMPage {
    open() {
        this.legendLayer.click().click();
    }

    get panel() {
        return browser.element('#enhancedTable');
    }
}

module.exports = new Page();
