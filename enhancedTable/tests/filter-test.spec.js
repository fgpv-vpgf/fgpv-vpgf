const page = require('./et.page');

describe('the enhancedTable filters', function () {
    beforeAll(function () {
        browser.url('enhancedTable/samples/et-test.html');

        // when loading screen is finished RZ must be ready
        browser.waitUntil(function () {
            return browser.waitForVisible('.rv-loading-section', 25000, true);
        }, 25000, 'expected the loading splash screen to be hidden after 25 seconds.');

        // open table before running filter tests
        page.open();
        page.panel.waitForVisible(3000);
    });

    it('should have a datefilter button', function () {
        expect(page.datepickerButton.isExisting()).toEqual(true);
    });

    it('should have a datefilter input', function () {
        expect(page.dateInput.isExisting()).toEqual(true);
    });

    it('should have a selector dropdown', function () {
        expect(page.selectorDropDown.isExisting()).toEqual(true);
    });

    it('should have a number filter with min', function () {
        expect(page.numberInput.min.isExisting()).toEqual(true);
    });

    it('should have a number filter with max', function () {
        expect(page.numberInput.max.isExisting()).toEqual(true);
    });
});
