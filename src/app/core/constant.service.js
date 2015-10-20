(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name configDefaults
     * @module app.core
     * @description
     *
     * The `configDefaults` constant service provides default config values.
     */
    /**
     * @ngdoc service
     * @name viewRegistry
     * @module app.core
     * @description
     *
     * The `viewRegistry` constant service provides standard views for the state manager.
     */
    /**
     * @ngdoc service
     * @name templateRegistry
     * @module app.core
     * @description
     *
     * The `templateRegistry` constant service provides template URLs.
     */
    angular
        .module('app.core')
        .constant('configDefaults', {
            title: 'Dawn RAM'
        })
        .constant('events', {
            rvReady: 'rvReady'
        })
        .constant('viewRegistry', {
            filtersPlug: {
                'filtersPlug@': {
                    template: '<rv-filters-panel></rv-filters-panel>',
                    controller: 'FiltersPanelPlugController as self'
                }
            },
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
