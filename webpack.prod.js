const Merge         = require('webpack-merge');
const webpack       = require('webpack');
const CommonConfig  = require('./webpack.common.js');

const pkg                   = require('./package.json');
const ZipPlugin             = require('zip-webpack-plugin');
const ngAnnotatePlugin      = require('ng-annotate-webpack-plugin');

module.exports = function(env) {
    return Merge(CommonConfig(env), {
        plugins: [
            new ngAnnotatePlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    screw_ie8 : true
                },
                mangle: {
                    screw_ie8 : true
                }
            }),

            new ZipPlugin({
                path: '../dist',
                filename: `../dist/fgpv-${pkg.version}.zip`,
                exclude: [/html_samples/]
            }),

            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            })
        ]
    });
}
