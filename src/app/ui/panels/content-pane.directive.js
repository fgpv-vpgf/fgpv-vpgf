/* global TweenLite */

const templateUrl = require('./content-pane.html');

const HEADER_CLASS = '.rv-header';
const FLOATING_HEADER_CLASS = '.rv-header-float';
const FOOTER_CLASS = '.rv-footer';
const SPACER_CLASS = '.rv-spacer';
/**
 * @module rvContentPane
 * @memberof app.ui
 * @description
 *
 * The `rvContentPane` directive is a panel inner container holding the panel's content.
 *
 * `title-value` a string to be displayed in the pane's header; if ommited, the header is not shown
 * `title-style` sets the style of the pane's title; options: "headline", "title", "subhead"
 * `sub-title-value` a string to be displayed in the pane's header; if ommited, not shown; if the `title-value` is ommited, not shown;
 * `is-loading` a flag to show/hide the loading indicator
 * `hide-when-loading` if true, hides the content of the pane when the loading indicator is active
 * `header-controls` a list of directive names separated by ';' to be inserted into the header (extra controls like a menu for example)
 * `header-controls-scope` a scope to be passed to the header controls directives; if not supplied, the current scope of the panel is used
 * [deprecated] `floating-header` no explicit header is shown; close button sticks to the upper right corner of the scrollable content
 * `footer` directive name to insert into the footer
 * `close-panel` a custom "close" function to call when the pane is closed
 * `static-content` makes main content section non-scrollable
 *
 * Usage example:
 * ```html
 * <rv-content-pane
 *         title-value="Panel"
 *         title-style="title"
 *         sub-title-value="sub title"
 *         is-loading="true"
 *         hide-when-loading="true"
 *         header-controls="table-default-menu"
 *         header-controls-scope=""
 *         floating-header="true"
 *         footer=""
 *         close-panel=""
 *         static-content="false">
 *
 * </rv-content-pane>
 * ```
 */
angular
    .module('app.ui')
    .directive('rvContentPane', rvContentPane);

function rvContentPane($compile) {
    const directive = {
        restrict: 'E',
        require: '?^rvPanel', // require plug controller
        templateUrl,
        scope: {
            titleValue: '@?', // binds to the evaluated dom property
            titleStyle: '@?',
            subTitleValue: '@?',
            isLoading: '=?', // bind to a property
            hideWhenLoading: '=?',
            headerControls: '@?',
            headerControlsScope: '=?',
            floatingHeader: '=?',
            footer: '@?',
            closeButton: '=?',
            closePanel: '&?', // https://docs.angularjs.org/api/ng/service/$compile
            staticContent: '=?'
        },
        transclude: true,
        link: link,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /**
     * Sets defaults; binds the `closePanel` method from the panel plug controller; compiles footer and extra header controls.
     * @function link
     */
    function link(scope, element, attr, ctrl) {
        const self = scope.self;

        // apply defaults
        self.isLoading = angular.isDefined(self.isLoading) ? self.isLoading : false;
        self.hideWhenLoading = angular.isDefined(self.hideWhenLoading) ? self.hideWhenLoading : true;
        self.staticContent = angular.isDefined(self.staticContent) ? self.staticContent : false;
        self.floatingHeader = angular.isDefined(self.floatingHeader) ? self.floatingHeader : false;

        self.closeButton = self.closeButton !== false;

        // first, try to used passed closePanel function; if not, use one on the parent panel controller, or nothing
        if (!self.closePanel && ctrl) {
            self.closePanel = ctrl.closePanel || undefined;
        }

        initHeaderControls();
        initFloatingHeader();
        initFooter();

        function initHeaderControls() {
            // add header controls
            addHeaderControl(element, HEADER_CLASS);
        }

        function initFloatingHeader() {
            if (self.floatingHeader) {
                const floatingHeader = element.find(FLOATING_HEADER_CLASS);

                // add header controls
                addHeaderControl(element, FLOATING_HEADER_CLASS);

                scope.$on('rv-detect-scrollbar', (evt, newValue, oldValue, scrollbarWidth) => {
                    TweenLite.set(floatingHeader, {
                        x: newValue ? -scrollbarWidth : 0
                    });
                });
            }
        }

        /**
        * Add controls to panel header
        * @private
        * @function addHeaderControl
        * @param {Object} element panel header to add control to
        * @param {String} headerClass class use to find the element where to add the controls
        */
        function addHeaderControl(element, headerClass) {
            // `self.headerControls` is a string of directive names separated by ';' to be inserted in the content pane's header
            if (self.headerControls) {
                const headerSpacer = element.find(`${headerClass} ${SPACER_CLASS}`);

                self.headerControls.split(';')
                    .forEach(controlName => {
                        const controlElement =
                            $compile(`<${controlName}></${controlName}>`)(self.headerControlsScope || scope);
                        headerSpacer.after(controlElement);
                    });
            }
        }

        function initFooter() {
            // `self.footer` is a name string of a directive; if specified, directive is compiled and inserted into the pane template
            if (self.footer) {
                const footer = element.find(FOOTER_CLASS);

                const footerElement = $compile(`<${self.footer}></${self.footer}>`)(scope);
                footer.append(footerElement);
            }
        }
    }
}