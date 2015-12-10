/* global bard, stateManager, $rootScope */

describe('stateManager', () => {
    const mockState = {
        main: {
            enabled: false
        },
        mainToc: {
            enabled: false,
            parent: 'main'
        },
        mainToolbox: {
            enabled: false,
            parent: 'main'
        },
        side: {
            enabled: false
        },
        sideMetadata: {
            enabled: false,
            parent: 'side'
        },
        sideSettings: {
            enabled: false,
            parent: 'side'
        },
        filters: {
            enabled: false,
            mode: 'default'
        },
        filtersFulldata: {
            enabled: false,
            parent: 'filters',
        },
        filtersNamedata: {
            enabled: false,
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
            // check if service is defined
            expect(stateManager)
                .toBeDefined();

            // check initial states
            expect(stateManager.get('main'))
                .toBe(false);
            expect(stateManager.get('mainToc'))
                .toBe(false);
            expect(stateManager.get('mainToolbox'))
                .toBe(false);
        });

        it('should change child state correctly', done => {
            // open mainToc; main should open as parent

            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => stateManager.get('mainToc'), () =>
                stateManager.resolve('mainToc'));
            $rootScope.$watch(() => stateManager.get('mainToolbox'), () =>
                stateManager.resolve('mainToolbox'));
            $rootScope.$watch(() => stateManager.get('main'), () =>
                stateManager.resolve('main'));

            $rootScope.$digest(); // need to kickstart digest cycle to init watches

            stateManager.set('mainToc')
                .then(() => {
                    expect(stateManager.get('main'))
                        .toBe(true);
                    expect(stateManager.get('mainToc'))
                        .toBe(true);
                    expect(stateManager.get('mainToolbox'))
                        .toBe(false);

                    // open toolbox; toc should close
                    return stateManager.set('mainToolbox');
                })
                .then(() => {
                    expect(stateManager.get('main'))
                        .toBe(true);
                    expect(stateManager.get('mainToc'))
                        .toBe(false);
                    expect(stateManager.get('mainToolbox'))
                        .toBe(true);

                    // close toolbox; main should also close
                    return stateManager.set('mainToolbox');
                })
                .then(() => {
                    expect(stateManager.get('main'))
                        .toBe(false);
                    expect(stateManager.get('mainToc'))
                        .toBe(false);
                    expect(stateManager.get('mainToolbox'))
                        .toBe(false);

                    done();
                });

            $rootScope.$digest(); // why? http://brianmcd.com/2014/03/27/a-tip-for-angular-unit-tests-with-promises.html
        });

        it('should change parent state correctly', done => {
            // open main; should auto-open one of the children

            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => stateManager.get('main'), () =>
                stateManager.resolve('main'));

            $rootScope.$digest();

            stateManager.set('main')
                .then(() => {
                    expect(stateManager.get('main'))
                        .toBe(true);

                    let mainToc = stateManager.get('mainToc');
                    let mainToolbox = stateManager.get('mainToolbox');

                    // only one child should be open
                    expect(mainToc || mainToolbox)
                        .toBe(true);
                    expect(mainToc && mainToolbox)
                        .toBe(false);

                    // close parent item: everything should close
                    return stateManager.set('main');
                })
                .then(() => {
                    expect(stateManager.get('main'))
                        .toBe(false);
                    expect(stateManager.get('mainToc'))
                        .toBe(false);
                    expect(stateManager.get('mainToolbox'))
                        .toBe(false);

                    done();
                });

            $rootScope.$digest();
        });

        it('should change modes correctly', () => {
            expect(stateManager.getMode('filters'))
                .toBe('default');

            stateManager.setMode('filters', 'half');

            expect(stateManager.getMode('filters'))
                .toBe('half');
        });

        it('should chain state changes correctly', done => {
            expect(stateManager.get('main'))
                .toBe(false);
            expect(stateManager.get('mainToc'))
                .toBe(false);
            expect(stateManager.get('side'))
                .toBe(false);
            expect(stateManager.get('sideMetadata'))
                .toBe(false);

            // need to listen on item state changes and resolve locks on the stateManager
            $rootScope.$watch(() => stateManager.get('main'), () =>
                stateManager.resolve('main'));
            $rootScope.$watch(() => stateManager.get('mainToc'), (newValue) => {
                // toc should be open already but not metadata
                if (newValue) {
                    expect(stateManager.get('main'))
                        .toBe(true);
                    expect(stateManager.get('mainToc'))
                        .toBe(true);
                    expect(stateManager.get('side'))
                        .toBe(false);
                    expect(stateManager.get('sideMetadata'))
                        .toBe(false);
                }
                stateManager.resolve('mainToc');
            });
            $rootScope.$watch(() => stateManager.get('side'), () =>
                stateManager.resolve('side'));
            $rootScope.$watch(() => stateManager.get('sideMetadata'), () =>
                stateManager.resolve('sideMetadata'));

            $rootScope.$digest();

            // open mainToc; stateManager should wait for mainToc to resolve and then open sideMetadata
            stateManager.set('mainToc', 'sideMetadata')
                .then(() => {
                    // both mainToc and sideMetadata should be open
                    expect(stateManager.get('main'))
                        .toBe(true);
                    expect(stateManager.get('mainToc'))
                        .toBe(true);
                    expect(stateManager.get('side'))
                        .toBe(true);
                    expect(stateManager.get('sideMetadata'))
                        .toBe(true);

                    done();
                });

            $rootScope.$digest();
        });
    });
});
