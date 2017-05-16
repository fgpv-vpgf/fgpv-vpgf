const webpack   = require('webpack');
const path      = require('path');
const fs        = require('fs');
const ExtractTextPlugin     = require('extract-text-webpack-plugin');
const CopyWebpackPlugin     = require('copy-webpack-plugin');
const HtmlWebpackPlugin     = require('html-webpack-plugin');
const CleanWebpackPlugin    = require('clean-webpack-plugin');
const TranslationPlugin     = require('./scripts/translations_plugin.js');
const WrapperPlugin         = require('wrapper-webpack-plugin');

const config = {
    entry: { main: './src/app/app-loader.js' },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
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
                loader: 'ngtemplate-loader?relativeTo=' + (path.resolve(__dirname, './src/app')) + '/!html-loader'
            },
            {
                test: /\.(png|svg)$/,
                use: 'url-loader'
            },
        ]
    },
    plugins: [
        new ExtractTextPlugin('rv-styles.css'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
        new TranslationPlugin('./src/locales/translations.csv'),
        new CopyWebpackPlugin([
            {
                context: 'src/content/samples',
                from: '**/*.json',
                to: 'samples'
            },
            {
                from: 'src/locales/about',
                to: 'samples/about'
            },
            {
                from: 'src/locales/help',
                to: 'samples/help'
            }
        ]),
        new WrapperPlugin({
            header: fileName => /\.js$/.test(fileName) ? fs.readFileSync('./scripts/header.js', 'utf8') : '',
            footer: fileName => /\.js$/.test(fileName) ? fs.readFileSync('./scripts/footer.js', 'utf8') : '',
        })
    ],
    externals: { 'TweenLite': 'TweenLite' },
    devServer: {
        historyApiFallback: true,
        contentBase: 'build',
        port: 3000,
        stats: { colors: true }
    }
};

module.exports = function() {
    // move sample pages to build with js/css injected
    getSamplePageConfig().forEach(x => {
         config.plugins.push(new HtmlWebpackPlugin(x));
    });

    config.plugins.push(new CleanWebpackPlugin(['build']));

    config.entry.polyfills = fs.readdirSync('src/polyfill').map(x => `./src/polyfill/${x}`);

    return config;
};

function getSamplePageConfig() {
    return fs.readdirSync('src/content/samples').map(file => {
        if (!/\.json$/.test(file)) {
            return {
                filename: `samples/${file.replace(/\.[^/.]+$/, '.html')}`,
                template: `src/content/samples/${file}`,
                excludeChunks: ['polyfills']
            };
        }
    }).filter(x => typeof x !== 'undefined');
}

function getPolyfills() {
    return fs.readdirSync('src/polyfill');
}
