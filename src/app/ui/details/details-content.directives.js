(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDetailsContent
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetailsContent` directive renders the data content of details.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsContent', rvDetailsContent);

    /**
     * `rvDetailsContent` directive body.
     *
     * @return {object} directive body
     */
    function rvDetailsContent($translate) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-content.html',
            scope: {},
            link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el) {
            scope.$watch('self.display.selectedItem', selectItem => {

                if (selectItem) {
                    el.empty(); // clear existing data elements
                    const frag = angular.element(document.createDocumentFragment());

                    // if there is data, process, otherwise show nothing found
                    const data = selectItem.data;
                    if (data.length) {

                        // select in function of data format
                        if (selectItem.requester.format === 'EsriFeature') {
                            // esri feature representation
                            angular.forEach(data, item => {
                                frag.append(`<h5 class="rv-sub-subhead">${item.name}</h5>`);
                                let ul = angular.element('<ul class="rv-details-zebra-list"></ul>');

                                angular.forEach(item.data, keyval => {
                                    let li = angular.element('<li></li>');
                                    li.append(`<div class="rv-details-attrib-key">${keyval.key}</div>`);
                                    li.append(`<div class="rv-details-attrib-value">${keyval.value}</div>`);
                                    ul.append(li);
                                });

                                frag.append(ul);
                            });
                        } else if (selectItem.requester.format === 'Text') {
                            // plain text presentation
                            frag.append(`<pre>${data[0]}</pre>`);
                        } else if (selectItem.requester.format === 'HTML') {
                            // raw HTML presentation
                            frag.append(`<div>${data[0]}</div>`);
                        }
                    } else {
                        frag.append(`<h5>${$translate.instant('details.label.noresult')}</h5>`);
                    }
                    el.append(frag);
                }
            });
        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.details;
    }
})();
