class BasePage {
    constructor() {
        browser.waitForAngularEnabled(false);
        browser.get('http://localhost:6001/samples/index-mobile.html');
        browser.wait(protractor.ExpectedConditions.visibilityOf($('rv-shell > rv-appbar > div > button')));
    }
}

module.exports = BasePage;
