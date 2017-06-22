const webpack   = require('webpack');
const Merge         = require('webpack-merge');
const CommonConfig  = require('./webpack.common.js');

module.exports = function (env) {
    const config = Merge(CommonConfig(env), {});

    if (env.useMap) {
        config.devtool = 'cheap-module-eval-source-map';
    }

    return config;
}
