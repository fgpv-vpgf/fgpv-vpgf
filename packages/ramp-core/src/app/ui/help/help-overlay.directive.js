const templateUrl = require('./help-overlay.html');

/**
 * @module rvHelpOverlay
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvHelpOverlay` directive provides functionality for the help screen
 *
 */
angular
    .module('app.ui')
    .directive('rvHelpOverlay', rvHelpOverlay);

function rvHelpOverlay(helpService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
        },
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/

    function link(scope, el) { // , attr, ctrl) {
        const self = scope.self;
        self.draw = draw;

        const canvas = el.find('canvas')[0];
        const context = canvas.getContext('2d');

        // make the canvas take up the whole view
        context.canvas.width  = window.innerWidth;
        context.canvas.height = window.innerHeight;

        /**
        * Updates the canvas; clears, fills with translucent grey and then draws
        * whatever help sections are needed.
        *
        * @function draw
        */
        function draw() {
            helpService.clearDrawn();
            context.clearRect(0, 0, canvas.width, canvas.height);

            // save context settings
            context.save();

            // fill canvas with translucent grey
            context.globalAlpha = 0.5;
            context.fillRect(0, 0, canvas.width, canvas.height);

            // restore saved context settings
            context.restore();
            const items = helpService.registry;
            items.forEach(item => {
                const coords = item.getCoords();
                if (shouldBeDrawn(item.key, coords)) {
                    // draw a rect with a border
                    context.fillRect(coords.x, coords.y, coords.width, coords.height);
                    context.clearRect(coords.x + 1, coords.y + 1,
                        coords.width - 2, coords.height - 2);

                    // cache in helpService to check against future items
                    helpService.setDrawn({ coords: coords, key: item.key });
                }
            });
        }

        /**
        * Performs checks to see whether the object described with (key, coords) is valid to draw.
        * An object is valid to draw iff
        * - it doesn't share a key with an already drawn object (we only want one of each help section)
        * - it doesn't overlap with an already drawn object (we don't want overlapping help sections)
        * - it's width and height are non-zero
        *
        * @function shouldBeDrawn
        * @param {String} key       the attribute key for the object being checked
        * @param {Object} coords    the coordinates for the object being checked
        * @return {Boolean}         returns true iff the object is valid to draw
        */
        function shouldBeDrawn(key, coords) {
            let valid = true;
            let alreadyDrawn = helpService.drawnCache;

            // if this is the first item being looked at
            if (alreadyDrawn.length === 0) {
                return true;
            }
            alreadyDrawn.forEach(drawnItem => {
                // Check for unique key, no overlap and no zero-dimensions
                if (drawnItem.key === key || overlap(drawnItem.coords, coords) ||
                coords.width * coords.height === 0) {
                    valid = false;
                    return;
                }
            });
            return valid;
        }

        /**
        * Checks if two rectangles overlap
        *
        * @function overlap
        * @param {Object} first     the x, y, height and width of the first rectangle
        * @param {Object} second    the x, y, height and width of the second rectangle
        * @return {Boolean}         returns true iff the two rectangles overlap
        */
        function overlap(first, second) {
            return !((first.y + first.height) <= second.y || first.y >= (second.y + second.height) ||
                    (first.x + first.width) <= second.x || first.x >= (second.x + second.width));
        }
    }
}

function Controller($scope, stateManager, helpService) {
    'ngInject';

    const self = this;

    // if the help state changes to true: draw the new canvas
    $scope.stateManager = stateManager;
    $scope.$watch('stateManager.state.help.active', newValue => {
        if (newValue) {
            self.draw();
        }
    });

    self.close = function close() {
        stateManager.setActive({ help: false });
    };

    // used in the template to know which help sections need a button
    self.helpSections = helpService.drawnCache;

    activate();

    /*********/

    function activate() {

    }
}
