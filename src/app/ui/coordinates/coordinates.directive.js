(() => {
    'use strict';

    /**
     * @module rvCoords
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvCoords` directive wraps the mouse coordinnates section.
     *
     */
    angular
        .module('app.ui.coordinates')
        .directive('rvCoordinates', rvCoordinates);

    /**
     * `rvCoordinates` directive body.
     *
     * @function rvCoordinates
     * @return {object} directive body
     */
    function rvCoordinates() {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/ui/coordinates/coordinates.html',
            scope: {},
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    function Controller($rootScope, debounceService, gapiService, $translate) {
        'ngInject';
        const self = this;

        // get values once to reuse in private functions
        self.east = $translate.instant('geo.coord.east');
        self.west = $translate.instant('geo.coord.west');
        self.north = $translate.instant('geo.coord.north');
        self.south = $translate.instant('geo.coord.south');
        self.deg = String.fromCharCode(176);

        $rootScope.$on('mouseMove', debounceService.registerDebounce(onMouseMove, 300, false));

        /**
        * On map mouse move event, show cursor position in lat long (degree, minute, second and decimal degree).
        *
        * @function onMouseMove
        * @private
        * @param {Object} event broadcast event
        * @param {Object} point point in map coordinate to project and get lat/long from
        */
        function onMouseMove(event, point) {
            // project point in lat/long
            const coord = gapiService.gapi.proj.localProjectGeometry(4326, point);

            // degree, minute, second
            const dmsCoords = convertDDToDMS(coord.y, coord.x);
            self.dms = `${dmsCoords.y} | ${dmsCoords.x}`;

            // decimal
            coord.y = coord.y.toFixed(5);
            coord.x = coord.x.toFixed(5);
            coord.y = (coord.y > 0) ? `${coord.y} ${self.north}` : `${Math.abs(coord.y)} ${self.south}`;
            coord.x = (coord.x < 0) ? `${Math.abs(coord.x)} ${self.west}` : `${coord.x} ${self.east}`;
            self.decimal = `${coord.y} | ${coord.x}`;
        }

        /**
        * Convert lat/long in decimal degree to degree, minute, second.
        *
        * @function convertDDToDMS
        * @private
        * @param {Number} lat latitude value
        * @param {Number} long longitude value
        * @return {Object} object who contain lat/long in degree, minute, second
        */
        function convertDDToDMS(lat, long) {
            const oy = (lat > 0) ? self.north : self.south;
            const dy = Math.floor(lat);
            const my = Math.floor((lat - dy) * 60);
            const sy = Math.round((lat - dy - my / 60) * 3600);

            const ox = (long < 0) ? self.west : self.east;
            const dx = Math.floor(long);
            const mx = Math.floor((long - dx) * 60);
            const sx = Math.round((long - dx - mx / 60) * 3600);

            return { y: `${Math.abs(dy)}${self.deg} ${padZero(my)}\' ${padZero(sy)}\" ${oy}`,
                    x: `${Math.abs(dx)}${self.deg} ${padZero(mx)}\' ${padZero(sx)}\" ${ox}` };
        }

        /**
        * Pad value with leading 0 to make sure there is always 2 digits if number is below 10.
        *
        * @function padZero
        * @private
        * @param {Number} val value to pad with 0
        * @return {String} string with always 2 characters
        */
        function padZero(val) {
            return (val >= 10) ? `${val}` : `0${val}`;
        }
    }
})();
