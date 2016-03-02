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

    function rvInitMap(geoService, configService) {

        const directive = {
            restrict: 'A',
            link: linkFunc
        };
        return directive;

        function linkFunc(scope, el, attr) {

            scope.$watch(attr.rvInitMap, val => {
                if (val === true) {
                    console.log('Switched to true');
                    console.log(el);

                    // there should only be one instance of the directive as the application bootstrap takes care
                    // of handling multiple instances at that level
                    configService.getCurrent().then(config => {
                        geoService.buildMap(el[0], config);
                    });
                }
            });
        }
    }

})();
