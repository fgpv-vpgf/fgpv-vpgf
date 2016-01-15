/* global bard, $compile, $rootScope, helpService */

describe('rvHelp', () => {
    let scope;
    let directiveElement;

    beforeEach(() => {
        // mock the module with bardjs
        bard.appModule('app.ui.common', 'app.ui.help');

        // inject angular services
        bard.inject('$compile', '$rootScope', 'helpService');

        spyOn(helpService, 'register');

        // crete new scope
        scope = $rootScope.$new();

        // create new element; set morph speed to 0 to speed up tests
        directiveElement = $compile(angular.element(
                '<div rv-help="test"></div>'))
            (scope);
        scope.$digest();
    });

    describe('rvHelp', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive attribute value is set correctly
            expect(directiveElement.attr('rv-help'))
                .toEqual('test');

            // check that the element is registered
            expect(helpService.register)
                .toHaveBeenCalled();
        });
    });
});
