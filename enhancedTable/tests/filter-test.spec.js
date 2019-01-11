const page = require('./et.page');

describe('the enhancedTable filters', function () {
    beforeAll(page.beforeAll);

    // TODO: et-test.html changed to et-index.html since former does not support https, no datefilter on new page
    xit('should have a datefilter button', function () {
        expect(page.datepickerButton.isExisting()).toEqual(true);
    });

    // TODO: et-test.html changed to et-index.html since former does not support https, no datefilter on new page
    xit('should have a datefilter input', function () {
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
