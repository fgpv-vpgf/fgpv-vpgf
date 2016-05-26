(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDetailsData
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetailsData` directive handles the creation of the details data.
     * To improve efficency a document fragment is first created prior to
     * DOM insertion.
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsData', rvDetailsData);

    function rvDetailsData() {
        const directive = {
            restrict: 'E',
            scope: {
                data: '='
            },
            link: link
        };

        return directive;

        function link(scope, element) {
            scope.$watch('data', data => {
                if (data) {
                    element.empty(); // clear existing data elements
                    const frag = angular.element(document.createDocumentFragment());

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
                    element.append(frag);
                }
            });
        }
    }
})();
