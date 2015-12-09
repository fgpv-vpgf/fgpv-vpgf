/* global bard, $compile, $rootScope, stateManager */

describe('rvState', () => {
    let scope;
    let directiveElement;

    const mockState = {
        filters: {
            enabled: true,
            mode: 'full'
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
                '<div><div rv-state="filters"></div></div>'))
            (scope);
        scope.$digest();
    });

    describe('rvState', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive attribute value is set correctly
            expect(directiveElement.children().attr('rv-state'))
                .toEqual('filters');
        });

        it('should change class name', done => {
            // check if the element tied to rv-state is in the dom
            expect(directiveElement.children().length)
                .toBe(1);

            stateManager.set({ filters: false });
            scope.$digest();

            // use small timeout since even zero-length animation is async
            setTimeout(() => {

                expect(directiveElement.children().length)
                    .toBe(0);
                done();
            }, 50);
        });
    });
});
