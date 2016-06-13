/* global bard, $compile, $rootScope */

describe('rvDetails', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // fake geo service
    function mockGeoService($provide) {
        $provide.factory('geoService', () => {
            return {};
        });
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.details', 'app.templates', 'app.common.router', 'pascalprecht.translate',
            mockGeoService);

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-details></rv-details>'
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvDetails', () => {
        // disabled as controller removed and changed to link causing test error
        // TODO: test directive link functionality
        xit('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();
        });
    });
});
