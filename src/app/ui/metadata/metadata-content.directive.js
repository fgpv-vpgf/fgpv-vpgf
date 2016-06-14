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
             * with rv-truncate directive.
             */
            const maxTextLength = attr.maxTextLength > 0 ? attr.maxTextLength : 0;
            scope.$watch('self.display.data', metadata => {
                if (metadata) {
                    metadata = angular.element(angular.copy(metadata));
                    angular.forEach(metadata.find('p'), pElem => {
                        pElem = angular.element(pElem);
                        pElem.html($compile(
                            `<rv-truncate max-text-length="${maxTextLength}">${pElem.html()}</rv-truncate>`)(scope));
                    });
                    el.empty();
                    el.append(metadata);
                }
            });
        }
    }

    function Controller(stateManager) {
        'ngInject';
        const self = this;

        self.display = stateManager.display.metadata;
    }
})();
