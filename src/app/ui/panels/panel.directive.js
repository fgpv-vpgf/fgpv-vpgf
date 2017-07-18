const templateUrls = {
    table: require('./table-panel.html'),
    main: require('./main-panel.html'),
    other: require('./other-panel.html'),
    side: require('./side-panel.html')
};

/**
 *
 * @module rvTablePanel
 * @memberof app.ui
 * @description
 *
 * The `rvPanel` directive is reused by all the core panels of the viewer; main, side and table.
 *
 * HTML example:
 * <rv-panel type="main" close-button="false"></rv-panel>
 */
angular
    .module('app.ui')
    .directive('rvPanel', rvPanel);

function rvPanel(layoutService) {
    const directive = {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return templateUrls[attr.type];
        },
        scope: {
            closeButton: '@closeButton'
        },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true,
        link
    };

    return directive;

    /**
     * Directive's link function. Stores the panel element in the storage for other code to access.
     *
     * @function link
     * @private
     * @param {Object} scope directive's scope
     * @param {Object} element directive's node
     * @param {Array} attr directive's attributes
     */
    function link(scope, element, attr) {
        layoutService.panels[attr.type] = element;
    }
}

/**
 * Skeleton controller function.
 * @function Controller
 */
function Controller($attrs, stateManager, layoutService, $element, debounceService) {
    'ngInject';
    const self = this;

    layoutService.panels[$attrs.type] = $element;

    self.closePanel = self.closeButton !== 'false' ? closePanel() : undefined;

    /**
     * Temporary function to close the panel.
     * @function closePanel
     * @return {function} a function that debounces when closing panel was invoked more than once
     */
    function closePanel() {
        return debounceService.registerDebounce(() => {
            stateManager.setActive($attrs.type);
        });
    }
}
