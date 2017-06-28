exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['sidePanel-spec.js'],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 60000
    },
    allScriptsTimeout: 60000
};
