const Merge         = require('webpack-merge');
const CommonConfig  = require('./webpack.common.js');

module.exports = function (env) {
    const config = Merge(CommonConfig(env), {});

    config.mode = 'development';
    if (env.useMap) {
        config.devtool = 'cheap-module-eval-source-map';
    }

    if (env.bundleAnalyzer) {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
        config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
}
