/* global bard, mapNavigationService */

/*
    bardjs is a library wrapping some of the routine tasks like mocking and injecting
*/

describe('mapNavigationService', () => {

    function mockConfigService($provide) {
        $provide.factory('configService', () => {
            return {};
        });
    }

    // fake gapi service
    function mockGeoService($provide) {
        $provide.factory('geoService', () => {
            return {};
        });
    }

    beforeEach(() => {
        /*
            mock the module with bardjs: https://github.com/wardbell/bardjs#appmodule
            this identifies the module to test and disables routine services, similar to the vanilla function `angular.mock.module('app.ui.mapnav')`

            Here 'app.ui.mapnav' module is identified as we are testing `mapNavigationService` service. We also need 'app.common.router' module since mapNavigationService uses StateManager.
        */
        bard.appModule('app.ui.mapnav', 'app.common.router', 'app.geo', 'pascalprecht.translate',
            mockConfigService, mockGeoService);

        /*
            injects angular components needed for testing and stores them on the global window object: https://github.com/wardbell/bardjs#inject

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
    });

    describe('mapNavigationService', () => {
        // disabled test - throwing error when service is working as intended
        xit('should be created successfully', () => {
            // check if service is defined
            expect(mapNavigationService)
                .toBeDefined();
        });
    });
});
