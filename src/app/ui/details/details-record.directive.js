(() => {
    'use strict';

    const detailsGenerators = {
        EsriFeature: item => {
            const LIST = listItems => `<ul class="rv-details-zebra-list rv-list rv-toggle-slide" ng-if="self.isExpanded">${listItems}</ul>`;
            const LIST_ITEM = (key, value) =>
                `<li>
                    <div class="rv-details-attrib-key">${key}</div>
                    <div class="rv-details-attrib-value">${value}</div>
                </li>`;

            return LIST(
                item.data.map(row => LIST_ITEM(row.key, row.value)).join('')
            );
        }
    };

    /**
     * @ngdoc directive
     * @name rvDetailsRecord
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetailsRecord` directive description.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsRecord', rvDetailsRecord);

    function rvDetailsRecord($compile) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record.html',
            scope: {
                item: '=item'
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        ///////////

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            self.toggleDetails = toggleDetails;
            self.isExpanded = false;

            let isCompiled = false;

            function toggleDetails() {
                if (!isCompiled) {
                    const details = $compile(detailsGenerators['EsriFeature'](self.item))(scope);
                    el.append(details);
                    isCompiled = true;
                }

                self.isExpanded = !self.isExpanded;
            }
        }
    }

    function Controller() {
        const self = this;
        self.expand = false;

        activate();

        ///////////

        function activate() {

        }
    }
})();
