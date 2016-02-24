/* global bard, $compile, $rootScope, $httpBackend */

describe('rvShell', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock custom loader module
    function customTranslateLoader($provide, $translateProvider) {
        // for customLoader use a function returning a self-fulfilling promise to mock the service
        $provide.factory('customLoader', $q => () => $q(fulfill => fulfill()));

        $translateProvider.useLoader('customLoader');
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.layout', 'app.templates', 'app.ui', customTranslateLoader);

        // inject angular services
        bard.inject('$compile', '$rootScope', '$httpBackend');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-shell></rv-shell>'
        );

        $httpBackend.expectGET('content/images/iconsets/navigation-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/maps-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/action-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/mdi-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/editor-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/content-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/social-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/image-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/hardware-icons.svg')
            .respond({});

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvShell', () => {
        // check that controller is created
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();
        });
    });
});
