var _ = require('lodash');

module.exports = function internalRouteUrlFilter() {
    'use strict';
    return {
        name: 'toInternalRoute',
        process: function (doc, originatingDoc, title) {

            // dependency inline tag filter will generate URL tags for the doc app router
            var url;
            var compiled = _.template('<a href="${url}">${title}</a>');

            if (doc && doc.path) {
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
