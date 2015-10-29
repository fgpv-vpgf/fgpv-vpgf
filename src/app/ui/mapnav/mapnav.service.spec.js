/* global bard, mapNavigationService */

/*
    bardjs is a library wrapping some of the routine tasks like mocking and injecting
*/

describe('mapNavigationService', () => {
    beforeEach(() => {
        /*
            mock the module with bardjs: https://github.com/wardbell/bardjs#appmodule
            this identifies the module to test and disables routine services, similar to the vanilla function `angular.mock.module('app.ui.mapnav')`

            Here 'app.ui.mapnav' module is identified as we are testing `mapNavigationService` service.
        */
        bard.appModule('app.ui.mapnav');

        /*
            injects angular components needed for testing and stores them on the global window oject: https://github.com/wardbell/bardjs#inject

            Using vanilla inject function requires you to store references to injected components turning `bard.inject('mapNavigationService')` into this:

            ```js
            let mapNavigationService;

            beforeEach(inject(_mapNavigationService_ => {
                mapNavigationService = _mapNavigationService_;
            }));
            ```

            Here we only inject mapNavigationService as it doesn't have any other dependencies.
         */

        // inject services
        bard.inject('mapNavigationService');

        // a spy can stub any function and tracks calls to it and all arguments. We spy on the service functions to check if they are being called properly. http://jasmine.github.io/2.0/introduction.html#section-Spies
        spyOn(mapNavigationService, 'zoomIn');
        spyOn(mapNavigationService, 'zoomOut');
        spyOn(mapNavigationService, 'zoomTo');
    });

    describe('mapNavigationService', () => {
        // check that controller is created
        it('should be created successfully', () => {
            // check if service is defined
            expect(mapNavigationService)
                .toBeDefined();

            // call service functions
            mapNavigationService.zoomIn();
            mapNavigationService.zoomOut();
            mapNavigationService.zoomTo(5);

            // using spies, check if they functions have been called correctly and with correct arguments
            expect(mapNavigationService.zoomIn)
                .toHaveBeenCalled();
            expect(mapNavigationService.zoomOut)
                .toHaveBeenCalled();
            expect(mapNavigationService.zoomTo)
                .toHaveBeenCalledWith(5);

        });
    });
});
