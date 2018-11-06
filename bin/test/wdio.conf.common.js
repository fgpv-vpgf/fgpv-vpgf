exports.config = {
    jasmineNodeOpts: {
        defaultTimeoutInterval: 10000
    },

    specs: ['./enhancedTable/tests/*.spec.js'],
    exclude: [],
    maxInstances: 10,
    sync: true,
    //
    // Level of logging verbosity: silent | verbose | command | data | result | error
    logLevel: 'result',
    //
    // Enables colors for log output.
    coloredLogs: true,
    //
    // Warns when a deprecated command is used
    deprecationWarnings: true,
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 90000,
    //
    // Default request retries count
    connectionRetryCount: 3,

    framework: 'jasmine',
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: http://webdriver.io/guide/reporters/dot.html
    reporters: ['spec'],
    screenshotPath: './errorShots/'
};
