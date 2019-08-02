const fs            = require('fs');
const path          = require('path');
const Merge         = require('webpack-merge');
const webpack       = require('webpack');
const CommonConfig  = require('./webpack.common.js');
const SriPlugin     = require('webpack-subresource-integrity');
const pkg           = require('./package.json');
const ZipPlugin     = require('zip-webpack-plugin');
const CopyPlugin    = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = function(env) {
    return Merge(CommonConfig(env), {
        devtool: 'source-map',
        mode: 'production',

        plugins: [
            new CopyPlugin([{
                context: 'src/locales/help/default',
                from: '**/*',
                to: 'help'
            }]),

            new ZipPlugin({
                path:  path.resolve(__dirname, 'dist'),
                filename:  path.resolve(__dirname, `dist/fgpv-${pkg.version}.zip`),
                exclude: [/samples/],
            }),

            new SriPlugin({
                hashFuncNames: ['sha256', 'sha384'],
                enabled: true
            })
        ],
        optimization: {
            minimizer: [
                new TerserPlugin({
                    sourceMap: true,
                    terserOptions: {
                        compress: {
                            pure_funcs: [
                                'console.log',
                                'console.debug',
                                'console.info'
                            ]
                        }
                    }
                }),
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        map: { inline: false }
                    }
                })
            ]
        }
    });
}
