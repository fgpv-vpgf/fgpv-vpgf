import angularDragula from '../../../node_modules/angular-dragula/dist/angular-dragula.js';

/**
 * @namespace app.core
 * @description
 *
 * The `app.core` module pull in all the commonly used dependencies.
 */
angular.module('app.core', [
    'ngAnimate',
    'ngMaterial',
    'ngSanitize',
    'ngMessages',

    'pascalprecht.translate',
    'dotjem.angular.tree',
    'flow',
    angularDragula(angular),
]);
