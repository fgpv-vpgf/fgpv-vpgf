/* global bard, $compile, $rootScope */

describe('rvLayerItemFlag', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerItemFlag directive
    const rvTocEntryController = {
        entry: {
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

    function mockErrorService($provide) {
        $provide.service('errorService', () => {});
    }

    function mockFocusService($provide) {
        $provide.factory('focusService', () => {
            return {
                createLink: () => {}
            };
        });
    }

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.toc', 'app.templates', 'app.common.router', 'app.geo',
            'pascalprecht.translate', mockConfigService, mockLayoutService, mockGeoService,
            mockToast, mockErrorService, mockFocusService);

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            '<rv-toc-entry-flag name="user"></rv-toc-entry-flag>'
        );

        // need to mock the required controller inside the directive being tested;
        // http://stackoverflow.com/a/19951141
        directiveElement.data('$rvTocEntryController',
            rvTocEntryController);
        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvTocEntryFlag', () => {
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
