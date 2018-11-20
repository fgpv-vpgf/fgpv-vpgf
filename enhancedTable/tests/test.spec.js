const page = require('./et.page');

describe('the enhancedTable panel', function () {
    beforeAll(function () {
        browser.url('/enhancedTable/samples/et-index.html');

        // used to check if window.RZ is defined
        mApi = new Promise(function (resolve, reject) {
            let rzWait = setInterval(function () {
                browser.execute(function () {
                    if (window.RZ === undefined) {
                        return;
                    }
                    clearInterval(rzWait);
                    resolve(window.RZ);
                    return;
                });
            }, 100);
        });
    });

    it('should open when a layer is clicked', function () {
        mApi.then(function (RZ) {
            page.open();
            expect(browser.isVisible('#enhancedTable')).toEqual(true);
        });
    });

    it('should open when datatable is toggled through the legend api', function () {
        mApi.then(function (RZ) {
            // test to see if the _tableToggled observable being fired leads to table being opened
            let legendBlock = RZ.mapInstances[0].ui.configLegend.children[0]._legendBlock;
            RZ.mapInstances[0].ui.configLegend._legendStructure._root._tableToggled.next(legendBlock);
            expect(browser.isVisible('#enhancedTable')).toEqual(true);
        });
    });
});
