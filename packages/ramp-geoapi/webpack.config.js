const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
    context: ROOT,

    entry: {
        'main': 'index.js'
    },
    
    output: {
        filename: '[name].js',
        path: DESTINATION,
        library: 'ramp-geoapi',
        libraryTarget: 'commonjs2'
    },

    resolve: {
        extensions: ['.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, 'src')],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'stage-2'],
                        cacheDirectory: true
                    }
                }]
            }
        ]
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
    ],

    devtool: 'cheap-module-source-map',
    devServer: {}
};