var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TranslationPlugin = require('./scripts/translations_plugin.js');

module.exports = function(env) {
    const config = {
        entry: {
            main: './src/app/app-loader.js'
        },

        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'build/lib'),
            publicPath: '/lib'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015']
                    }
                },

                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        use: ['style-loader', 'css-loader']
                    })
                },

                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: ['css-loader', 'resolve-url-loader', 'sass-loader?sourceMap']
                    })
                },

                {
                    test: /\.html$/,
                    loader: 'ngtemplate-loader?relativeTo=' + (path.resolve(__dirname, './src/app')) + '/!html-loader'
                },

                {
                    test: /\.(png|svg)$/,
                    use: 'url-loader'
                }
            ]
        },
        plugins: [
            new CopyWebpackPlugin([{
                // context: 'src/content/samples',
                // from: '*.json',
                from: 'src/content/samples',
                to: '../samples'
            }]),

            new ExtractTextPlugin('styles.css'),

            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery'
            }),

            new TranslationPlugin('./src/locales/translations.csv'),

            new CleanWebpackPlugin(['build'])
        ],

        externals: {
            'TweenLite': 'TweenLite'
        }
    };

    return config;
};
