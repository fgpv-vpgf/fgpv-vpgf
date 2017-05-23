const path          = require('path');
const Merge         = require('webpack-merge');
const webpack       = require('webpack');
const CommonConfig  = require('./webpack.common.js');

const pkg                   = require('./package.json');
const ZipPlugin             = require('zip-webpack-plugin');

module.exports = Merge(CommonConfig, {

    output: {
        sourceMapFilename: 'source-maps/[name].map'
    },

    devtool: 'source-map',

    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),

        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false,
                screw_ie8 : true
            },
            mangle : {
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
