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
        // cannot use bard.appModule with routes: https://github.com/wardbell/bardjs#dont-use-appmodule-when-testing-routes
        //bard.appModule('app.layout', customTranslateLoader);
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

    bard.verifyNoOutstandingHttpRequests();

    describe('Shell controller', () => {
        // check that controller is created
        it('should be created successfully', () => {
            expect(controller)
                .toBeDefined();
        });
    });
});
