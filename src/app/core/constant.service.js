(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('configDefaults', {
            title: 'Dawn RAM'
        })
        .constant('viewRegistry', {
            panelPlug: {
                'panelPlug@': {
                    template: '<rv-main-panel></rv-main-panel>',
                    controller: 'MainPanelPlugController as self'
                }
            },
            sidePanelPlug: {
                'sidePanelPlug@': {
                    template: '<rv-side-panel></rv-side-panel>',
                    controller: 'SidePanelPlugController as self'
                }
            }
        })
        .constant('templateRegistry', {
            appbar: 'app/ui/appbar/appbar.html',
            toc: 'app/ui/toc/toc.html',
            toolbox: 'app/ui/toolbox/toolbox.html',
            metadata: 'app/ui/metadata/metadata.html',
            settings: 'app/ui/settings/settings.html'
        });
})();
