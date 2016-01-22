/* global bard, $compile, $rootScope, tocService */

describe('rvLayerGroupToggleButton', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerGroupToggleButton directive
    const layerGroupToggleController = {
        group: {
            type: 'group',
            name: 'Image Layers',
            id: 1,
            expanded: false,
            items: [],
            toggles: {
                visibility: {
                    value: 'on', //'off', 'zoomIn', 'zoomOut'
                    enabled: true
                }
            }
        }
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', 'ngMaterial', 'app.common.router', 'app.geo');

        // inject angular services
        bard.inject('$compile', '$rootScope', 'tocService');

        // spy on group visibility toggle method
        spyOn(tocService.presets.groupToggles.visibility, 'action');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-layer-group-toggle-button name="visibility"></rv-layer-group-toggle-button>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvLayerGroupToggleController',
            layerGroupToggleController);
        directiveElement.data('$mdDialogProvider', {});
        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();

    });

    describe('rvLayerGroupToggleButton', () => {
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
            directiveScope.self.action(directiveScope.self.group);

            // check if the corresponding method on tocService has been called
            expect(tocService.presets.groupToggles.visibility.action)
                .toHaveBeenCalled();
        });
    });
});
