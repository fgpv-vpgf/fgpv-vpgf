(function() {
    'use strict';

    angular
        .module('app.core')
        .run(runBlock);

    runBlock.$inject = ['config', 'layoutConfig', '$rootScope', '$translate'];

    function runBlock(config, layoutConfig, $rootScope, $translate) {
        // wait until config is retrieved
        config.initialize()
            .then(function() {
                // initialize other services
                layoutConfig.initialize();
                console.log(layoutConfig);
            });

        // to prevent FOUC need to load translation files with config initialization if we know the language
        $rootScope.$on('$translateLoadingSuccess', function(data) {
            console.log(data);
        });

        $translate.use('fr-CA');
    }

})();
