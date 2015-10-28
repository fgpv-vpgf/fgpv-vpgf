var _ = require('lodash');

module.exports = function contentRouteProcessor(templateFinder, log) {
    'use strict';
    return {
        $runAfter: ['apiRouteProcessor'],
        $runBefore: ['renderDocsProcessor'],
        $process: function (docs) {
            // TODO: need to figureout where material setup area information
            var contentDocs = _(docs).filter(function (doc) {
                return doc.docType === 'content';
            })
            .forEach(function (doc) {
                doc.outputPath = 'content/' + doc.fileInfo.baseName + '.html';
                doc.url = doc.fileInfo.baseName;
            })

            // need groupby to generate another collection
            .groupBy('area')
            .mapValues(function (filteredDocs) {
                return _.map(filteredDocs, function (doc) {
                    return {
                        name: doc.name,
                        outputPath: './partials/' + doc.outputPath,
                        url: '/' + doc.url,
                        label: doc.lable || doc.name
                    };
                });
            })
            .value();

            log.info('in myContentProcessor');

            // generate constant-data for pages
            docs.push({
                name: 'PAGES',
                docType: 'constant',
                template: 'constant-data.template.js',
                outputPath: '../js/content-data.js',
                items: contentDocs
            });

            return docs;
        }
    };
};
