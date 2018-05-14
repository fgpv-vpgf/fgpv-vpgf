import { Point, XY } from 'api/geometry';

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

        $rootScope.$on(events.rvApiReady, () => {
            const mapConfig = configService.getSync.map.components;
            const mapI = configService.getSync.map.instance; 
            if (mapConfig.northArrow && mapConfig.northArrow.enabled) {
                // required so that arrow moves behind overview map instead of in front
                $rootElement.find('.rv-esri-map > .rv-inner-shell').first().after(element);
                events.$on(events.rvApiMapAdded, (_, mApi) => {
                    // create new layer for north pole
                    mApi.layers.addLayer('northPoleLayer').then(layer => {
                        // create north pole as point object and add to north pole layer 
                        const defaultPole = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z';
                        const poleSource = mapConfig.northArrow.poleIcon || defaultPole;
                        let poleXY = new XY(-96, 90);
                        let northPole = new Point('northPole', poleSource, poleXY);

                        mapI.northPoleLayer = layer[0]; 
                        mapI.addLayer(mapI.northPoleLayer);
                        mapI.northPoleLayer.addGeometry(northPole); 
                    });              

                    updateNorthArrow(); // set initial position
                    $rootScope.$on(events.rvExtentChange, updateNorthArrow); // update on extent changes
                });
            } else {
                element.css('display', 'none'); // hide if disabled in the config
            }

            /**
             * Displays a north arrow along the top of the viewer
             * @function  updateNorthArrow
             */
            function updateNorthArrow() {
                const arrowSource = mapConfig.northArrow.arrowIcon || 'northarrow';

                // flags to indicate of the supplied urls are svg or not.  Defaults to true if not provided
                const arrowIsSvg = mapConfig.northArrow.arrowIcon ? _isSVG(arrowSource) : true;

                const north = mapToolService.northArrow();
                let northArrowTemplate = '';

                if (!north.projectionSupported) { // hide the north arrow if projection is not supported
                    element.css('display', 'none');
                } else {
                    // remove any excessive icons
                    if (element.children().length > 0) {
                        element.children().remove();
                    }

                    const isNorthPole = north.screenY > 0; // is the icon in north pole

                    // create and append northarrow if the north pole is not visible
                    if (!isNorthPole) {
                        northArrowTemplate = _getTemplate(arrowSource, arrowIsSvg);
                        const northArrowScope = $rootScope.$new();
                        northArrowScope.self = self;
                        const northArrowCompiledTemplate = $compile(northArrowTemplate)(northArrowScope);
                        element.append(northArrowCompiledTemplate);
                        element
                            .css('display', 'block')
                            .css('left', north.screenX)
                            .css('top', 1)
                            .css('transform-origin', 'top center')
                            .css('transform', `rotate(${north.rotationAngle}deg)`);
                    }                   
                }
            }
        });

        /**
         * Return true iff the image of the source is svg
         * @param {string} source string of an image source
         * @return {boolean} true iff source is svg
         */
        function _isSVG(source) {
            const ext = source.includes('data:image/') ? source.split(/data:image\//).pop().slice(0, 3) : source.split(/[\s.]+/).pop();

            return ext === 'svg';
        }

        /**
         * Return the appropriate templace for north arrow
         * @param {string} source string of an image source
         * @param {boolean} isSVG true iff source is svg
         * @returns {string} template string
         */
        function _getTemplate(source, isSVG) {
            return isSVG ? `<md-icon md-svg-src=${source}></md-icon>` : `<img ng-src=${source} />`;
        }
    }
}
