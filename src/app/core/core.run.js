(function() {
    'use strict';

    angular
        .module('app.core')
        .run(runBlock);

    runBlock.$inject = ['config', 'layoutConfig'];

    function runBlock(config, layoutConfig) {
        // wait until config is retrieved
        config.initialize()
            .then(function() {
                // initialize other services
                layoutConfig.initialize();
                console.log(layoutConfig);
            });
    }

})();
