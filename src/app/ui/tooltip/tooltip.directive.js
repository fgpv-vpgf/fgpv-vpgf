(() => {

    /**
     * @ngdoc directive
     * @module rvTooltip
     * @memberof app.ui
     * @description
     *
     * The `rvTooltip` represents a tooltip on the map. Tooltip templates usually correspond with tooltip movement strategy.
     *
     */
    angular
        .module('app.ui')
        .directive('rvTooltip', rvTooltip);

    /**
     * `rvPanel` directive body.
     *
     * @function rvPanel
     * @return {object} directive body
     */
    function rvTooltip($q, debounceService) {
        const directive = {
            restrict: 'E',
            // scope: {}, // here, the tooltip directive requests an isolated scope, while the transcluded content of the tooltip has non-isolated scope with access to the scope the directive was compiled under
            templateUrl: (elm, attr) =>
                (`app/ui/tooltip/tooltip-${attr.template}.html`),
            transclude: true,
            link: (scope, el) => {

                const self = scope.self;
                self.isRendered = false; // hides the tooltip from the screen until it's fully rendered

                // register `updateDimensions` with the debouncing service, so dimensions are updated only when stabilized
                const debouncedUpdateDimensions = debounceService.registerDebounce(dimensions => {
                    scope.updateDimensions(dimensions);
                    self.isRendered = true;
                }, 20, false, true);

                scope.$watch(() => {
                    const br = el[0].getBoundingClientRect(); // jquery.width/height functions round pixel sizes :(

                    return {
                        width: br.width,
                        height: br.height
                    };
                }, (newDimensions) =>
                        debouncedUpdateDimensions(newDimensions),
                true);
            }
        };

        return directive;
    }
})();
