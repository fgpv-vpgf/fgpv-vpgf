const page = require('./et.page');

describe('the enhancedTable headers', function () {
    beforeAll(page.beforeAll);

    it('should have a first column with a disabled move left button', function () {
        expect(page.firstColumnLeftButton.isEnabled()).toEqual(false);
    });

    it('should have a last column with a disabled move right button', function () {
        expect(page.lastColumnRightButton.isEnabled()).toEqual(false);
    });

    // TODO: et-test.html changed to et-index.html since former does not support https
    xit('should have an enabled move column button', function () {
        expect(page.nonDisabledMoveButton.isEnabled()).toEqual(true);
    });

});