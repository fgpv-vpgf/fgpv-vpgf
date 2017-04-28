/* global bard, $compile, $rootScope, stateManager */

describe('rvState', () => {
    let scope;
    let directiveElement;

    const mockState = {
        filters: {
            active: true,
            morph: 'full'
        }
    };

    function mockStorageService($provide) {
        $provide.service('storageService', $q => () => $q.resolve());
    }

    beforeEach(() => {
        // mock the module with bardjs
        bard.appModule('app.ui.common', 'app.common.router', mockStorageService);

        // inject angular services
        bard.inject('$compile', '$rootScope', 'stateManager');

        stateManager.addState(mockState);

        // crete new scope
        scope = $rootScope.$new();

        // create new element; set morph speed to 0 to speed up tests
        directiveElement = $compile(angular.element('<div rv-state="filters"></div>'))(scope);
        scope.$digest();
    });

    describe('rvState', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive attribute value is set correctly
            expect(directiveElement.attr('rv-state'))
                .toEqual('filters');
        });

        it('should hide the element in the dom', done => {
            // check if the element tied to rv-state is in the dom
            expect(directiveElement.hasClass('ng-hide'))
                .toBe(false);

            stateManager.setActive({ filters: false });
            scope.$digest();

            // use small timeout since even zero-length animation is async
            setTimeout(() => {

                expect(directiveElement.hasClass('ng-hide'))
                    .toBe(true);
                done();
            }, 50);
        });

        it('should add the element to the dom', done => {
            stateManager.setActive({ filters: false });
            scope.$digest();

            // use small timeout since even zero-length animation is async
            setTimeout(() => {

                expect(directiveElement.hasClass('ng-hide'))
                    .toBe(true);

                stateManager.setActive({ filters: true });
                scope.$digest();

                setTimeout(() => {
                    expect(directiveElement.hasClass('ng-hide'))
                        .toBe(false);
                    done();
                }, 50);
            }, 50);
        });
    });
});
