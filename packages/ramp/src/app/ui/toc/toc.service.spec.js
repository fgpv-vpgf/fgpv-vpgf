/* global bard, tocService, stateManager, $rootScope, $timeout */

// lots of info about $timeout here: http://www.bradoncode.com/blog/2015/06/11/unit-testing-code-that-uses-timeout-angularjs/
// TODO: when testing visibility toggle, need to extend mdToast mock to include functions `simple` and `show`; `show` should return a resolved promise
describe('tocService', () => {
    // global stateManager variable was disappearing for some reason
    let rs;
    let sm;

    function mockLayoutService($provide) {
        $provide.factory('layoutService', $q => () => $q(fulfill => fulfill()));
    }

    function mockToast($provide) {
        $provide.service('$mdToast', () => {});
    }

    beforeEach(() => {
        bard.appModule('app.ui.toc', 'app.common.router', 'app.geo', mockLayoutService, mockToast);

        // inject services
        bard.inject('tocService', 'stateManager', '$rootScope', '$timeout');
        rs = $rootScope;
        sm = stateManager;
    });

    // resolve stateManager locks and executes an option function; this is needed to avoid waiting for state animation  to complete
    function spyWatch(name, func) {
        // const sm = stateManager; // global stateManager variable was disappearing for some reason

        rs.$watch(() => sm.state[name].active, (newValue, oldValue) => {

            sm.callback(name, 'active');
            if (func) {
                func(newValue, oldValue);
            }
        });

        rs.$digest();
    }

    // TODO: unit-test temporary disabled for metadata service; metadata service indroduced async
    // promises that casue the test to fail.
    xdescribe('tocService', () => {
        // check that service is created
        it('should be created successfully', () => {
            // check if service is defined
            expect(tocService)
                .toBeDefined();
        });

        it('should open metadata panel with some data and close it', done => {
            let toggle = tocService.presets.options.metadata;
            let display = sm.display.metadata;
            let layer = tocService.data.items[1].items[0]; // first layer from the first group
            let layerOption = layer.options.metadata;

            const to = $timeout; // global $timeout variable was disappearing for some reason, I think because of the async nature of these tests

            spyWatch('sideMetadata');
            spyWatch('side');

            expect(display.isLoading)
                .toBe(false);
            expect(layerOption.selected)
                .toBeFalsy(); // layer toggle is not selected yet
            expect(display.requestId)
                .toEqual(null); // request hasn't been made
            expect(display.data)
                .toEqual(null); // no metadata

            toggle.action(layer); // open metadata panel; it will generate some fake metadata right now
            rs.$digest();

            to.flush(200); // flush timer past loading timeout

            // TODO: when we have a real function to fetch metadata, need to mock it here and simulate the delay
            expect(display.isLoading)
                .toBe(true);
            expect(layerOption.selected)
                .toBe(true); // layer toggle is already selected

            expect(display.requester.id)
                .toBe(3);

            to.flush(5000); // flush metadata generation timer

            expect(display.isLoading)
             .toBe(false);

            expect(layerOption.selected)
                .toBe(true);

            expect(display.requester.id)
                .toBe(3);

            expect(display.data.length)
                .toBeGreaterThan(0); // some metadata was generated

            rs.$watch(() => stateManager.display.metadata.requester, newRequester => {
                // waiting for sideMetadata to close, it should clear metadata display object
                if (newRequester === null) {
                    expect(display.requestId)
                        .toEqual(null); // request id is reset
                    expect(layerOption.selected)
                        .toBe(false); // layer toggle no longer selected

                    expect(sm.state.sideMetadata.active)
                        .toBe(false);

                    done();
                }
            });

            toggle.action(layer); // close metadata panel;
            rs.$digest();

            to.verifyNoPendingTasks();
        });
    });
});
