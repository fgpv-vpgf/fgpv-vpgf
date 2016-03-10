(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @restrict A
     * @name rvInitMap
     * @module app.geo
     * @description
     *
     * The `rvInitMap` directive creates an ESRI Map object on the DOM node it is attached to.  It is a string attribute which
     * will trigger the initialzation when set to 'true'.
     */
    angular
        .module('app.geo')
        .directive('rvInitMap', rvInitMap);

    function rvInitMap(geoService) {

        const directive = {
            restrict: 'A',
            link: linkFunc
        };
        return directive;

        function linkFunc(scope, el) {

            geoService.registerMapNode(el[0]);
        }
    }

})();
