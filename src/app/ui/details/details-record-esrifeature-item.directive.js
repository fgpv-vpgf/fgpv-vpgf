const templateUrl = require('./details-record-esrifeature-item.html');

/**
 * @module rvDetailsRecordEsrifeatureItem
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvDetailsRecordEsrifeatureItem` directive renders a single identify result from an esri feature (and dynamic) layers.
 * This directive is used to delay rendering of identify results. Sometimes there are hundreds of them and users are unlikely to look at most of them. The details record sections are collapsed and nothing beyond the title is added to the dom.
 * Identify results is rendered when the collapsed section header is hovered over or receives focus. This removes the slight delay when compiled html is inseted into the template on section expand.
 *
 */
angular
    .module('app.ui')
    .directive('rvDetailsRecordEsrifeatureItem', rvDetailsRecordEsrifeatureItem);

function rvDetailsRecordEsrifeatureItem(geoService, Geo, SymbologyStack) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            item: '=',
            requester: '=',
            solorecord: '=',
            toggleHighlight: '=',
            initHighlight: '='
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

        const excludedColumns = ['rvSymbol', 'rvInteractive'];

        self.isExpanded = self.solorecord;
        self.isRendered = self.solorecord;

        self.triggerZoom = triggerZoom;

        // pre-filter the columns used by the datagrid out of the returned data
        self.item.data = self.item.data.filter(column =>
            excludedColumns.indexOf(column.key) === -1);

        // wrap raw symbology item into a symbology stack object
        self.item.symbologyStack = new SymbologyStack({}, self.item.symbology);

        // highlight the feature as soon as it renders
        self.initHighlight(self.item.oid);

        // FIXME: this no longer works
        function triggerZoom() {
            let entry = self.requester.layerRec.legendEntry;

            // for dynamic layer we need to find the right layer entry inside the service to link to the proper layer
            // we need this espcially for scale dependant layer for the "zoom to" to go to the proper zoom level for the
            // selected layer
            if (entry.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                const index = entry.layerEntries.findIndex(item =>
                    item.index === self.requester.featureIdx);
                entry = entry.items[index];
            }

            geoService.zoomToGraphic(self.requester.layerRec, entry,
                self.requester.featureIdx, self.item.oid);
        }
    }
}

function Controller(mapService) {
    'ngInject';
    const self = this;

    self.toggleDetails = toggleDetails;
    self.zoomToFeature = zoomToFeature;

    /**
     * Expand/collapse identify record section.
     * @function toggleDetails
     */
    function toggleDetails() {
        self.isRendered = true;
        self.isExpanded = !self.isExpanded;

        self.toggleHighlight(self.item.oid, self.isExpanded);
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
