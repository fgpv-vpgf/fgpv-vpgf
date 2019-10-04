/* global bard, $compile, $rootScope */

describe('rvContentPane0', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.panels', 'app.templates', 'pascalprecht.translate');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();
        directiveElement = angular.element(
            `
                <rv-content-pane title-style="title" title-value="Test pane directive">
                    <div>Dog Guts</div>
                </rv-content-pane>
            `
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvContentPane', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            // pane's content is correct
            expect(directiveElement.find('.rv-content')
                    .text()
                    .trim())
                .toBe('Dog Guts');

            // no close button
            expect(directiveElement.find('.rv-header > md-button')
                    .length)
                .toBe(0);

            // there should be only two children in the header
            expect(directiveElement.find('.rv-header')
                    .children()
                    .length)
                .toBe(2);
        });
    });
});

describe('rvContentPane1', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.panels', 'app.templates', 'pascalprecht.translate');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // crete new scope
        scope = $rootScope.$new();
        scope.close = () => {};

        directiveElement = angular.element(
            `
                <rv-content-pane title-style="title" title-value="Test pane directive" close-panel="close()">
                    <div>Dog Guts</div>
                </rv-content-pane>
            `
        );

        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();

        // spy on visibility toggle method
        spyOn(scope, 'close');
    });

    describe('rvContentPane', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            directiveScope.self.closePanel();

            // check if the close panel function is called
            expect(scope.close)
                .toHaveBeenCalled();
        });
    });
});

describe('rvContentPane2', () => {
    let scope;
    let directiveScope; // needed since directive requests an isolated scope
    let directiveElement;

    // mock part of the controller required by rvLayerGroupToggleButton directive
    const fakeController = {
        closePanel: () => {}
    };

    beforeEach(() => {
        // mock the module with bardjs; include templates modules
        bard.appModule('app.ui.panels', 'app.templates', 'pascalprecht.translate');

        // inject angular services
        bard.inject('$compile', '$rootScope');

        // need to create a spy before directive is created, otherwise it will pull in the reference to the function before the spy is created
        spyOn(fakeController, 'closePanel');

        // crete new scope
        scope = $rootScope.$new();

        directiveElement = angular.element(
            `
                <rv-content-pane title-style="title" title-value="Test pane directive" header-controls="md-button">
                    <div>Dog Guts</div>
                </rv-content-pane>
            `
        );

        directiveElement.data('$rvPanelController',
            fakeController);
        directiveElement = $compile(directiveElement)(scope);
        scope.$digest();

        // get isolated scope from the directive created;
        // http://stackoverflow.com/a/20312653
        directiveScope = directiveElement.isolateScope();
    });

    describe('rvContentPane', () => {
        it('should be created successfully', () => {
            // check that directive element exists
            expect(directiveElement)
                .toBeDefined();

            directiveScope.self.closePanel();

            // check if the close panel function is called on the fakeController
            expect(fakeController.closePanel)
                .toHaveBeenCalled();

            // there should be four children in the header: title, spacer, close button, and extra header md-button
            expect(directiveElement.find('.rv-header')
                    .children()
                    .length)
                .toBe(4);
        });
    });
});
