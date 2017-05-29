import '@claviska/jquery-minicolors';

/**
 * @name rvMinicolors
 * @module app.ui
 * @restrict E
 * @description
 *
 * Directive wrapper for jQuery MiniColors.
 *
 */
angular
    .module('app.ui')
    .directive('rvMinicolors', rvMinicolors);

function rvMinicolors(graphicsService) {
    const directive = {
        restrict: 'A',
        scope: { 'options': '=' },
        link
    };

    return directive;

    function link(scope, el) {
        el.minicolors(scope.options);
    }
}

