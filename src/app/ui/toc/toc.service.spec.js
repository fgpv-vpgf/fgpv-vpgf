/* global bard, tocService, stateManager, $rootScope, $timeout */

// lots of info about $timeout here: http://www.bradoncode.com/blog/2015/06/11/unit-testing-code-that-uses-timeout-angularjs/

describe('tocService', () => {
    beforeEach(() => {
        bard.appModule('app.ui.toc', 'app.common.router');

        // inject services
        bard.inject('tocService', 'stateManager', '$rootScope', '$timeout');
    });

    // resolve stateManager locks and executes an option function; this is needed to avoid waiting for state animation  to complete
    function spyWatch(name, func) {
        const sm = stateManager; // global stateManager variable was disappearing for some reason

        $rootScope.$watch(() => sm.get(name), (newValue, oldValue) => {
            //console.log(name, newValue, oldValue);

            sm.resolve(name);
            if (func) {
                func(newValue, oldValue);
            }
        });

        $rootScope.$digest();
    }

    describe('tocService', () => {
        // check that service is created
        it('should be created successfully', () => {
            // check if service is defined
            expect(tocService)
                .toBeDefined();
        });

        it('should open metadata panel with some data and close it', done => {
            let toggle = tocService.presets.toggles.metadata;
            let display = tocService.display.metadata;
            let layer = tocService.data.items[0].items[0]; // first layer from the first group
            let layerToggle = layer.toggles.metadata;

            const to = $timeout; // global $timeout variable was disappearing for some reason, I think because of the async nature of these tests

            spyWatch('sideMetadata');
            spyWatch('side');

            expect(display.isLoading)
                .toBe(false);
            expect(layerToggle.selected)
                .toBeFalsy(); // layer toggle is not selected yet
            expect(display.layerId)
                .toBe(-1);
            expect(display.data)
                .toEqual({}); // no metadata

            toggle.action(layer); // open metadata panel; it will generate some fake metadata right now
            $rootScope.$digest();

            to.flush(150); // flush timer past loading timeout

            expect(display.isLoading)
                .toBe(true);
            expect(layerToggle.selected)
                .toBe(true); // layer toggle is already selected

            expect(display.layerId)
                .toBe(0);

            to.flush(5000); // flush metadata generation timer

            expect(display.isLoading)
                .toBe(false);
            expect(layerToggle.selected)
                .toBe(true);

            expect(display.layerId)
                .toBe(0);
            expect(display.data.length)
                .toBeGreaterThan(0); // some metadata was generated

            spyWatch('sideMetadata', newValue => {
                // waiting for sideMetadata to close, it should clear metadata display object
                if (!newValue) {
                    expect(display.layerId)
                        .toBe(-1); // layer id is reset
                    expect(layerToggle.selected)
                        .toBe(false); // layer toggle no longer selected

                    done();
                }
            });

            toggle.action(layer); // close metadata panel;
            $rootScope.$digest();

            to.verifyNoPendingTasks();
        });
    });
});
