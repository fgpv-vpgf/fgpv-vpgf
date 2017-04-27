/* global bard, $compile, $rootScope */

describe('rvHelpOverlay', () => {
    let scope;
    let directiveElement;

    beforeEach(() => {
        // mock the module with bardjs
        bard.appModule('app.ui.common');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();

        // create new element; set morph speed to 0 to speed up tests
        directiveElement = $compile(angular.element( '<rv-help-overlay></rv-help-overlay>'))(scope);
        scope.$digest();
    });

    describe('rvHelpOverlay', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();
        });
    });
});
