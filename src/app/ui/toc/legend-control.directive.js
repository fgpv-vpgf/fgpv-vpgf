const templateUrl = {
    body: require('./templates/legend-control-body.html'),
    button: require('./templates/legend-control-button.html'),
    link: require('./templates/legend-control-link.html'),
    menu: require('./templates/legend-control-menu.html'),
    slider: require('./templates/legend-control-slider.html'),
    switch: require('./templates/legend-control-switch.html'),
    input: require('./templates/legend-control-input.html'),
    select: require('./templates/legend-control-select.html'),
    'toggle-button': require('./templates/legend-control-toggle-button.html')
};

/**
 * @module rvTocEntryControl
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTocEntryControl` directive is one of the layer toggle buttons: visiblity, settings, metadata, etc.
 *
 * ```html
 * <!-- `option` attribute specifies the name of the toggle; toggle's control object and its template are fetched from the layerItem directive -->
 * <rv-toc-entry-control option="settings"></toc-entry-control>
 *
 * <!-- `template` attribute specifies the template to be used for the control; it defaults to `entry-button.html`; another option is `entry-control-menu-item.html` -->
 * <rv-toc-entry-control option="metadata" template="menu-item"></rv-toc-entry-control>
 * ```
 *
 * If the `persist` attribute is set, the directive will be displayed empty if the corresponding control object is undefined.
 *
 */
angular
    .module('app.ui')
    .directive('rvLegendControl', rvLegendControl);

function rvLegendControl(LegendElementFactory, Geo, LegendBlock, appInfo) {
    const directive = {
        restrict: 'E',
        // returns a different templateUrl based on the value of the templateUrl attribute
        templateUrl: (elm, attr) => templateUrl[attr.template || 'button'],
        scope: {
            block: '=',
            valueParentBlock: '=',
            name: '@'
        },
        link: {
            pre: link
        },
        controller: () => { },
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /***/

    function link(scope, el, attr) {
        const self = scope.self;

        self.uiControl = LegendElementFactory.makeControl(self.block, self.name);

        self.Math = window.Math;
        self.notifyApiClick = notifyApiClick;

        // if the control is undefined, selfdestruct
        if (!self.uiControl.isVisible && attr.persist !== 'true') {
            el.remove();
            scope.$destroy();
        }

        /**
         * Triggers the API layer group observable when a layer is clicked on the legend
         *
         * @function notifyApiClick
         * @private
         * @param {LegendBlock} block legend block that was clicked
         */
        function notifyApiClick(block) {
            let legendItem;
            if (appInfo.mapi) {  // make sure the item clicked is a node, and not group or other
                legendItem = appInfo.mapi.ui.configLegend.getById(block.id);
                if (legendItem) {
                    appInfo.mapi.ui.configLegend._click.next(legendItem);
                }
            }

            let layer;
            if (appInfo.mapi && block.blockType === LegendBlock.TYPES.NODE) {  // make sure the item clicked is a node, and not group or other
                if (block.parentLayerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                    layer = appInfo.mapi.layers.allLayers.find(l =>
                        l.id === block.layerRecordId &&
                        l.layerIndex === parseInt(block.itemIndex));
                } else {
                    layer = appInfo.mapi.layers.getLayersById(block.layerRecordId)[0];
                }
                if (layer) {
                    appInfo.mapi.layers._click.next(layer);
                }
            }
        }
    }
}
