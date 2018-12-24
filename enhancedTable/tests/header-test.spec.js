const page = require('./et.page');

describe('the enhancedTable headers', function() {
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

    it('should have a first column with a disabled move left button', function() {
        expect(page.firstColumnLeftButton.isEnabled()).toEqual(false);
    });

    it('should have a last column with a disabled move right button', function() {
        expect(page.lastColumnRightButton.isEnabled()).toEqual(false);
    });

    it('should have an enabled move column button', function() {
        expect(page.nonDisabledMoveButton.isEnabled()).toEqual(true);
    });

});