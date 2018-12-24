const page = require('./et.page');

describe('the enhancedTable panel', function() {
    beforeAll(function () {
        browser.url('enhancedTable/samples/et-test.html');

        // when loading screen is finished RZ must be ready
        browser.waitUntil(function () {
            return browser.waitForVisible('.rv-loading-section', 25000, true);
        }, 25000, 'expected the loading splash screen to be hidden after 25 seconds.');
    });

    // Panel Tests
    it('should open when a layer is clicked', function() {
        page.open();
        expect(page.panel.waitForVisible(3000)).toEqual(true);
    });
});
