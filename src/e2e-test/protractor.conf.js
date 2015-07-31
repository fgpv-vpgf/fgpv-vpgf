exports.config = {
    // if you need this, make sure that your first ng-inlcude div is on the descendant of
    // the roomElement; it doesn't work otherwise for some reason
    //rootElement: 'div#guts',

    allScriptsTimeout: 11000,
    getPageTimeout: 10000,

    seleniumAddress: ' http://127.0.0.1:4444/wd/hub',

    specs: [
      '*.js'
    ],

    capabilities: {
        'browserName': 'chrome'
    },

    baseUrl: 'http://localhost:6001/src/',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    }
};
