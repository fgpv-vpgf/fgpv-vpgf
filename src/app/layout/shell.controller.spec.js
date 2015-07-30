/* jshint -W117, -W030 */
describe('ShellController', function () {
    'use strict';

    var controller;

    function customTranslateLoader($provide, $translateProvider) {

        $provide.factory('customLoader', function ($q) {
            return function () {
                var deferred = $q.defer();
                deferred.resolve({});
                return deferred.promise;
            };
        });

        $translateProvider.useLoader('customLoader');
    }

    beforeEach(function () {
        bard.appModule('app.layout', customTranslateLoader);

        bard.inject('$controller', '$rootScope');
    });

    beforeEach(function () {
        controller = $controller('ShellController');
        $rootScope.$apply();
    });

    bard.verifyNoOutstandingHttpRequests();

    describe('Shell controller', function () {
        it('should be created successfully', function () {
            expect(controller).toBeDefined();
        });
    });
});
