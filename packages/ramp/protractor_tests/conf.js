exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['sidePanel-spec.js'],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 120000
    },
    allScriptsTimeout: 120000
};
