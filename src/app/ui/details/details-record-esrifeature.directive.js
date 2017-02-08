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

    function rvDetailsRecordEsrifeature($compile, $filter, geoService, Geo) {
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
                let entry = self.requester.layerRec.legendEntry;

                // for dynamic layer we need to find the right layer entry inside the service to link to the proper layer
                // we need this espcially for scale dependant layer for the "zoom to" to go to the proper zoom level for the
                // selected layer
                if (entry.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    const index = entry.layerEntries.findIndex(item => item.index === self.requester.featureIdx);
                    entry = entry.items[index];
                }

                geoService.zoomToGraphic(self.requester.layerRec, entry,
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
                    const excludedColumns = ['rvSymbol', 'rvInteractive'];

                    // there should be no spaces between the row values and surrounding div tags, they mess up layout
                    const detailsHTMLTemplate =
                        `<ul class="ng-hide rv-details-list rv-toggle-slide"
                            ng-show="self.item.isExpanded">

                            <li ng-repeat="row in self.item.filteredData" ng-switch on="row.type">
                                <div class="rv-details-attrib-key">{{ ::row.key }}</div>
                                <span flex></span>

                                <div class="rv-details-attrib-value"
                                    ng-switch-when="esriFieldTypeDate"
                                    ng-bind-html="::row.value | dateTimeZone"></div>
                                <div class="rv-details-attrib-value"
                                    ng-switch-default ng-bind-html="::row.value | autolink"></div>
                            </li>
                        </ul>`;

                    self.item.filteredData =
                        self.item.data.filter(column =>
                            excludedColumns.indexOf(column.key) === -1);

                    const details = $compile(detailsHTMLTemplate)(scope); // compile with the local scope to set proper bindings
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
            // needs to walk the items because it can be in a sub folder
            self.requester.layerRec.legendEntry.walkItems(le => {
                if (le.featureIdx === self.requester.featureIdx) {
                    self.directLegendEntry = self.requester.layerRec.legendEntry;
                }
            });
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
