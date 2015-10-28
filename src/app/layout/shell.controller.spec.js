 /* global bard, $controller, $rootScope */

describe('ShellController', () => {
    let controller;

    // mock custom loader module
    function customTranslateLoader($provide, $translateProvider) {
        // for customLoader use a function returning a self-fulfilling promise to mock the service
        $provide.factory('customLoader', $q => () => $q(fulfill => fulfill()));

        $translateProvider.useLoader('customLoader');
    }

    beforeEach(() => {
        /*
            cannot use bard.appModule with routes: https://github.com/wardbell/bardjs#dont-use-appmodule-when-testing-routes
            so instead of using `bard.appModule('app.layout', customTranslateLoader);` we have to use regular mock functions

            Here we also define a customTranslateLoader module initialization function which creates a fake customloader for translation service.
         */

        angular.mock.module(
            'app.layout',
            'app.ui',
            customTranslateLoader);

        // inject angular services
        bard.inject('$controller', '$rootScope');

        // create controler and store it
        controller = $controller('ShellController');
        $rootScope.$apply();
    });

    describe('Shell controller', () => {
        // check that controller is created
        it('should be created successfully', () => {
            expect(controller)
                .toBeDefined();
        });
    });
});
