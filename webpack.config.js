const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');

const config = {
    entry: {
        'geosearch-polyd': ['babel-polyfill', './src/index.ts'],
        'geosearch': './src/index.ts'
    },

    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },

    module: {
        rules: [{
            test: /\.ts$/,
            use: [{
                loader: 'babel-loader',
                options: { presets: ['es2015', 'stage-2'], cacheDirectory: true }
            }, {
                loader: 'ts-loader'
            }]
        }]
    },

    plugins: [
        new WebpackShellPlugin({
            onBuildStart: [`node scripts/typeCompiler.js && node scripts/provinceCompiler.js`],
            onBuildEnd: [`cp -rf ${path.resolve(__dirname, 'dist')} ${path.resolve(__dirname, 'docs')}`]
        })
    ],

    resolve: {
        extensions: ['.ts', '.js' ]
    }
};

module.exports = config;