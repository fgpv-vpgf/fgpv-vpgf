class BasePage {
    constructor() {
        browser.waitForAngularEnabled(false);
        browser.get('http://localhost:6001/samples/index-mobile.html');
    }
}

module.exports = BasePage;
