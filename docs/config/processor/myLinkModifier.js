var _ = require('lodash');
var path = require('canonical-path');

// link modifier filter
module.exports = function myLinkModifierFilter(myApp) {
  return {
    name: 'myLinkModifier',
    process: function(url) {
        if(myApp && myApp.isDeploy) {
            return path.join(myApp.deployPath, url);
        }else{
        	return path.join("/", url)
        }
    }
  };
};