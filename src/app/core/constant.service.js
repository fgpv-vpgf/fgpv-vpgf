(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('configDefaults', {
            title: 'Dawn RAM'
        })
        .constant('templateRegistry', {
            toolbar: 'app/ui/toolbar/toolbar.html',
            mainPanel: 'app/ui/panels/mainpanel.html'
        });
})();
