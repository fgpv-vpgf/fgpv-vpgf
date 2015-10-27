// service factory that has deployPath of the application, misc settings for the renderer

module.exports = function myApp() {
    'use strict';
    return {
        deployPath: '/dgeni/',
        isDeploy: false
    };
};
