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
            const arrowSource = mapConfig.northArrow.arrowIcon;
            const poleSource = mapConfig.northArrow.poleIcon;
            let northArrowTemplate = '';

            // flags to indicate of the supplied urls are svg or not.  Defaults to true if not provided
            let arrowIsSvg = arrowSource ? _isSVG(arrowSource) : true;
            let poleIsSvg = poleSource ? _isSVG(poleSource) : true;

            if (mapConfig.northArrow && mapConfig.northArrow.enabled) {
                // required so that arrow moves behind overview map instead of in front
                $rootElement.find('.rv-esri-map > .esriMapContainer').first().after(element);
                updateNorthArrow(); // set initial position
                $rootScope.$on(events.rvExtentChange, updateNorthArrow); // update on extent changes
            } else {
                element.css('display', 'none'); // hide if disabled in the config
            }

            /**
             * Displays a north arrow along the top of the viewer
             * @function  updateNorthArrow
             */
            function updateNorthArrow() {
                const north = mapToolService.northArrow();
                if (!north.projectionSupported) { // hide the north arrow if projection is not supported
                    element.css('display', 'none');
                } else {
                    // remove any excessive icons
                    if (element.children().length > 0) {
                        element.children().remove();
                    }

                    if (north.screenY > 0) { // change icon for north pole
                        if (poleSource) {
                            if (poleIsSvg) {
                                northArrowTemplate = `<md-icon md-svg-src=${poleSource}></md-icon>`;
                            } else {
                                northArrowTemplate = `<img ng-src=${poleSource} />`;
                            }
                        } else { // default to a snowman if no source
                            northArrowTemplate = `<md-icon md-svg-src="snowman"></md-icon>`;
                        }
                    } else {
                        if (arrowSource) {
                            if (arrowIsSvg) {
                                northArrowTemplate = `<md-icon md-svg-src=${arrowSource}></md-icon>`;
                            } else {
                                northArrowTemplate = `<img ng-src=${arrowSource} />`;
                            }
                        } else { // default to a north arrow if no source
                            northArrowTemplate = `<md-icon md-svg-src="northarrow"></md-icon>`;
                        }
                    }

                    // append the northarrow icon
                    const northArrowScope = $rootScope.$new();
                    northArrowScope.self = self;
                    const northArrowCompiledTemplate = $compile(northArrowTemplate)(northArrowScope);
                    element.append(northArrowCompiledTemplate);
                    element
                        .css('display', 'block')
                        .css('left', north.screenX)
                        .css('top', Math.max(1, north.screenY))
                        .css('transform', north.screenY > 0 ? '' : `rotate(${north.rotationAngle}deg)`);
                }
            }
        });

        /**
         *
         * @param {string} url string of an image url
         */
        function _isSVG(url) {
            let ext = '';

            if (url.includes('data:image/')) { // data url
                ext = url.split(/data:image\//).pop().slice(0, 3);
            } else { // extension
                ext = url.split(/[\s.]+/).pop();
            }

            return ext === 'svg';
        }
    }
}
