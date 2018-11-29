import { Panel } from 'api/ui';

const templateUrls = {
    main: require('./main-panel.html'),
    side: require('./side-panel.html')
};

/**
 *
 * @module rvTablePanel
 * @memberof app.ui
 * @description
 *
 * The `rvPanel` directive is reused by all the core panels of the viewer; main, and side.
 *
 * HTML example:
 * <rv-panel type="main" close-button="false"></rv-panel>
 */
angular
    .module('app.ui')
    .directive('rvPanel', rvPanel);

function rvPanel(referenceService, stateManager, debounceService, events) {
    const directive = {
        restrict: 'E',
        templateUrl: function (element, attr) {
            return templateUrls[attr.type];
        },
        scope: {
            closeButton: '@closeButton'
        },
        controller: angular.noop,
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
    function link(scope, element, attrs) {

        // this.panel = this.mapApi.createPanel('enhancedTable');

        this.panel.panelContents.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: this.maximized ? '0px' : '50%',
            padding: '0px 16px 16px 16px'
        });

        this.panel.content = new this.panel.container(this.tableContent);
        const self = scope.self;
        const pName = attrs.type;

        referenceService.panels[pName] = element;

        self.closePanel = self.closeButton !== 'false' ? closePanel() : undefined;

        events.$on(events.rvApiMapAdded, (_, mapi) => {
            const panelObj = new Panel(pName, element.find('> div').first());
            panelObj.stateObservable.subscribe(open => {
                stateManager.setActive({[pName]: open});
                scope.$applyAsync();
            });

            mapi.ui.panels.add(panelObj);
        });

        /**
         * Temporary function to close the panel.
         * @function closePanel
         * @return {function} a function that debounces when closingPanel was invoked more than once
         */
        function closePanel() {
            return debounceService.registerDebounce(() => {
                stateManager.setActive(pName);
            });
        }
    }
}
