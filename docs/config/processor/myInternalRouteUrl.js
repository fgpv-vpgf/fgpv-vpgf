var _ = require('lodash');
var path = require('canonical-path');

module.exports = function myInternalRouteUrl(myApp, log) {
  return {
    name: 'myInternalRouteUrl',
    process: function(doc, originatingDoc, title) {
        // dependency inline tag filter will generate URL tags for the doc app router
        var url;
        var compiled = _.template('<a href="${url}">${title}</a>');

        if ( doc && doc.path ) {
            title = title || doc.name;

            // add url for doc app
            // remove trailing '/'
            url = _.trimRight('#/' + doc.path, '/');
            
            return compiled({ url: url, title: title });
        } else {
            return doc;
        }       
    }
  };  
};