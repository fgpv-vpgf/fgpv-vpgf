const page = require('./et.page');

describe('the enhancedTable panel', function () {
    beforeAll(page.beforeAll);

    it('should open when a layer is clicked', function () {
        expect(page.panel.waitForDisplayed(3000)).toEqual(true);
    });
});
