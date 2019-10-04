'use strict';

// Canonical path provides a consistent path (i.e. always forward slashes) across different OSes
var path = require('canonical-path');
var _ = require('lodash');
var Package = require('dgeni').Package;

module.exports = new Package('dgeni-geoAPI', [

    require('dgeni-packages/ngdoc'),
    require('dgeni-packages/nunjucks')
  ])

// add internal route url filter to convert url to routing url
.factory(require('./processor/internalRouteUrlFilter'))
.factory(require('./processor/myLinkModifier'))
.factory(require('./processor/myApp'))

// mddoc file reader
.factory(require('./file-readers/mddoc'))

.processor(require('./processor/docMergeProcessor'))
.processor(require('./processor/navMenu'))
.processor(require('./processor/contentRoute'))
.processor(require('./processor/apiRoute'))

.config(function (log, readFilesProcessor, writeFilesProcessor, mddocFileReader) {

    // add custom mddocFileReader to fileReaders, need to include before we can use the
    // 'mddocFileReader' in readFilesProcessor.sourceFiles
    readFilesProcessor.fileReaders.push(mddocFileReader);

    log.level = 'debug'; // info, debug, silly

    readFilesProcessor.basePath = path.resolve(__dirname, '..');
    readFilesProcessor.sourceFiles = [
        { include: '../src/**/*.js', basePath: '../src'},
        // { include: '../src/app/**/*.module.js', basePath: '../src' },
        // { include: '../src/app/**/*.js', exclude: '../src/app/**/*.module.js', basePath: '../src' },

        // important! basepath has important effect on the grouping of documents
        // here with ../docs will give a relative path of content/getting_started.md
        // which in turn determine the doc.area = content for getting_started, gulp-i18n-csv
        { include: '../docs/content/**/*.md', basePath: '../docs' }
    ];

    writeFilesProcessor.outputFolder  = '../dist/docs/app/partials';
})

// add custom tags: for mddoc
.config(function (parseTagsProcessor, getInjectables) {

    // need to remove memberof from original tagdefinition
    _.remove(parseTagsProcessor.tagDefinitions, function (tag) {
        return tag.name === 'memberof';
    });

    parseTagsProcessor.tagDefinitions =
    parseTagsProcessor.tagDefinitions.concat(getInjectables(require('./tag-defs')));
})

.config(function (templateFinder, templateEngine) {

    // Nunjucks and Angular conflict in their template bindings so change the Nunjucks
    templateEngine.config.tags = {
        variableStart: '{$',
        variableEnd: '$}'
    };

    templateFinder.templateFolders = [
        path.resolve(__dirname, './templates/mddoc'),
        path.resolve(__dirname, './templates')
    ];

    // .unshift(path.resolve(__dirname, './templates'))
    // .unshift(path.resolve(__dirname, './templates/ngdoc'));

    templateFinder.templatePatterns = [
        '${ doc.template }',
        '${ doc.id }.${ doc.docType }.template.html',
        '${ doc.id }.template.html',
        '${ doc.docType }.template.html',
        'common.template.html'
        ];
})


// add idTemplate and pathTemplate for docType: content
.config(function (computeIdsProcessor, getAliases) {
    computeIdsProcessor.idTemplates.push({
        docTypes: ['content'],
        idTemplate: 'content:${docType}:${name}',
        getAliases: getAliases
    });
})

.config(function(computePathsProcessor) {
  computePathsProcessor.pathTemplates.push({
    docTypes: ['content'],
    pathTemplate: '${id}',
    outputPathTemplate: '${path}.html'
  });
})

// add idTemplate and pathTemplate for docType: function
.config(function (computeIdsProcessor, getAliases) {
    computeIdsProcessor.idTemplates.push({
        docTypes: ['method'],
        idTemplate: 'method:${docType}:${name}',
        getAliases: getAliases
    });
})

.config(function(computePathsProcessor) {
  computePathsProcessor.pathTemplates.push({
    docTypes: ['method'],
    pathTemplate: 'partials/${area}/${memberof}/${name}',
    outputPathTemplate: '${path}.html'
  });
})

// .config(function(computeIdsProcessor, getAliases) {
//   computeIdsProcessor.idTemplates.push({
//     docTypes: ['js'],
//     idTemplate: 'module:${module}.${docType}:${name}',
//     getAliases: getAliases
//   });
// })

// add filter to template engine
.config(function (templateEngine, internalRouteUrlFilter, myLinkModifierFilter) {
    templateEngine.filters.push(internalRouteUrlFilter);
    templateEngine.filters.push(myLinkModifierFilter);
})

.config(function (getLinkInfo) {
    getLinkInfo.relativeLinks = true;
});

// Do not remove: The following are sample idTemplates and pathTemplates
// You will need to add idTemplate and pathTemplate for each new doc type introduced
//
// Example:
// .config(function(computeIdsProcessor) {
//   computeIdsProcessor.idTemplates.push({
//     docTypes: ['js'],
//     getId: function(doc) {
//       var docPath = doc.name || doc.codeName;
//       if ( !docPath ) {
//         docPath = path.dirname(doc.fileInfo.relativePath);
//         if ( doc.fileInfo.baseName !== 'index' ) {
//           docPath = path.join(docPath, doc.fileInfo.baseName);
//         }
//       }
//       return docPath;
//     },
//     getAliases: function(doc) {
//       return [doc.id];
//     }
//   });
// })

// .config(function(computePathsProcessor) {
//   computePathsProcessor.pathTemplates.push({
//     docTypes: ['js'],
//     pathTemplate: '${id}',
//     outputPathTemplate: '${path}.html'
//   });
// });