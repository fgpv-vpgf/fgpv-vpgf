/* jshint -W117, -W030 */
describe('ShellController', function () {
    'use strict';

    var controller;

    beforeEach(function () {
        bard.appModule('app.layout');
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
