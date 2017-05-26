const templateUrl = require('./templates/legend-flag.html');

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
 * <!-- `type` attribute specifies the template to be used for the control; it defaults to `entry-button.html`; another option is `entry-control-menu-item.html` -->
 * <rv-toc-entry-control option="metadata" type="menu-item"></rv-toc-entry-control>
 * ```
 *
 * If the `persist` attribute is set, the directive will be displayed empty if the corresponding control object is undefined.
 *
 */
angular
    .module('app.ui')
    .directive('rvLegendFlag', rvLegendFlag);

function rvLegendFlag(LegendElementFactory) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            block: '=',
            name: '@'
        },
        link: {
            pre: link
        },
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /***/

    function link(scope, el) {
        const self = scope.self;

        self.uiControl = LegendElementFactory.makeFlag(self.block, self.name);


    }
}
