(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('ShellController', ShellController);

    ShellController.$inject = [];
    
    function ShellController() {
        var vm = this;

        vm.title = "Button title";
    }

})();