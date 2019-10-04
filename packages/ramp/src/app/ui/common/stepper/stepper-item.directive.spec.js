/* global bard, $compile, $rootScope */

describe('rvStepperItem', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    function mockTranslateFilterService($provide) {
        $provide.value('translateFilter', value => value);
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.common', 'app.templates', mockTranslateFilterService);

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            `<rv-stepper-item title-value="Six months" summary-value="later" step-number="3" is-active="true">
                It's in French!
            </rv-stepper-item>`
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvStepperItem', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();
        });
    });
});
