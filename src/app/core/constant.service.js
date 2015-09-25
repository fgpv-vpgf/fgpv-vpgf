(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('configDefaults', {
            title: 'Dawn RAM'
        })
        .constant('templateRegistry', {
            appbar: 'app/ui/appbar/appbar.html',
            mainPanel: 'app/ui/panels/main-panel.html',
            toc: 'app/ui/toc/toc.html',
            toolbox: 'app/ui/toolbox/toolbox.html'
        });
})();
