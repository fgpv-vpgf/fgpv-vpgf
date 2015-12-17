/* global bard, $compile, $rootScope */

describe('rvBasemapItem', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    const mockBasemap = {
        name: 'Basemap name',
        type: 'Basemap type',
        id: 1,
        url: 'someurl',
        wkid: '3987',
        selected: false
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.basemap', 'app.templates');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();
        scope.item = mockBasemap;

        directiveElement = angular.element(
            '<rv-basemap-item basemap="item"></rv-basemap-item>'
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();

        // spy on visibility toggle method
        spyOn(directiveScope.self, 'select');
    });

    describe('rvBasemapItem', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // check that directive correctly pulled basemap object from the shared scope
            expect(directiveScope.self.basemap)
                .toBeDefined();

            // check that directive pulled an action frunction from tocService
            expect(directiveScope.self.basemap.name)
                .toBe(mockBasemap.name);

            // call action method on the directive
            directiveScope.self.select();

            // check if the corresponding method on self has been called
            expect(directiveScope.self.select)
                .toHaveBeenCalled();
        });
    });
});
