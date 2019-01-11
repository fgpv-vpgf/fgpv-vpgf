const page = require('./et.page');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

describe('the enhancedTable panel', function () {
    beforeAll(page.beforeAll);

    // TODO: test layer does not toggleable symbology, add layer to fix
    xit('should update rows and filter status when symbologies are toggled to invisible', function () {

        // filter status and container height before toggling symbology
        const prevHeight = page.agBody.getSize('height');
        const prevFilterStatus = $('.filterRecords').getText();
        const prevNumRows = parseInt(prevFilterStatus.slice(0, prevFilterStatus.indexOf(' ')));

        // toggle symbology
        page.expandSymbologyStackButton.click();
        page.toggleSymbologyButton.waitForDisplayed(3000);
        page.toggleSymbologyButton.click();

        // filter  status and container height after toggling symbology
        const currFilterStatus = $('.filterRecords').getText();
        const currNumRows = parseInt(currFilterStatus.slice(0, currFilterStatus.indexOf(' ')));
        const currHeight = page.agBody.getSize('height');

        // container height and number of rows after toggle should be less than before toggle
        expect(currHeight).toBeLessThan(prevHeight + 1);
        expect(currNumRows).toBeLessThan(prevNumRows + 1);
    });

    // TODO: test layer does not toggleable symbology, add layer to fix
    xit('should update rows and filter status when symbologies are toggled to visible', function () {

        // filter status and container height before toggling symbology
        const prevHeight = page.agBody.getSize('height');
        const prevFilterStatus = $('.filterRecords').getText();
        const prevNumRows = parseInt(prevFilterStatus.slice(0, prevFilterStatus.indexOf(' ')));

        // toggle symbology
        page.toggleSymbologyButton.click();

        // filter  status and container height after toggling symbology
        const currFilterStatus = $('.filterRecords').getText();
        const currNumRows = parseInt(currFilterStatus.slice(0, currFilterStatus.indexOf(' ')));
        const currHeight = page.agBody.getSize('height');

        // container height and number of rows after toggle should be less than before toggle
        expect(prevHeight).toBeLessThan(currHeight + 1);
        expect(prevNumRows).toBeLessThan(currNumRows + 1);
    });
});
