/* global bard, $compile, $rootScope */

describe('rvLayerItemFlag', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerItemFlag directive
    const rvLayerItemController = {
        layer: {
            type: 'layer',
            name: 'Layer Name 1 Layer Name 1 Layer Name 1 Layer Name 1',
            layerType: 'feature',
            id: 0,
            flags: {
                user: {
                    visible: true
                }
            }
        },
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', 'app.common.router', 'app.geo', 'pascalprecht.translate');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-layer-item-flag name="user"></rv-layer-item-flag>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvLayerItemController',
            rvLayerItemController);
        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvLayerItemFlag', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive correctly pulled control object from the mocked controller
            expect(directiveScope.self.control.visible)
                .toBe(true);
        });
    });
});
