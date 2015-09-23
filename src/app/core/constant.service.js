(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('configDefaults', {
            title: 'Dawn RAM'
        })
        .constant('templateRegistry', {
            mainPanel: 'app/ui/panels/main-panel.html',
            sidePanel: 'app/ui/panels/side-panel.html',
            appbar: 'app/ui/appbar/appbar.html',
            toc: 'app/ui/toc/toc.html',
            toolbox: 'app/ui/toolbox/toolbox.html',
            metadata: 'app/ui/metadata/metadata.html',
            settings: 'app/ui/settings/settings.html'
        });
})();
