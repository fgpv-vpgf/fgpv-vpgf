(() => {

    const HEADER_CLASS = '.rv-header';
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
     */
    angular
        .module('app.ui.panels')
        .directive('rvContentPane', rvContentPane);

    /**
     * `rvContentPane` directive body.
     *
     * @return {object} directive body
     */
    function rvContentPane($compile) {
        const directive = {
            restrict: 'E',
            require: '?^rvPanel', // require plug controller
            templateUrl: 'app/ui/panels/content-pane.html',
            scope: {
                titleValue: '@', // binds to the evaluated dom property
                titleStyle: '@',
                isLoading: '=', // bind to a property
                headerControls: '@', // a list of directive names separated by ';' to be inserted into the header (extra controls for example)
                footer: '@', // directive name to insert into the footer
                closePanel: '&?', // https://docs.angularjs.org/api/ng/service/$compile
                staticContent: '=' // makes main content section non-scrollable
            },
            transclude: true,
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        /**
         * Binds the `closePanel` method from the panel plug controller.
         */
        function link(scope, element, attr, ctrl) {
            const self = scope.self;

            const headerSpacer = element.find(`${HEADER_CLASS} ${SPACER_CLASS}`);
            const footer = element.find(FOOTER_CLASS);

            // first, try to used passed closePanel function; if not, use one on the parent panel controller, or nothing
            if (!self.closePanel && ctrl) {
                self.closePanel = ctrl.closePanel || undefined;
            }

            // `self.headerControls` is a string of directive names separated by ';' to be inserted in the content pane's header
            if (self.headerControls) {
                self.headerControls.split(';')
                    .forEach(controlName => {
                        let controlElement = $compile(`<${controlName}></${controlName}>`)(scope);
                        headerSpacer.after(controlElement);
                    });
            }

            // `self.footer` is a name string of a directive; if specified, directive is compiled and inserted into the pane template
            if (self.footer) {
                let footerElement = $compile(`<${self.footer}></${self.footer}>`)(scope);
                footer.append(footerElement);
            }
        }
    }

    /**
     * Skeleton controller function.
     */
    function Controller() {
        //const self = this;

        activate();

        function activate() {

        }
    }
})();
