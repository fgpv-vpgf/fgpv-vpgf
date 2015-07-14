(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('Shell', ['$scope', function ($scope) {
            $scope.title = "Button title";

            console.log($scope);
        }]);

})();