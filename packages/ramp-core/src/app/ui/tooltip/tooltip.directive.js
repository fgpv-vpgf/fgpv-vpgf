const templateUrl = require('./tooltip-hover.html');

/**
 *
 * @module rvTooltip
 * @memberof app.ui
 * @description
 *
 * The `rvTooltip` represents a tooltip on the map. Templates specify the appearance of the tooltip's outer node (border, size, shape, pointer at the bottom, etc.) while transcluded content can modify anything inside this container.
 *
 */
angular
    .module('app.ui')
    .directive('rvTooltip', rvTooltip);

function rvTooltip($q, debounceService) {
    const directive = {
        restrict: 'E',
        // scope: {}, // here, the tooltip directive requests an isolated scope, while the transcluded content of the tooltip has non-isolated scope with access to the scope the directive was compiled under
        templateUrl,
        transclude: true,
        link: (scope, el) => {

            const self = scope.self;
            self.isRendered = false; // hides the tooltip from the screen until it's fully rendered

            // register `updateDimensions` with the debouncing service, so dimensions are updated only when stabilized
            const debouncedUpdateDimensions = debounceService.registerDebounce(dimensions => {
                scope.updateDimensions(dimensions);
                self.isRendered = true;
            }, 20, false, true);

            // TODO: use layoutservice on resize here somehow to avoid duplication
            scope.$watch(watchBBoxChanges, newDimensions =>
                debouncedUpdateDimensions(newDimensions), true); // the last argument (true) is set for $watch to do object equality comparison instead of reference equality

            /**
             * @function watchBBoxChanges
             * @private
             * @return {Object} object in the form of { width: <Number>, height: <Number> } which reflects the size of the tooltip's outer node
             */
            function watchBBoxChanges() {
                const br = el[0].getBoundingClientRect(); // jquery.width/height functions round pixel sizes :(

                return {
                    width: br.width,
                    height: br.height
                };
            }
        }
    };

    return directive;
}
