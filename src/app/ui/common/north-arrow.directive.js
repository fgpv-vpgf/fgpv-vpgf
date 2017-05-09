(() => {
    'use strict';

    angular.module('app.ui')
        .directive('rvNorthArrow', rvNorthArrow);

    /**
     * `rvNorthArrow` directive body. Displays the north arrow on the map.
     *
     * @return {object} directive body
     */
    function rvNorthArrow(configService, $rootScope, $rootElement, events, mapToolService, $interval) {
        const directive = {
            restrict: 'E',
            link
        };

        return directive;

        function link (scope, element) {
            const self = scope.self;

            self.arrowIcon = 'northarrow';

            /*
            $rootScope.$on(events.rvApiReady, () => {
                // a game of tug-o-war ensues with esri. We want to move overview map up one level but we are ensure when esri is finished
                // initializing it. Moving it too soon fails, so we keep trying until it works (about 2-3 tries on average for chrome).
                const stopOverviewInterval = $interval(() => {
                    if ($rootElement.find('rv-shell > div.esriOverviewMap').length > 0) {
                        $interval.cancel(stopOverviewInterval);
                        return;
                    }
                    const overviewMap = $rootElement.find('div.rv-esri-map > div.esriOverviewMap').first();
                    overviewMap.parent().parent().prepend(overviewMap);
                }, 200);

                const mapConfig = configService.getSync.map.components;
                if (mapConfig.northArrow && mapConfig.northArrow.enabled) {
                    updateNorthArrow(); // set initial position
                    $rootScope.$on(events.rvExtentChange, updateNorthArrow); // update on extent changes
                } else {
                    element.css('display', 'none'); // hide if disabled in the config
                }
            });
            */

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
})();
