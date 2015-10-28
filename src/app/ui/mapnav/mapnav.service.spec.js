/* global bard, mapNavigationService */

describe('mapNavigationService', () => {
    beforeEach(() => {
        // mock the module with bardjs
        bard.appModule('app.ui.mapnav');

        // inject services
        bard.inject('mapNavigationService');

        // spy on zoom functions
        spyOn(mapNavigationService, 'zoomIn');
        spyOn(mapNavigationService, 'zoomOut');
        spyOn(mapNavigationService, 'zoomTo');
    });

    bard.verifyNoOutstandingHttpRequests();

    describe('mapNavigationService', () => {
        // check that controller is created
        it('should be created successfully', () => {
            // check if service is defined
            expect(mapNavigationService)
                .toBeDefined();

            // check if zoom functions can be called
            mapNavigationService.zoomIn();
            mapNavigationService.zoomOut();
            mapNavigationService.zoomTo(5);

            expect(mapNavigationService.zoomIn)
                .toHaveBeenCalled();
            expect(mapNavigationService.zoomOut)
                .toHaveBeenCalled();
            expect(mapNavigationService.zoomTo)
                .toHaveBeenCalledWith(5);

        });
    });
});
