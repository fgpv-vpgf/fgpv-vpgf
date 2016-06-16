(() => {
    'use strict';

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
                item: '=item',
                requester: '=requester'
            },
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /***/

        function link(scope, el, attr, ctrl) {
            const self = scope.self;

            self.item.isExpanded = false;
            self.item.isSelected = false;

            // TODO: fix
            self.requester.symbology = [self.requester.symbology[0]];

            self.renderDetails = renderDetails;
            self.isExpanded = false;

            let isCompiled = false;

            function renderDetails() {
                if (!isCompiled) {
                    const LIST = listItems =>
                        `<ul class="ng-hide rv-details-list rv-toggle-slide"
                            ng-show="self.item.isExpanded">
                            ${listItems}
                        </ul>`;

                    const LIST_ITEM = (key, value) =>
                        `<li>
                            <div class="rv-details-attrib-key">${key}</div>
                            <div class="rv-details-attrib-value">${value}</div>
                        </li>`;

                    const detailsHhtml = LIST(
                        self.item.data.map(row => LIST_ITEM(row.key, row.value)).join('')
                    );

                    const details = $compile(detailsHhtml)(scope);
                    el.after(details);
                    isCompiled = true;
                }
            }
        }
    }

    function Controller() {
        const self = this;

        self.toggleDetails = toggleDetails;
        self.zoomToFeature = zoomToFeature;

        /***/

        function toggleDetails() {
            self.item.isExpanded = !self.item.isExpanded;
            self.item.isSelected = self.item.isExpanded;
        }

        function zoomToFeature() {
            throw new Error('Zoom, zoom!');
        }
    }
})();
