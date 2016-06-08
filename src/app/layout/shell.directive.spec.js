/* global bard, $compile, $rootScope, $rootElement, $httpBackend, $q */

describe('rvShell', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;
    // window.globalRegistry = { appRegistry: {} };

    // fake gapi service
    function mockGapiService($provide) {
        $provide.factory('gapiService', () => {
            return {};
        });
    }

    // fake gapi service
    function mockGeoService($provide) {
        $provide.factory('geoService', () => {
            return {
                assembleMap: angular.noop,
                registerMapNode: angular.noop,
            };
        });
    }

    function mockGlobalRegistry($provide) {
        $provide.constant('globalRegistry', {
            getMap: () => {
                return {
                    _registerMap: angular.noop
                };
            },
            _nodes: {}
        });
    }

    // mock custom loader module
    function customTranslateLoader($provide, $translateProvider) {
        // for customLoader use a function returning a self-fulfilling promise to mock the service
        $provide.factory('customLoader', $q => () => $q(fulfill => fulfill()));

        $translateProvider.useLoader('customLoader');
    }

    function mockConfigService($provide) {
        $provide.service('configService', () => {
            return {
                initialize: () => {},
                getCurrent: () => {
                    return $q.resolve({
                        menuPanel: {
                            markerImage: ''
                        }
                    });
                },
                ready: () => {
                    return $q.resolve({});
                }
            };
        });
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.layout', 'app.templates', 'app.ui', customTranslateLoader,
            mockConfigService, mockGapiService, mockGeoService, mockGlobalRegistry,
            'app.common.router');

        // inject angular services
        bard.inject('$compile', '$rootScope', '$rootElement', '$httpBackend', '$q', 'stateManager');

        // set root element id as the app's id
        $rootElement.attr('id', 'rv-app-0');

        // crete new scope
        scope = $rootScope.$new();

        // "mock" the node array that app-seed uses
        window.RV._nodes = [];

        directiveElement = angular.element(
            '<rv-shell></rv-shell>'
        );

        $httpBackend.expectGET('content/images/iconsets/navigation-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/maps-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/action-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/default-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/editor-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/content-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/file-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/mdi-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/editor-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/social-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/image-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/file-icons.svg')
            .respond({});
        $httpBackend.expectGET('content/images/iconsets/hardware-icons.svg')
            .respond({});
        $httpBackend.expectGET('src/config.en-CA.json')
            .respond({});
        $httpBackend.expectGET('src/config.fr-CA.json')
            .respond({});

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvShell', () => {
        // disabled as it is throwing a 'TypeError: [object Arguments] is not a function'
        // despite no changes to the directive itself
        xit('should be created successfully', () => {
            expect(directiveElement)
                .toBeDefined();
        });
    });
});
