const page = require('./enhancedTable.page');

describe('the enhancedTable panel', function() {
    beforeAll(function() {
        browser.url('/et-index.html');
    });

    it('should open when a layer is clicked', function() {
        expect(page.panel.waitForExist(3000)).toEqual(true);
    });
});
