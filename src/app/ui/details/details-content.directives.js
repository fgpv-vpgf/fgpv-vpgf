(() => {
    'use strict';

    const CONTENT_CLASS = '.rv-subcontent';

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
            restrict: 'A',
            templateUrl: 'app/ui/details/details-content.html',
            scope: {
                item: '=rvItem',
                isHidden: '=?rvIsHidden'
            },
            link,
            controller: () => {},
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el) {
            const contentContainer = el.find(CONTENT_CLASS);

            scope.$watchCollection('self.item', item => {

                if (item) {
                    contentContainer.empty(); // clear existing data elements
                    const frag = angular.element(document.createDocumentFragment());

                    // if there is data, process, otherwise show nothing found
                    const data = item.data;
                    if (data.length) {

                        // select in function of data format
                        if (item.requester.format === 'EsriFeature') {
                            // esri feature representation
                            angular.forEach(data, item => {
                                frag.append(`<h5 class="rv-sub-subhead">${item.name}</h5>`);
                                let ul = angular.element('<ul class="rv-details-zebra-list"></ul>');

                                angular.forEach(item.data, keyval => {
                                    // skip over the symbol column
                                    // TODO: see #689
                                    if (keyval.key !== 'rvSymbol') {
                                        let li = angular.element('<li></li>');
                                        li.append(`<div class="rv-details-attrib-key">${keyval.key}</div>`);
                                        li.append(`<div class="rv-details-attrib-value">${keyval.value}</div>`);
                                        ul.append(li);
                                    }
                                });

                                frag.append(ul);
                            });
                        } else if (item.requester.format === 'Text') {
                            // plain text presentation
                            frag.append(`<pre>${data[0]}</pre>`);
                        } else if (item.requester.format === 'HTML') {
                            // raw HTML presentation
                            frag.append(`<div>${data[0]}</div>`);
                        }
                    } else {
                        frag.append(`<h5>${$translate.instant('details.label.noresult')}</h5>`);
                    }
                    contentContainer.append(frag);
                }
            });
        }
    }
})();
