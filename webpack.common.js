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


module.exports = function (env) {

    const config = {
        entry: {
            'rv-main': path.resolve(__dirname, 'src/app/app-loader.js'),
            'ie-polyfills': path.resolve(__dirname, 'src/polyfill/polyfill-loader.js')
        },

        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    include: [path.resolve(__dirname, 'src/app'), path.resolve(__dirname, 'src/plugins')],
                    use: [{
                        loader: 'ng-annotate-loader'
                    }, {
                        loader: 'babel-loader',
                        options: { presets: ['es2015', 'stage-2'], cacheDirectory: true }
                    }, {
                        loader: 'eslint-loader'
                    }]
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
                }
            ]
        },

        plugins: [

            new webpack.PrefetchPlugin(path.resolve(__dirname, 'src/app/app-loader.js')),

            new CopyWebpackPlugin([{
                context: 'src/content/samples',
                from: '**/*.json',
                to: 'samples'
            },{
                from: 'src/locales/about',
                to: 'samples/about'
            },{
                from: 'src/locales/help',
                to: 'samples/help'
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
                footer: fileName => /\.js$/.test(fileName) ? fs.readFileSync('./scripts/footer.js', 'utf8') : ''
            }),

            new VersionPlugin(),

            new CleanWebpackPlugin(['build'])
        ],

        externals: { 'TweenLite': 'TweenLite' },

        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
            ignored: /node_modules/
        },

        devServer: {
            host: '0.0.0.0',
            publicPath: '/build/',
            historyApiFallback: true,
            port: 6001,
            stats: { colors: true },
            compress: true
        }
    };

    config.plugins.push(...htmlInjectPlugins());

    if (env.inspect) {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
        config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
}

function htmlInjectPlugins() {
    return fs.readdirSync('src/content/samples').map(file => {
        if (!/\.json$/.test(file)) {
            return new HtmlWebpackPlugin({
                filename: `samples/${file.replace(/\.[^/.]+$/, '.html')}`,
                template: `src/content/samples/${file}`,
                excludeChunks: ['ie-polyfills']
            });
        }
    }).filter(x => typeof x !== 'undefined');
}
