
(function(angular) {
    'use strict';
    // NOTE: ngSelect and hljs are only included to support
    // tabs that dynamically load code and highlight syntax
    // see: https://github.com/pc035860/angular-highlightjs#demos
    angular
        .module('app', ['ngRoute', 'ngMaterial'])
        .config(function(PAGES, API, $routeProvider) {
            $routeProvider
            .when('/', {
                templateUrl: './partials/home.tmpl.html'
                // controller: 'ExamplesCtrl'
            })
            // manually added for testing purpose
            // .when('/api/esriLoader', {
            //     templateUrl: './partials/modules/esri/maps/services/esriLoader/index.html'
            // })
            .otherwise({
                redirectTo: '/'
            });


            angular.forEach(PAGES, function(pages, area) {
                angular.forEach(pages, function(page) {
                    $routeProvider
                        .when(page.url, {
                            templateUrl: page.outputPath
                            // uncomment to add controller for the page
                            // , controller: 'SomeController'
                        });
                });
            });

            angular.forEach(API, function(api) {
                $routeProvider
                .when(api.url, {
                    templateUrl: api.outputPath
                    // uncomment to add controller for the page
                    // , controller: 'SomeController'
                });
            });
        })

        .factory('menu', ['PAGES','API', '$location', '$rootScope', '$http', '$window', function(pages, api, $location, $rootScope, $http, $window) {
            
            // can be add in manually
            var sections = [{
                name: 'Project Docs',
                type: 'heading',
                children: [{
                    name: 'Home',
                    url: '/',
                    type: 'link'
                },
                {
                    name: 'Getting Started',
                    url: '/getting_started',
                    type: 'link'
                }]
            }];

            // generated from *-data.js
            var apiDocs = [];
            api.forEach(function(item) {
                apiDocs.push({
                    name: item.name,
                    url: item.url,
                    type: 'link'
                });
            });

            sections.push({
                name: 'API Reference',
                type: 'heading',
                children: apiDocs
            });


            return self = {
                sections: sections
            };
        }])
        .controller('ctrlMain', ['$scope', 'menu', function($scope, menu){
            var self = this;
            $scope.menu = menu;

        }])
        .filter('nospace', function () {
          return function (value) {
            return (!value) ? '' : value.replace(/ /g, '');
          };
        })
        .filter('humanizeDoc', function() {
          return function(doc) {
            if (!doc) return;
            if (doc.type === 'directive') {
              return doc.name.replace(/([A-Z])/g, function($1) {
                return '-'+$1.toLowerCase();
              });
            }
            return doc.label || doc.name;
          };
        })
        .directive('menuLink', function() {
          return {
            scope: {
              section: '='
            },
            templateUrl: 'partials/menu-link.tmpl.html',
            link: function($scope, $element) {
              // var controller = $element.parent().controller();

              // $scope.isSelected = function() {
              //   return controller.isSelected($scope.section);
              // };

              // $scope.focusSection = function() {
              //   // set flag to be used later when
              //   // $locationChangeSuccess calls openPage()
              //   controller.autoFocusContent = true;
              // };
            }
          };
});

})(angular);
