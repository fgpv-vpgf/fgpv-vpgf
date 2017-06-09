angular.module('app.ui')
    .directive('rvNorthArrow', rvNorthArrow);

/**
 * `rvNorthArrow` directive body. Displays the north arrow on the map.
 *
 * @return {object} directive body
 */
function rvNorthArrow(configService, $rootScope, $rootElement, events, mapToolService, $interval, $compile) {
    const directive = {
        restrict: 'E',
        link
    };

    return directive;

    function link (scope, element) {
        const self = scope.self;

        self.arrowIcon = 'northarrow';

        $rootScope.$on(events.rvApiReady, () => {
            const mapConfig = configService.getSync.map.components;
            if (mapConfig.northArrow && mapConfig.northArrow.enabled) {
                // required so that arrow moves behind overview map instead of in front
                $rootElement.find('.rv-esri-map > .esriMapContainer').first().after(element);

                // append the icon
                const northArrowTemplate = `<md-icon md-svg-src="{{ self.arrowIcon }}"></md-icon>`;
                const northArrowScope = $rootScope.$new();
                northArrowScope.self = self;
                const northArrowCompiledTemplate = $compile(northArrowTemplate)(northArrowScope);
                element.append(northArrowCompiledTemplate);

                updateNorthArrow(); // set initial position
                $rootScope.$on(events.rvExtentChange, updateNorthArrow); // update on extent changes
            } else {
                element.css('display', 'none'); // hide if disabled in the config
            }
        });

        /**
        * Displays a north arrow along the top of the viewer
        * @function  updateNorthArrow
        */
        function updateNorthArrow() {
            const north = mapToolService.northArrow();
            if (!north.projectionSupported) { // hide the north arrow if projection is not supported
                element.css('display', 'none');
            } else {
                self.arrowIcon = north.screenY > 0 ? 'snowman' : 'northarrow'; // change icon for north pole
                element
                    .css('display', 'block')
                    .css('left', north.screenX)
                    .css('top', Math.max(1, north.screenY))
                    .css('transform', north.screenY > 0 ? '' : `rotate(${north.rotationAngle}deg)`);
            }
        }
    }
}
