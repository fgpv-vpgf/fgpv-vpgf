const commonConfig = require('./wdio.conf.common').config;

exports.config = Object.assign(
    {
        services: ['testingbot'],
        baseUrl: `https://plugins.fgpv-vpgf.com/files/${process.env.TRAVIS_BRANCH}/`,
        maxInstances: 1,
        logLevel: 'verbose',
        capabilities: [
            {
                browserName: 'chrome',
                platform: 'WIN10',
                version: '70'
            }
        ],
        user: process.env.TESTING_BOT_KEY,
        key: process.env.TESTING_BOT_SECRET,

        reporterOptions: {
            outputDir: './'
        },

        reporters: ['dot']
    },
    commonConfig
);
