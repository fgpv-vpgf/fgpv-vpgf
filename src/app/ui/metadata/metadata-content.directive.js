(() => {
    'use strict';

    /**
     * @module rvMetadataContent
     * @memberof app.ui
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
     * @function rvMetadataContent
     * @return {object} directive body
     */
    function rvMetadataContent($compile, $translate) {
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
            // Append document fragment 'metadata' from stateManager. Shorten long runs of text
            // with rv-truncate directive.
            const maxTextLength = attr.maxTextLength > 0 ? attr.maxTextLength : 0;
            scope.$watch('self.display.data', metadataPackage => {
                // abort if there is no document fragment
                if (!metadataPackage) {
                    return;
                }

                const metadataElem = angular.element(angular.copy(metadataPackage.metadata));
                angular.forEach(metadataElem.find('p'), pElem => {
                    pElem = angular.element(pElem);
                    pElem.html($compile(
                        `<rv-truncate max-text-length="${maxTextLength}">${pElem.html()}</rv-truncate>`)(scope));
                });

                // insert any extra content into styled div (in doc-fragment)
                const amendDiv = metadataElem.find('div').first();
                if (metadataPackage.catalogueUrl || metadataPackage.metadataUrl) {
                    amendDiv.append(`<h5 class="md-title">${$translate.instant('metadata.xslt.metadata')}</h5>`);
                }

                // jscs:disable maximumLineLength
                if (metadataPackage.catalogueUrl) {
                    amendDiv.append(`<p><a href="${metadataPackage.catalogueUrl}" target="_blank">${$translate.instant('metadata.xslt.cataloguePage')}</a></p>`);
                }

                if (metadataPackage.metadataUrl) {
                    amendDiv.append(`<p><a href="${metadataPackage.metadataUrl}" target="_blank">${$translate.instant('metadata.xslt.metadataPage')}</a> (xml)</p>`);
                }
                // jscs:enable maximumLineLength

                el.empty();
                el.append(metadataElem);

            });
        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.metadata;
    }
})();
