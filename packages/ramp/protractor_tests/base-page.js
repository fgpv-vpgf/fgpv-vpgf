class BasePage {
    constructor() {
        browser.get('http://localhost:6001/samples/index-samples.html');

        browser.wait(protractor.ExpectedConditions.visibilityOf($('rv-shell > rv-appbar > div > button')));
    }
}

module.exports = BasePage;
