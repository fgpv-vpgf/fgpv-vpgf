class BasePage {
    constructor() {
        browser.waitForAngularEnabled(false);
        browser.get('http://localhost:6001/build/samples/index-mobile.html');
    }
}

module.exports = BasePage;