(() => {
    'use strict';

    /**
     * @module rvDetailsRecordEsrifeature
     * @memberof app.ui
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
                requester: '=requester',
                solorecord: '='
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

            let isCompiled = false;
            self.item.isExpanded = typeof self.item.isExpanded === 'undefined' ? false : self.item.isExpanded;
            self.item.isSelected = self.item.isExpanded;
            self.renderDetails = renderDetails;

            self.triggerZoom = () => {
                geoService.zoomToGraphic(self.requester.layerRec, self.requester.layerRec.legendEntry,
                    self.requester.featureIdx, self.item.oid);
            };

            if (self.item.isExpanded) {
                self.renderDetails();
            }

            // expand solo record
            if (self.solorecord) {
                self.renderDetails();
                self.item.isExpanded = true;
                self.item.isSelected = true;
            }

            /**
             * Render details as plain html and insert them into the template. Runs only once.
             * @function renderDetails
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

        // check if items exist. it does not exist on single legend item
        if (self.requester.layerRec.legendEntry.items) {
            // get legend entry from the requester to watch modification on visiblity for sublayer
            self.directLegendEntry = self.requester.layerRec.legendEntry.items.find(le =>
                le.featureIdx === self.requester.featureIdx);
        } else {
            // get legend entry from layer record
            self.directLegendEntry = self.requester.layerRec.legendEntry;
        }

        /**
         * Expand/collapse identify record section.
         * @function toggleDetails
         */
        function toggleDetails() {
            self.item.isExpanded = !self.item.isExpanded;
            self.item.isSelected = self.item.isExpanded;
        }

        /**
         * Zoom to identify result's feature
         * TODO: implement
         * @function zoomToFeature
         */
        function zoomToFeature() {
            self.triggerZoom();
        }
    }
})();
