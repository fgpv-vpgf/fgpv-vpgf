/* global bard, stateManager, $rootScope */

describe('stateManager', () => {

    const mainPanelNames = ['main', 'mainToc', 'mainToolbox', 'mainDetails',
        'mainGeosearch', 'mainLoaderFile', 'mainLoaderService'];

    function mocklayoutService($provide) {
        $provide.service('layoutService', $q => () => $q.resolve());
    }

    beforeEach(() => {

        bard.appModule('app.common.router', mocklayoutService);

        // inject services
        bard.inject('stateManager', '$rootScope');
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

        it('should open parent panel on child panel opening', done => {
            let state = stateManager.state;

            $rootScope.$watch(() => state.main.active, () =>
                stateManager.callback('main', 'active'));

            $rootScope.$digest();

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

                    done();
                }).catch(e => {
                    fail(`Exception was thrown: ${e}`);
                    done();
                });

            $rootScope.$digest();
        });

        it('should swap siblings and leave parent open', done => {
            let state = stateManager.state;

            $rootScope.$watch(() => state.main.active, () =>
                stateManager.callback('main', 'active'));

            $rootScope.$digest();

            stateManager.setActive('mainToolbox')
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
                        .toBe(true); // mainToolbox is openeing, should animate

                    // close toolbox; main should also close
                    done();
                }).catch(e => {
                    fail(`Exception was thrown: ${e}`);
                    done();
                });

            $rootScope.$digest();
        });

        it('should change parent state correctly', done => {
            let state = stateManager.state;

            // open main; should auto-open one of the children
            // need to listen on item state changes and resolve locks on the stateManager
            mainPanelNames.forEach(panelName =>
                $rootScope.$watch(() => state[panelName].active, () =>
                    stateManager.callback(panelName, 'active')));

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

            expect(state.table.morph)
                .toBe('default');

            stateManager.setMorph('table', 'half');

            expect(state.table.morph)
                .toBe('half');
        });

        it('should chain state changes correctly', done => {
            let state = stateManager.state;

            expect(state.main.active)
                .toBe(false);
            expect(state.main.activeSkip)
                .toBe(false); // defaults to false

            expect(state.mainToc.active)
                .toBe(false);
            expect(state.mainToc.activeSkip)
                .toBe(false); // defaults to false

            expect(state.side.active)
                .toBe(false);
            expect(state.side.activeSkip)
                .toBe(false); // defaults to false

            expect(state.sideMetadata.active)
                .toBe(false);
            expect(state.sideMetadata.activeSkip)
                .toBe(false); // defaults to false

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

        it('should keep panel change history', function () {
            let history = stateManager.panelHistory;

            expect(history.length)
                .toBe(0);

            $rootScope.$digest(); // need to kickstart digest cycle to init watches

            stateManager.setActive('mainToc')
                .then(() => {
                    expect(history.length)
                        .toBe(1);
                    expect(history[0])
                        .toBe('mainToc');

                    // open toolbox; toc should close
                    return stateManager.setActive('mainToolbox');
                })
                .then(() => {
                    expect(history.length)
                        .toBe(2);

                    // close toolbox
                    return stateManager.setActive('mainToolbox');
                })
                .then(() => {
                    expect(history.length)
                        .toBe(2);
                });

            $rootScope.$digest();
        });

        // FIXME: test is broken; it should pass after the TODO on line 146 in stateManager.js is done
        xit('should track change history properly', done => {
            let state = stateManager.state;

            console.log(state.main);

            expect(state.main.history.length)
                .toBe(0);

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
                .then(() => stateManager.setActive('mainToc'))
                .then(() => stateManager.setActive('mainToc'))
                .then(() => stateManager.setActive('mainToc'))
                .then(() => stateManager.setActive('mainToc'))
                .then(() => {
                    expect(state.main.history)
                        .toEqual(['mainToc', null, 'mainToc', null, 'mainToc']);

                    console.log('----', state.main);
                    done();
                });

            $rootScope.$digest();
        });
    });
});
