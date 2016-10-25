/* global bard, $compile, $rootScope, stateManager */

describe('rvMorph', () => {
    let scope;
    let directiveElement;

    const mockState = {
        filters: {
            active: false,
            morph: 'full'
        }
    };

    beforeEach(() => {
        // mock the module with bardjs
        bard.appModule('app.ui.common', 'app.common.router');

        // inject angular services
        bard.inject('$compile', '$rootScope', 'stateManager');

        stateManager.addState(mockState);

        // crete new scope
        scope = $rootScope.$new();

        // create new element; set morph speed to 0 to speed up tests
        directiveElement = $compile(angular.element(
                '<div rv-morph="filters" rv-morph-speed="0"></div>'))
            (scope);
        scope.$digest();
    });

    describe('rvMorph', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive attribute value is set correctly
            expect(directiveElement.attr('rv-morph'))
                .toEqual('filters');
        });

        it('should change class name', done => {
            // check if the initial class is set correctly with no delay
            expect(directiveElement.hasClass(mockState.filters.morph))
                .toBe(true);

            stateManager.setMorph('filters', 'half');
            scope.$digest();

            // use small timeout since even zero-length animation is async
            setTimeout(() => {

                expect(directiveElement.hasClass('half'))
                    .toBe(true);
                done();
            }, 100);
        });
    });
});
