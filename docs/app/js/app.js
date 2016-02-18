
((angular) => {
    'use strict';

    // NOTE: ngSelect and hljs are only included to support
    // tabs that dynamically load code and highlight syntax
    // see: https://github.com/pc035860/angular-highlightjs#demos
    angular
        .module('app', ['ngRoute', 'ngMaterial'])
        .config(function (PAGES, API, $routeProvider) {
            $routeProvider
            .when('/', {
                templateUrl: './partials/home.tmpl.html'
            })
            .otherwise({
                redirectTo: '/'
            });

            angular.forEach(PAGES, function (pages) {
                angular.forEach(pages, function (page) {
                    $routeProvider
                        .when(page.url, {
                            templateUrl: page.outputPath

                            // uncomment to add controller for the page
                            // , controller: 'SomeController'
                        });
                });
            });

            angular.forEach(API, function (api) {
                $routeProvider
                .when(api.url, {
                    templateUrl: api.outputPath

                    // uncomment to add controller for the page
                    // , controller: 'SomeController'
                });
            });
        })

        .factory('menu', ['PAGES', 'NAV', function (pages, nav) {
            var sections = [];
            var apiDocs = [];
            var self = this;

            // static content route can be add in manually
            var contentDocs = [{
                name: 'HOME',
                url: '/',
                type: 'link'
            }];

            // pages is split up by area, 0 for undefined
            // currently only 1 area.
            pages.content.forEach(function (item) {
                contentDocs.push({
                    name: item.name,
                    url: item.url,
                    type: 'link'
                });
            });

            sections.push({
                name: 'Project Docs',
                type: 'heading',
                children: contentDocs
            });

            // generated from *-data.js
            nav.forEach(function (module) {

                // // build up children docs
                // // sub category 'service', 'function', 'directive'
                var subcategory = [];
                module.submenus.forEach(function (subcat) {

                    // pages
                    var cpages = [];
                    subcat.children.forEach(function (page) {
                        cpages.push({
                            name: page.name,
                            url: page.url,
                            type: 'link'
                        });
                    });

                    subcategory.push({
                        name: subcat.title,
                        type: 'toggle',
                        pages: cpages
                    });

                });

                // module
                apiDocs.push({
                    name: module.name,
                    url: module.url,
                    children: subcategory,
                    type: 'link'
                });
            });

            sections.push({
                name: 'API Reference',
                type: 'heading',
                children: apiDocs
            });

            self = {
                sections: sections
            };

            return self;
        }])
        .controller('ctrlMain', ['$scope', 'menu', function ($scope, menu) {

            $scope.menu = menu;

        }])
        .filter('nospace', function () {
            return function (value) {
                return (!value) ? '' : value.replace(/ /g, '');
            };
        })
        .filter('humanizeDoc', function () {
            return function (doc) {
                if (!doc) {
                    return;
                }

                if (doc.type === 'directive') {
                    return doc.name.replace(/([A-Z])/g, function ($1) {
                        return '-' + $1.toLowerCase();
                    });
                }
                return doc.label || doc.name;
            };
        })
        .directive('menuLink', function () {
            return {
                scope: {
                    section: '='
                },
                templateUrl: 'partials/menu-link.tmpl.html'

                // link: function($scope, $element) {
                // var controller = $element.parent().controller();

                // $scope.isSelected = function() {
                //   return controller.isSelected($scope.section);
                // };

                // $scope.focusSection = function() {
                //   // set flag to be used later when
                //   // $locationChangeSuccess calls openPage()
                //   controller.autoFocusContent = true;
                // };
                // }
            };
        });

})(angular);
