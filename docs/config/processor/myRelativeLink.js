var _ = require('lodash');
var path = require('canonical-path');

module.exports = function myRelativeLinkInlineTag(myApp) {
  return {
    name: 'myRelativeLink',
    process: function(myTitle, myOutputPath) {

        var url;
        var compiled = _.template('<a href="${url}">${title}</a>');
        var title = myTitle;

        // remove trailing '/'
        myOutputPath = _.trimRight(myOutputPath, '/');

        if (myOutputPath) {
            if(myApp.isDeploy){
                url = path.join(myApp.deployPath, myOutputPath);
            }else{
                url = path.join("#/", myOutputPath);
            }
        } else{
            return myTitle;
        }

        return compiled({ url: url, title: title });
    }
  };  
};