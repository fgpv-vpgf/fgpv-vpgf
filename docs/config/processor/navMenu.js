var _ = require('lodash');

module.exports = function navMenuProcessor() {
    'use strict';
    return {
        $runAfter: ['apiRouteProcessor'],
        $runBefore: ['renderDocsProcessor'],
        $process: function (docs) {

            // generate navMenu for index.html
            var navMenu = [];

            var moduleDocs = _.filter(docs, { docType: 'module' });

            _.forEach(moduleDocs, function (moduleDoc) {
                var subMenu = [];

                // groups is not array
                // convert to array
                var groups = _.pairs(moduleDoc.groups);

                if (groups.length) {
                    // remove for geoAPI
                    // groups.forEach(function (group) {
                    //     // directives, services, filters ???

                    //     var childmenu = [];
                    //     group[1].children.forEach(function (child) {
                    //         childmenu.push({
                    //             name: child.name,
                    //             url: '/' + _.trimRight(child.path, '/')
                    //         });
                    //     });

                    //     subMenu.push({
                    //         title: group[1].title,
                    //         children: childmenu
                    //     });

                    //     // TODO: each group has children in array format
                    //     // children has name, outputPath as value
                    // });

                    // build each menu item for module
                    navMenu.push({
                        name: moduleDoc.name,
                        url: '/' + moduleDoc.path,
                        submenus: subMenu
                    });
                } else {
                    navMenu.push({
                        name: moduleDoc.name,
                        url: '/' + moduleDoc.path
                    });
                }

            });

            // create new doc called index,  set output location to  ../
            // because the output location is in the partial folder for rest of the files
            docs.push({
                docType: 'index',
                gcMenu: navMenu,
                name: 'This is a name field',
                title: 'This is a title field',
                outputPath: '../index.html'
            });

            docs.push({
                name: 'NAV',
                docType: 'constant',
                template: 'constant-data.template.js',
                outputPath: '../js/nav-data.js',
                items: navMenu
            });

            // var apiDocs = _(moduleDocs)
            // .mapValues(function(myDocs) {
            //  return _.map(myDocs, function(doc){
            //      return {
            //          name: doc.name,
            //          outputPath: './partials/' + doc.url,
            //          url: '/api/' + doc.name,
            //          label: doc.lable || doc.name
            //      };
            //  });
            // })
            // .value();

            return docs;
        }
    };
};
