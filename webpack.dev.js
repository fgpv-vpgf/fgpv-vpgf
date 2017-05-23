const Merge         = require('webpack-merge');
const CommonConfig  = require('./webpack.common.js');

const config = Merge(CommonConfig, {
    devServer: {
        historyApiFallback: true,
        contentBase: 'build',
        port: 3000,
        stats: { colors: true }
    }
});

module.exports = config;
