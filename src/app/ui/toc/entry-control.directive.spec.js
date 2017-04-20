/* global bard, $compile, $rootScope, $httpBackend, tocService */

describe('rvTocEntryControl', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerItemButton directive
    const rvTocEntryController = {
        entry: {
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

    function mockLayoutService($provide) {
        $provide.factory('layoutService', $q => () => $q(fulfill => fulfill()));
    }

    // fake gapi service
    function mockGeoService($provide) {
        $provide.factory('geoService', () => {
            return {};
        });
    }

    function mockToast($provide) {
        $provide.service('$mdToast', () => {});
    }

    function mockConfigService($provide) {
        $provide.service('configService', () => {});
    }

    function mockDebounceService($provide) {
        $provide.factory('debounceService', () => {
            return {
                registerDebounce: () => {}
            };
        });
    }

    function mockErrorService($provide) {
        $provide.service('errorService', () => {});
    }

    function mockStorageService($provide) {
        $provide.service('storageService', $q => () => $q.resolve());
    }

    function mockGraphicsService($provide) {
        $provide.service('graphicsService', $q => () => $q.resolve());
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', 'app.common.router', 'app.geo',
            'pascalprecht.translate', mockConfigService, mockLayoutService, mockGeoService,
            mockToast, mockErrorService, mockDebounceService, mockStorageService, mockGraphicsService);

        // inject angular services
        bard.inject('$compile', '$rootScope', '$httpBackend', 'tocService');

        // spy on visibility toggle method
        spyOn(tocService.presets.options.visibility, 'action');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-toc-entry-control option="visibility"></rv-toc-entry-control>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvTocEntryController',
            rvTocEntryController);

        $httpBackend.expectGET('content/images/iconsets/action-icons.svg')
            .respond({});

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvTocEntryControl', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

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
