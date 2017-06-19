const templateUrls = {
    filters: require('./filters-panel.html'),
    main: require('./main-panel.html'),
    other: require('./other-panel.html'),
    side: require('./side-panel.html')
};

/**
 *
 * @module rvFiltersPanel
 * @memberof app.ui
 * @description
 *
 * The `rvPanel` directive is reused by all the core panels of the viewer; main, side and filters.
 *
 * HTML example:
 * <rv-panel type="main" close-button="false"></rv-panel>
 */
angular
    .module('app.ui')
    .directive('rvPanel', rvPanel);

function rvPanel(storageService) {
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
        storageService.panels[attr.type] = element;
    }
}

/**
 * Skeleton controller function.
 * @function Controller
 */
function Controller($attrs, stateManager, storageService, $element) {
    'ngInject';
    const self = this;

    storageService.panels[$attrs.type] = $element;

    self.closePanel = self.closeButton !== 'false' ? closePanel : undefined;

    /**
     * Temporary function to close the panel.
     * @function closePanel
     * FIXME: this should be handled in the shatehelper
     */
    function closePanel() {
        stateManager.setActive($attrs.type);
    }
}
