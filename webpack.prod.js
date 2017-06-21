const path          = require('path');
const Merge         = require('webpack-merge');
const webpack       = require('webpack');
const CommonConfig  = require('./webpack.common.js');
const SriPlugin     = require('webpack-subresource-integrity');

const pkg                   = require('./package.json');
const ZipPlugin             = require('zip-webpack-plugin');

module.exports = function(env) {
    return Merge(CommonConfig(env), {
        output: {
            crossOriginLoading: 'anonymous'
        },

        devtool: 'source-map',

        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    screw_ie8 : true
                },
                mangle: {
                    screw_ie8 : true
                },
                sourceMap: true
            }),

            new ZipPlugin({
                path:  path.resolve(__dirname, 'dist'),
                filename:  path.resolve(__dirname, `dist/fgpv-${pkg.version}.zip`),
                exclude: [/samples/]
            }),

            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),

            new SriPlugin({
                hashFuncNames: ['sha256', 'sha384'],
                enabled: true
            })
        ]
    });
}
