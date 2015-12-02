/* global bard, $compile, $rootScope */

describe('rvLayerGroupToggle', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerGroupToggle directive
    const ngController = {
        toggleGroup: () => {}
    };

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

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // spy on group visibility toggle method
        spyOn(ngController, 'toggleGroup');

        // crete new scope
        scope = $rootScope.$new();

        // add mockGroup object to the scope, so directive has access to it
        scope.item = mockGroup;

        directiveElement = angular.element(
            '<rv-layer-group-toggle group="item"></rv-layer-group-toggle>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$ngControllerController',
            ngController);
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
            expect(directiveScope.self.toggleGroup)
                .toBeDefined();

            // call toggleGroup method on the directive
            directiveScope.self.toggleGroup();

            // check if the corresponding method has been called
            expect(ngController.toggleGroup)
                .toHaveBeenCalled();
        });
    });
});
