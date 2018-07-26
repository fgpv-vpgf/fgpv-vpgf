/* global RV */

'use strict';

/**
 * @namespace app
 * @description
 * The root module ties other modules together providing a very straightforward way to add or remove modules from the application.
 *
 */
angular
    .module('app', [
        'app.core',
        'app.templates',
        'app.geo',
        'app.ui',
        'app.layout'
    ])
    .config(($compileProvider, $mdInkRippleProvider, $mdGestureProvider, $mdAriaProvider) => {
        // to improve IE performance disable ripple effects globally and debug info
        if (RV.isIE) {
            $mdInkRippleProvider.disableInkRipple();
            $mdGestureProvider.disableAll();
        }
    });

// a separate templates module is needed to facilitate directive unit testing
angular.module('app.templates', []);
