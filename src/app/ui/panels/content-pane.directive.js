/* global TweenLite */
(() => {

    const HEADER_CLASS = '.rv-header';
    const FLOATING_HEADER_CLASS = '.rv-header-float';
    const FOOTER_CLASS = '.rv-footer';
    const SPACER_CLASS = '.rv-spacer';
    /**
     * @ngdoc directive
     * @name rvContentPane
     * @module app.ui.panels
     * @description
     *
     * The `rvContentPane` directive is a panel inner container holding the panel's content.
     *
     * `title-value` a string to be displayed in the pane's header; if ommited, the header is not shown
     * `title-style` sets the style of the pane's title; options: "headline", "title", "subhead"
     * `is-loading` a flag to show/hide the loading indicator
     * `hide-when-loading` if true, hides the content of the pane when the loading indicator is active
     * `header-controls` a list of directive names separated by ';' to be inserted into the header (extra controls like a menu for example)
     * `floating-header` no explicit header is shown; close button sticks to the upper right corner of the scrollable content
     * `footer` directive name to insert into the footer
     * `close-panel` a custom "close" function to call when the pane is closed
     * `static-content` makes main content section non-scrollable
     *
     * Usage example:
     * ```html
     * <rv-content-pane
     *         title-value="Panel"
     *         title-style="title"
     *         is-loading="true"
     *         hide-when-loading="true"
     *         header-controls="filters-default-menu"
     *         floating-header="true"
     *         footer=""
     *         close-panel=""
     *         static-content="false">
     *
     * </rv-content-pane>
     * ```
     */
    angular
        .module('app.ui.panels')
        .directive('rvContentPane', rvContentPane);

    /**
     * `rvContentPane` directive body.
     *
     * @return {object} directive body
     */
    function rvContentPane($compile, $document, stateManager) {
        const directive = {
            restrict: 'E',
            require: '?^rvPanel', // require plug controller
            templateUrl: 'app/ui/panels/content-pane.html',
            scope: {
                titleValue: '@?', // binds to the evaluated dom property
                titleStyle: '@?',
                isLoading: '=?', // bind to a property
                hideWhenLoading: '=?',
                headerControls: '@?',
                floatingHeader: '=?',
                footer: '@?',
                closePanel: '&?', // https://docs.angularjs.org/api/ng/service/$compile
                staticContent: '=?'
            },
            transclude: true,
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Sets defaults; binds the `closePanel` method from the panel plug controller; compiles footer and extra header controls.
         */
        function link(scope, element, attr, ctrl) {
            const self = scope.self;

            // apply defaults
            self.isLoading = angular.isDefined(self.isLoading) ? self.isLoading : false;
            self.hideWhenLoading = angular.isDefined(self.hideWhenLoading) ? self.hideWhenLoading : true;
            self.staticContent = angular.isDefined(self.staticContent) ? self.staticContent : false;
            self.floatingHeader = angular.isDefined(self.floatingHeader) ? self.floatingHeader : false;

            // first, try to used passed closePanel function; if not, use one on the parent panel controller, or nothing
            if (!self.closePanel && ctrl) {
                self.closePanel = ctrl.closePanel || undefined;
            }

            initEscapeListener();
            initHeaderControls();
            initFloatingHeader();
            initFooter();

            function initEscapeListener() {
                // hide all panels when the escape key is pressed.
                $document.bind('keydown', function (event) {
                    if (event.which === 27) {
                        scope.$apply(function () {
                            for (var pName in stateManager.state) {
                                if (stateManager.state.hasOwnProperty(pName)) {
                                    let obj = {};
                                    obj[pName] = false;
                                    stateManager.setActive(obj);
                                }
                            }
                        });
                    }
                });
            }

            function initHeaderControls() {
                // `self.headerControls` is a string of directive names separated by ';' to be inserted in the content pane's header
                // TODO: option to add controls to the floating header?
                if (self.headerControls) {
                    const headerSpacer = element.find(`${HEADER_CLASS} ${SPACER_CLASS}`);

                    self.headerControls.split(';')
                        .forEach(controlName => {
                            let controlElement = $compile(`<${controlName}></${controlName}>`)(scope);
                            headerSpacer.after(controlElement);
                        });
                }
            }

            function initFloatingHeader() {
                if (self.floatingHeader) {
                    const floatingHeader = element.find(FLOATING_HEADER_CLASS);

                    scope.$on('rv-detect-scrollbar', (evt, newValue, oldValue, scrollbarWidth) => {
                        // console.log(evt, oldValue, newValue, scrollbarWidth);
                        TweenLite.set(floatingHeader, {
                            x: newValue ? -scrollbarWidth : 0
                        });
                    });
                }
            }

            function initFooter() {
                // `self.footer` is a name string of a directive; if specified, directive is compiled and inserted into the pane template
                if (self.footer) {
                    const footer = element.find(FOOTER_CLASS);

                    let footerElement = $compile(`<${self.footer}></${self.footer}>`)(scope);
                    footer.append(footerElement);
                }
            }
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {
        // const self = this;

        activate();

        function activate() {

        }
    }
})();
