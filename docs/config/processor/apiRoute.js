var _ = require('lodash');

module.exports = function apiRouteProcessor() {
    'use strict';
    return {
        $runAfter: ['docMergeProcessor'],
        $runBefore: ['renderDocsProcessor'],
        $process: function (docs) {
            // generate route data
            var apiRoutes = _(docs).filter(function (doc) {
                return !_.contains(['index', 'content'], doc.docType);
            })
            .value();

            var tmpR = _.map(apiRoutes, function (route) {

                if (route.docType === 'gcMethod') {
                    return {
                        name: route.name,
                        outputPath: './partials/' + route.outputPath,
                        url: '/' + route.path + route.name
                    };
                } else {
                    return {
                        name: route.name,
                        outputPath: './partials/' + route.outputPath,
                        url: '/' + _.trimRight(route.path, '/')
                    };
                }

            });

            // generate constant-data for pages
            docs.push({
                name: 'API',
                docType: 'constant',
                template: 'constant-data.template.js',
                outputPath: '../js/api-data.js',
                items: tmpR
            });

            return docs;
        }
    };
};
