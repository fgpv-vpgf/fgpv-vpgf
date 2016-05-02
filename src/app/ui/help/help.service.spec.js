/* global bard, helpService */

describe('helpService', () => {
    function mockDialog($provide) {
        $provide.service('$mdDialog', () => {});
    }

    beforeEach(() => {

        bard.appModule('app.ui.help', mockDialog);

        // inject services
        bard.inject('helpService');
    });

    describe('helpService', () => {
        // check that controller is created
        it('should be created successfully', () => {
            // check if service is defined
            expect(helpService)
                .toBeDefined();

        });

        it('should register help sections', () => {
            let obj = { getCoords: () => {}, key: 'blam' };
            helpService.register(obj);

            expect(helpService.registry[0])
                .toBe(obj);
        });

        it('should remove help sections', () => {
            let obj = { getCoords: () => {}, key: 'blam' };
            helpService.register(obj);
            helpService.unregister(obj);

            expect(helpService.registry.length)
                .toBe(0);
        });

        it('should register drawn sections', () => {
            let obj = { getCoords: () => {}, key: 'blam' };
            helpService.setDrawn(obj);

            expect(helpService.drawnCache[0])
                .toBe(obj);
        });

        it('should clear drawn sections', () => {
            let obj = { getCoords: () => {}, key: 'blam' };
            helpService.setDrawn(obj);
            helpService.clearDrawn(obj);

            expect(helpService.drawnCache.length)
                .toBe(0);
        });
    });
});
