(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvMetadataContent
     * @module app.ui.metadata
     * @restrict E
     * @description
     *
     * The `rvMetadataContent` directive renders the data content of metadata.
     *
     */
    angular
        .module('app.ui.metadata')
        .directive('rvMetadataContent', rvMetadataContent);

    /**
     * `rvMetadataContent` directive body.
     *
     * @return {object} directive body
     */
    function rvMetadataContent($compile) {
        const directive = {
            restrict: 'E',
            scope: {
                maxTextLength: '@'
            },
            link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el, attr) {
            /***
             * Append document fragment 'metadata' from stateManager. Shorten long runs of text
             * with a show/hide toggle iff maxTextLength attribute property is greater than 0.
             *
             * maxTextLength applies to the content of each p element in the fragment, not the
             * length of the entire fragment itself.
             */
            const textArr = []; // store object for each p element
            scope.$watch('self.display.data', metadata => {
                if (metadata) {
                    el.append(angular.copy(metadata)); // copy fragment so that it is inserted for both panels and modals
                    el.find('h5').addClass('md-title').css('margin', '0');
                }

                attr.$observe('maxTextLength', function (maxTextLength) {
                    maxTextLength = maxTextLength > 0 ? parseInt(maxTextLength) : 0;

                    if (maxTextLength > 0) {
                        angular.forEach(el.find('p'), (pElem, index) => {

                            pElem = angular.element(pElem);
                            const longText = pElem.html();

                            // do not count HTML tags, more than one successive whitespace, or newlines towards the maxTextLength
                            const correctedLength = longText.replace(/<[^>]+>/gm, '').replace(/ +(?= )/g, '').replace(/(\r\n|\n|\r)/gm, '').length;
                            let shortText = longText.substr(0, maxTextLength + (longText.length - correctedLength));

                            // do not cut off words, instead shorten to nearest word
                            shortText = shortText.substr(0, Math.min(shortText.length, shortText.lastIndexOf(' ')));

                            textArr.push({ pElem, shortText, longText });

                            if (correctedLength > maxTextLength) {
                                textArr[index].shortText +=
                                    `... <br><a href="#" ng-click="show(${index})">Show More</a>`;
                                textArr[index].longText +=
                                    ` <br><a href="#" ng-click="hide(${index})">Hide</a>`;
                            }

                            pElem.html(textArr[index].shortText);
                            $compile(pElem)(scope);
                        });

                        scope.show = index => {
                            textArr[index].pElem.html(textArr[index].longText);
                            $compile(textArr[index].pElem)(scope);
                        };

                        scope.hide = index => {
                            textArr[index].pElem.html(textArr[index].shortText);
                            $compile(textArr[index].pElem)(scope);
                        };
                    }
                });
            });
        }
    }

    function Controller($scope, stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.metadata;
    }
})();
