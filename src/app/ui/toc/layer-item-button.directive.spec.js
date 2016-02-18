/* global bard, $compile, $rootScope, $httpBackend, tocService */

describe('rvLayerItemButton', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerItemButton directive
    const rvLayerItemController = {
        layer: {
            type: 'layer',
            name: 'Image Layers 1',
            layerType: 'image',
            id: 1,
            options: {
                visibility: {
                    value: 'on', // 'off', 'zoomIn', 'zoomOut'
                    enabled: true
                }
            }
        }
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', 'ngMaterial', 'app.common.router', 'app.geo',
            'pascalprecht.translate');

        // inject angular services
        bard.inject('$compile', '$rootScope', '$httpBackend', 'tocService');

        // spy on visibility toggle method
        spyOn(tocService.presets.options.visibility, 'action');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-layer-item-button name="visibility"></rv-layer-item-button>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvLayerItemController',
            rvLayerItemController);

        $httpBackend.expectGET('content/images/iconsets/action-icons.svg')
            .respond({});

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvLayerItemButton', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive correctly pulled control object from the mocked controller
            expect(directiveScope.self.control.value)
                .toBe('on');

            // check that directive pulled an action frunction from tocService
            expect(directiveScope.self.action)
                .toBeDefined();

            // call action method on the directive
            directiveScope.self.action(directiveScope.self.layer);

            // check if the corresponding method on tocService has been called
            expect(tocService.presets.options.visibility.action)
                .toHaveBeenCalled();
        });
    });
});
