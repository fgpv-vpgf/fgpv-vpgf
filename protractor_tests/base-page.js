class BasePage {
    constructor() {
        browser.get('http://localhost:6001/samples/index-samples.html');
    }
}

module.exports = BasePage;
