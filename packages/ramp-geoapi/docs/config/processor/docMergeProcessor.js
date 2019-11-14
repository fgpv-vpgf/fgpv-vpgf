var _ = require('lodash');

module.exports = function docMergeProcessor() {
    'use strict';
    return {
        $runAfter: ['computePathsProcessor'],
        $runBefore: ['renderDocsProcessor'],
        $process: function (docs) {

            var modules = _(docs).filter({ docType: 'module' }).value();

            // servie docs
            var componentGroups = _(docs).filter({ docType: 'componentGroup' }).value();

            componentGroups.forEach(function (doc) {
                    // determine parent docs
                    var parentIdx = _.findIndex(modules, function (a) {
                        return a.name === doc.moduleName;
                    });

                    var parentDoc = modules[parentIdx];

                    if (!parentDoc.hasOwnProperty('groups')) {
                        // add methods
                        parentDoc.groups = [];
                    }

                    parentDoc.groups.push({
                        title: doc.groupType,
                        children:doc.components
                    });

                    // switch (doc.groupType){
                    //  case "service":
                    //  parentDoc["service"] = doc;
                    //  break;
                    //  case "function":
                    //  parentDoc["function"] = doc;
                    //  break;
                    //  case "directive":
                    //  parentDoc["directive"] = doc;
                    //  break;
                    //  default:
                    //  log.info("Unkown group type detected:" + doc.groupType);
                    // }
                });

            // process method docs and merge them into the modules
            var methodGroup = _(docs).filter({docType: 'method'}).value();

            methodGroup.forEach(function (doc) {
                // determine parent docs
                var parentIdx = _.findIndex(modules, function (a) {
                    // for ngdoc method, memberof contains the name of the module
                    return a.name === doc.memberof;
                });

                var parentDoc = modules[parentIdx];

                if (!parentDoc.hasOwnProperty('groups')) {
                    // add methods
                    parentDoc.groups = [];
                }

                // use doc.docType, doc
                // title is used as nav menu
                parentDoc.groups.push({
                    title: doc.docType,
                    children: [doc]
                });
            });


            return _(docs).reject({ docType: 'componentGroup' }).reject({ docType: 'method'}).value();
        }
    };
};
