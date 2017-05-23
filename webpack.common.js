const webpack   = require('webpack');
const path      = require('path');
const fs        = require('fs');
const ExtractTextPlugin     = require('extract-text-webpack-plugin');
const TranslationPlugin     = require('./scripts/translations_plugin.js');
const CopyWebpackPlugin     = require('copy-webpack-plugin');
const VersionPlugin         = require('./scripts/version_plugin.js');
const WrapperPlugin         = require('wrapper-webpack-plugin');
const CleanWebpackPlugin    = require('clean-webpack-plugin');
const HtmlWebpackPlugin     = require('html-webpack-plugin');

const config = {
    entry: {
        ['rv-main']: './src/app/app-loader.js'
    },

    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|polyfill)/,
                loader: 'babel-loader',
                query: { presets: ['es2015'] }
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
                use: ['ngtemplate-loader?relativeTo=' + (path.resolve(__dirname, './src/app')), 'html-loader?minimize=false']
            },
            {
                test: /\.(png|svg)$/,
                use: 'url-loader'
            },
        ]
    },

    plugins: [

         new CopyWebpackPlugin([{
            context: 'src/content/samples',
            from: '**/*.json',
            to: 'html_samples'
        },{
            from: 'src/locales/about',
            to: 'html_samples/about'
        },{
            from: 'src/locales/help',
            to: 'html_samples/help'
        }]),

        new ExtractTextPlugin('rv-styles.css'),

        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),

        new TranslationPlugin('./src/locales/translations.csv'),

        new WrapperPlugin({
            header: fileName => /\.js$/.test(fileName) ? fs.readFileSync('./scripts/header.js', 'utf8') : '',
            footer: fileName => /\.js$/.test(fileName) ? fs.readFileSync('./scripts/footer.js', 'utf8') : '',
        }),

        new VersionPlugin(),

        new CleanWebpackPlugin(['build'])
    ],

    externals: { 'TweenLite': 'TweenLite' }
};

config.entry['ie-polyfills'] = fs.readdirSync('src/polyfill').map(x => `./src/polyfill/${x}`);
config.plugins.push(...htmlInjectPlugins());

module.exports = config;

function htmlInjectPlugins() {
    return fs.readdirSync('src/content/samples').map(file => {
        if (!/\.json$/.test(file)) {
            return new HtmlWebpackPlugin({
                filename: `html_samples/${file.replace(/\.[^/.]+$/, '.html')}`,
                template: `src/content/samples/${file}`,
                excludeChunks: ['ie-polyfills']
            });
        }
    }).filter(x => typeof x !== 'undefined');
}
