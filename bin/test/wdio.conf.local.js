const devServerService = require('./services/dev-server.service');
const commonConfig = require('./wdio.conf.common').config;
const wpConfig = require('../build/webpack.config.js')();

exports.config = Object.assign(
    {
        services: ['selenium-standalone', devServerService, 'chromedriver'],
        webpackConfig: wpConfig,
        webpackPort: wpConfig.devServer.port,

        baseUrl: `http://localhost:${wpConfig.devServer.port}/`,
        maxInstances: 10,
        capabilities: [
            {
                browserName: 'chrome'
            }
        ],
        sync: true
    },
    commonConfig
);
