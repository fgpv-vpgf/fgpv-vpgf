const Merge         = require('webpack-merge');
const CommonConfig  = require('./webpack.common.js');


module.exports = function (env) {
    const config = Merge(CommonConfig(env), {
        devtool: 'cheap-module-eval-source-map',
    });

    return config;
}
