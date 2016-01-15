/* global bard, stateManager, $rootScope */

describe('stateManager', () => {
    const mockState = {
        main: {
            active: false
        },
        mainToc: {
            active: false,
            parent: 'main'
        },
        mainToolbox: {
            active: false,
            parent: 'main'
        },
        side: {
            active: false
        },
        sideMetadata: {
            active: false,
            parent: 'side'
        },
        sideSettings: {
            active: false,
            parent: 'side'
        },
        filters: {
            active: false,
            morph: 'default'
        },
        filtersFulldata: {
            active: false,
            parent: 'filters',
        },
        filtersNamedata: {
            active: false,
            parent: 'filters'
        }
    };

    beforeEach(() => {

        bard.appModule('app.common.router');

        // inject services
        bard.inject('stateManager', '$rootScope');

        stateManager.addState(mockState);

        // a spy can stub any function and tracks calls to it and all arguments. We spy on the service functions to check if they are being called properly. http://jasmine.github.io/2.0/introduction.html#section-Spies
        //spyOn(mapNavigationService, 'zoomIn');
        //spyOn(mapNavigationService, 'zoomOut');
        //spyOn(mapNavigationService, 'zoomTo');
    });

    describe('stateManager', () => {
        // check that controller is created

        it('should be created successfully', () => {
            let state = stateManager.state;

            // check if service is defined
            expect(stateManager)
                .toBeDefined();

            // check initial states
            expect(state.main.active)
                .toBe(false);
            expect(state.mainToc.active)
                .toBe(false);
            expect(state.mainToolbox.active)
                .toBe(false);
        });

        it('should change child state correctly', done => {
            let state = stateManager.state;

            // open mainToc; main should open as parent
            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => state.mainToc.active, () =>
                stateManager.callback('mainToc', 'active'));
            $rootScope.$watch(() => state.mainToolbox.active, () =>
                stateManager.callback('mainToolbox', 'active'));
            $rootScope.$watch(() => state.main.active, () =>
                stateManager.callback('main', 'active'));

            $rootScope.$digest(); // need to kickstart digest cycle to init watches

            stateManager.setActive('mainToc')
                .then(() => {
                    expect(state.main.active)
                        .toBe(true);
                    expect(state.main.activeSkip)
                        .toBe(false); // panel should animate

                    expect(state.mainToc.active)
                        .toBe(true);
                    expect(state.mainToc.activeSkip)
                        .toBe(true); // mainToc should not animate

                    expect(state.mainToolbox.active)
                        .toBe(false);
                    expect(state.mainToolbox.activeSkip)
                        .toBe(false); // mainToolbox should not do anything, so it defaults to animate

                    // open toolbox; toc should close
                    return stateManager.setActive('mainToolbox');
                })
                .then(() => {
                    expect(state.main.active)
                        .toBe(true);
                    expect(state.main.activeSkip)
                        .toBe(false); // main should not do anything, still says animate from before

                    expect(state.mainToc.active)
                        .toBe(false);
                    expect(state.mainToc.activeSkip)
                        .toBe(false); // mainToc is closing, should animate

                    expect(state.mainToolbox.active)
                        .toBe(true);
                    expect(state.mainToolbox.activeSkip)
                        .toBe(false); // mainToolbox is openeing, should animate

                    // close toolbox; main should also close
                    return stateManager.setActive('mainToolbox');
                })
                .then(() => {
                    expect(state.main.active)
                        .toBe(false);
                    expect(state.main.activeSkip)
                        .toBe(false); // main is closing, should animate

                    expect(state.mainToc.active)
                        .toBe(false);
                    expect(state.mainToc.activeSkip)
                        .toBe(true); // mainToc is closed immediately after its parent, no animation

                    expect(state.mainToolbox.active)
                        .toBe(false);
                    expect(state.mainToolbox.activeSkip)
                        .toBe(true); // mainToolbox is closed immediately after its parent, no animation

                    done();
                });

            $rootScope.$digest(); // why? http://brianmcd.com/2014/03/27/a-tip-for-angular-unit-tests-with-promises.html
        });

        it('should change parent state correctly', done => {
            let state = stateManager.state;

            // open main; should auto-open one of the children
            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => state.main.active, () =>
                stateManager.callback('main', 'active'));

            $rootScope.$digest();

            stateManager.setActive('main')
                .then(() => {
                    expect(state.main.active)
                        .toBe(true);

                    let mainToc = state.mainToc.active;
                    let mainToolbox = state.mainToolbox.active;

                    // only one child should be open
                    expect(mainToc || mainToolbox)
                        .toBe(true);
                    expect(mainToc && mainToolbox)
                        .toBe(false);

                    // close parent item: everything should close
                    return stateManager.setActive('main');
                })
                .then(() => {
                    expect(state.main.active)
                        .toBe(false);
                    expect(state.main.activeSkip)
                        .toBe(false); // main is closing, should animate

                    expect(state.mainToc.active)
                        .toBe(false);
                    expect(state.mainToc.activeSkip)
                        .toBe(true); // mainToc is closed immediately after its parent, no animation

                    expect(state.mainToolbox.active)
                        .toBe(false);
                    expect(state.mainToolbox.activeSkip)
                        .toBe(true); // mainToolbox is closed immediately after its parent, no animation

                    done();
                });

            $rootScope.$digest();
        });

        it('should change modes correctly', () => {
            let state = stateManager.state;

            expect(state.filters.morph)
                .toBe('default');

            stateManager.setMorph('filters', 'half');

            expect(state.filters.morph)
                .toBe('half');
        });

        it('should chain state changes correctly', done => {
            let state = stateManager.state;

            expect(state.main.active)
                .toBe(false);
            expect(state.main.activeSkip)
                .toBe(false); // defaults to true

            expect(state.mainToc.active)
                .toBe(false);
            expect(state.mainToc.activeSkip)
                .toBe(false); // defaults to true

            expect(state.side.active)
                .toBe(false);
            expect(state.side.activeSkip)
                .toBe(false); // defaults to true

            expect(state.sideMetadata.active)
                .toBe(false);
            expect(state.sideMetadata.activeSkip)
                .toBe(false); // defaults to true

            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => state.main.active, () =>
                stateManager.callback('main', 'active'));
            $rootScope.$watch(() => state.mainToc.active, newValue => {
                // toc should be open already but not metadata
                if (newValue) {
                    expect(state.main.active)
                        .toBe(true);
                    expect(state.main.activeSkip)
                        .toBe(false); // main is opening, should animate

                    expect(state.mainToc.active)
                        .toBe(true);
                    expect(state.mainToc.activeSkip)
                        .toBe(true); // mainToc is opened immediately, no animation

                    expect(state.side.active)
                        .toBe(false);
                    expect(state.side.activeSkip)
                        .toBe(false); // defaults to animation

                    expect(state.sideMetadata.active)
                        .toBe(false);
                    expect(state.sideMetadata.activeSkip)
                        .toBe(false); // defaults to animation
                }
                stateManager.callback('mainToc', 'active');
            });
            $rootScope.$watch(() => state.side.active, () =>
                stateManager.callback('side', 'active'));
            $rootScope.$watch(() => state.sideMetadata.active, () =>
                stateManager.callback('sideMetadata', 'active'));

            $rootScope.$digest();

            // open mainToc; stateManager should wait for mainToc to resolve and then open sideMetadata
            stateManager.setActive('mainToc', 'sideMetadata')
                .then(() => {
                    // both mainToc and sideMetadata should be open
                    expect(state.main.active)
                        .toBe(true);
                    expect(state.main.activeSkip)
                        .toBe(false); // main hasn't change its state since last transition

                    expect(state.mainToc.active)
                        .toBe(true);
                    expect(state.mainToc.activeSkip)
                        .toBe(true); // mainToc hasn't change its state since last transition

                    expect(state.side.active)
                        .toBe(true);
                    expect(state.side.activeSkip)
                        .toBe(false); // side is opening, should animate

                    expect(state.sideMetadata.active)
                        .toBe(true);
                    expect(state.sideMetadata.activeSkip)
                        .toBe(true); // sideMetadata is opened immediately, no animation

                    done();
                });

            $rootScope.$digest();
        });
    });
});
