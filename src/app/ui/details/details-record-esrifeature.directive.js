(() => {
    'use strict';

    /**
     * @ngdoc directive
     * @name rvDetailsRecordEsrifeature
     * @module app.ui.details
     * @restrict E
     * @description
     *
     * The `rvDetailsRecordEsrifeature` directive renders a single identify result from an esri feature (and dynamic) layers.
     * This directive is used to delay rendering of identify results. Sometimes there are hundreds of them and users are unlikely to look at most of them. The details record sections are collapsed and nothing beyond the title is added to the dom.
     * Identify results is rendered when the collapsed section header is hovered over or receives focus. This removes the slight delay when compiled html is inseted into the template on section expand.
     *
     */
    angular
        .module('app.ui.details')
        .directive('rvDetailsRecordEsrifeature', rvDetailsRecordEsrifeature);

    function rvDetailsRecordEsrifeature($compile, geoService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/details/details-record-esrifeature.html',
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

        function link(scope, el) {
            const self = scope.self;

            self.item.isExpanded = false;
            self.item.isSelected = false;

            self.renderDetails = renderDetails;
            self.isExpanded = false;

            self.triggerZoom = () => {
                geoService.zoomToGraphic(self.requester.layerRec, self.requester.featureIdx, self.item.oid);
            };

            let isCompiled = false;

            /**
             * Render details as plain html and insert them into the template. Runs only once.
             */
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
                        self.item.data.map(row =>
                            // skip over the symbol column
                            // TODO: see #689
                            row.key !== 'rvSymbol' ? LIST_ITEM(row.key, row.value) : '')
                        .join('')
                    );

                    const details = $compile(detailsHhtml)(scope); // compile with the local scope to set proper bindings
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

        /**
         * Expand/collapse identify record section.
         */
        function toggleDetails() {
            self.item.isExpanded = !self.item.isExpanded;
            self.item.isSelected = self.item.isExpanded;
        }

        /**
         * Zoom to identify result's feature
         * TODO: implement
         */
        function zoomToFeature() {
            self.triggerZoom();
        }
    }
})();
