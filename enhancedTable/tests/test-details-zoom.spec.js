const page = require('./et.page');

describe('the enhancedTable rows', function () {
    beforeAll(page.beforeAll);

    it('should have a details button', function () {
        expect(page.detailsButton.isExisting()).toEqual(true);
    });

    it('should have a zoom button', function () {
        expect(page.zoomButton.isExisting()).toEqual(true);
    });
});
