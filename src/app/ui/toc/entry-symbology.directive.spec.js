/* global bard, $compile, $rootScope */

describe('rvTocEntrySymbology', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerItemFlag directive
    const rvTocEntryController = {
        element: angular.element('<div></div>')
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.geo', 'app.templates', 'pascalprecht.translate', 'app.ui.common');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();
        scope.symbology = [
            {
                icon: 'url',
                name: 'blah1'
            },
            {
                icon: 'url',
                name: 'blah2'
            }
        ];

        directiveElement = angular.element(
            '<rv-toc-entry-symbology symbology="symbology"></rv-toc-entry-symbology>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvTocEntryController',
            rvTocEntryController);
        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvTocEntrySymbology', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive correctly pulled bound symbology object from the markup
            expect(directiveScope.self.symbology.length)
                .toBe(2);
        });
    });
});
