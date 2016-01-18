(() => {
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
        .constant('layerTypes', {
            esriDynamic: 'esriDynamic',
            esriFeature: 'esriFeature',
            esriImage: 'esriImage',
            ogcWms: 'ogcWms'
        })
        .constant('templateRegistry', {
            appbar: 'app/ui/appbar/appbar.html',
            toc: 'app/ui/toc/toc.html',
            toolbox: 'app/ui/toolbox/toolbox.html',
            metadata: 'app/ui/metadata/metadata.html',
            settings: 'app/ui/settings/settings.html'
        });
})();
