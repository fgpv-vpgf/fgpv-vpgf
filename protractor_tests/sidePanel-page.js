const BasePage = require('./base-page');

class sidePanelPage extends BasePage {

    constructor() {
        super();
        this.el = $('rv-shell > rv-sidenav > md-sidenav');
    }

    open () {
        $('rv-shell > rv-appbar > div > button').click();
    }
}

module.exports = sidePanelPage;