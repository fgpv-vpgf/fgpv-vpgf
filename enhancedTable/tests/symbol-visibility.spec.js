const page = require('./et.page');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

describe('the enhancedTable panel', function () {

    beforeAll(function () {
        browser.url('enhancedTable/samples/et-index.html');

        // when loading screen is finished RZ must be ready
        browser.waitUntil(function () {
            return browser.waitForVisible('.rv-loading-section', 25000, true);
        }, 25000, 'expected the loading splash screen to be hidden after 25 seconds.');
    });

    it('should open when a layer is clicked', function () {
        page.open();
        expect(browser.waitForVisible('#enhancedTable', 20000)).toEqual(true);
    });

    it('should update rows and filter status when symbologies are toggled to invisible', function () {

        // filter status and container height before toggling symbology
        const prevHeight = browser.getElementSize('.ag-body-container', 'height');
        const prevFilterStatus = browser.getText('.filterRecords');
        const prevNumRows = parseInt(prevFilterStatus.slice(0, prevFilterStatus.indexOf(' ')));

        // toggle symbology
        page.expandSymbologyStackButton.click();
        page.toggleSymbolVisibility();

        // filter  status and container height after toggling symbology
        const currFilterStatus = browser.getText('.filterRecords');
        const currNumRows = parseInt(currFilterStatus.slice(0, currFilterStatus.indexOf(' ')));
        const currHeight = browser.getElementSize('.ag-body-container', 'height');

        // container height and number of rows after toggle should be less than before toggle
        expect(currHeight).toBeLessThan(prevHeight);
        expect(currNumRows).toBeLessThan(prevNumRows);
    });

    it('should update rows and filter status when symbologies are toggled to visible', function () {

        // filter status and container height before toggling symbology
        const prevHeight = browser.getElementSize('.ag-body-container', 'height');
        const prevFilterStatus = browser.getText('.filterRecords');
        const prevNumRows = parseInt(prevFilterStatus.slice(0, prevFilterStatus.indexOf(' ')));

        // toggle symbology
        page.toggleSymbolVisibility();

        // filter  status and container height after toggling symbology
        const currFilterStatus = browser.getText('.filterRecords');
        const currNumRows = parseInt(currFilterStatus.slice(0, currFilterStatus.indexOf(' ')));
        const currHeight = browser.getElementSize('.ag-body-container', 'height');

        // container height and number of rows after toggle should be less than before toggle
        expect(prevHeight).toBeLessThan(currHeight);
        expect(prevNumRows).toBeLessThan(currNumRows);
    });
});
