/* global bard, $compile, $rootScope, tocService */

describe('rvLayerGroupToggle', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock a group object
    const mockGroup = {
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
    };

    // mock $mdDialog service because adding 'ngMaterial' module causes more problems;
    // it tries to actually load icons used in the rvlayerGroupToggle template and we would need to mock that out as well
    function mockMdDialog($provide) {
        $provide.service('$mdDialog', () => {});
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', mockMdDialog, 'app.common.router', 'app.geo');

        // inject angular services
        bard.inject('$compile', '$rootScope', 'tocService');

        // spy on group visibility toggle method
        spyOn(tocService.actions, 'toggleLayerGroup');

        // crete new scope
        scope = $rootScope.$new();

        // add mockGroup object to the scope, so directive has access to it
        scope.item = mockGroup;

        directiveElement = angular.element(
            '<rv-layer-group-toggle group="item"></rv-layer-group-toggle>'
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvLayerGroupToggle', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive pulled the toggleGroup function from mocked tocController
            expect(directiveScope.self.toggleLayerGroup)
                .toBeDefined();

            // call toggleGroup method on the directive
            directiveScope.self.toggleLayerGroup();

            // check if the corresponding method has been called
            expect(tocService.actions.toggleLayerGroup)
                .toHaveBeenCalled();
        });
    });
});
