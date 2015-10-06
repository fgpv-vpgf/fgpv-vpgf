// Canonical path provides a consistent path (i.e. always forward slashes) across different OSes
var path = require('canonical-path');
var _ = require('lodash');
var Package = require('dgeni').Package;


module.exports = new Package('dgeni-fgpv', [
  require('dgeni-packages/angularjs'),
  require('dgeni-packages/jsdoc'),
  // require('dgeni-packages/ngdoc'),
  require('dgeni-packages/nunjucks')
])

// add myRelativeLink to the package
.factory(require('./processor/myRelativeLink'))
.factory(require('./processor/myLinkModifier'))
.factory(require('./processor/myApp'))
// mddoc file reader
.factory(require('./file-readers/mddoc'))

.processor(require('./processor/myJSMergeProcessor'))
.processor(require('./processor/myNavProcessor'))
.processor(require('./processor/myContent'))

.config(function(log, readFilesProcessor, writeFilesProcessor, mddocFileReader) {

  // add custom mddocFileReader to fileReaders, need to include before we can use the 
  // 'mddocFileReader' in readFilesProcessor.sourceFiles
  readFilesProcessor.fileReaders.push(mddocFileReader);

  log.level = 'info'; // info, debug, silly

  readFilesProcessor.basePath = path.resolve(__dirname, '..');
  readFilesProcessor.sourceFiles = [
    { include: '../src/app/**/*.module.js', basePath: '../src'},
    { include: '../src/app/**/*.js', basePath: '../src' },
    { include: '../docs/content/**/*.md', basePath: '../docs/content', fileReader: 'mddocFileReader' }
  ];

  writeFilesProcessor.outputFolder  = '../dist/docs/app/partials';

})

// add custom tags: for mddoc
.config(function(parseTagsProcessor, getInjectables) {
  // console.log('JKW path: ' + __dirname);

  // need to remove memberof from original tagdefinition
  _.remove(parseTagsProcessor.tagDefinitions, function(tag) {
    return tag.name === 'memberof';
  });

  parseTagsProcessor.tagDefinitions =
      parseTagsProcessor.tagDefinitions.concat(getInjectables(require('./tag-defs')));
})


.config(function(templateFinder, templateEngine) {

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

// add filter to template engine
.config(function(templateEngine, myRelativeLinkInlineTag, myLinkModifierFilter) {
  templateEngine.filters.push(myRelativeLinkInlineTag);
  templateEngine.filters.push(myLinkModifierFilter);
})

.config(function(getLinkInfo) {
  getLinkInfo.relativeLinks = true;
});




