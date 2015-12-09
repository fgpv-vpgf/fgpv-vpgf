(function () {
    'use strict';

    /**
     * @ngdoc module
     * @name app.ui
     * @description
     *
     * The `app.ui` module pull in all the inidividual ui modules.
     */
    angular
        .module('app.ui', [
            'app.ui.sidenav',
            'app.ui.appbar',
            'app.ui.panels',
            'app.ui.toc',
            'app.ui.toolbox',
            'app.ui.metadata',
            'app.ui.mapnav',
            'app.ui.filters',
            'app.ui.common',
            'app.ui.settings'
        ]);
})();
