exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    chromeOnly: true,
    directConnect: true,
    specs: ['sidePanel-spec.js'],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 60000
    },
    allScriptsTimeout: 60000
};
