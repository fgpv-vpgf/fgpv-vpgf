const webpack   = require('webpack');
const path      = require('path');
const fs        = require('fs');
const glob      = require("glob");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TranslationPlugin     = require('./scripts/webpack/translations_plugin.js');
const SchemaValidatorPlugin = require('./scripts/webpack/schema_validation_plugin.js');
const CopyWebpackPlugin     = require('copy-webpack-plugin');
const VersionPlugin         = require('./scripts/webpack/version_plugin.js');
const WrapperPlugin         = require('wrapper-webpack-plugin');
const CleanWebpackPlugin    = require('clean-webpack-plugin');
const HtmlWebpackPlugin     = require('html-webpack-plugin');
const WebpackShellPlugin    = require('webpack-shell-plugin');
const BundleAnalyzerPlugin  = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const babelPresets = {
    presets: ['env', 'stage-2'],
    cacheDirectory: true
}

module.exports = function (env) {

    const geoPath = env.geoLocal ?
        env.geoLocal.length > 0 ?
            env.geoLocal :
            path.resolve(__dirname, '../', 'geoApi') :
        path.resolve(__dirname, 'node_modules/geoApi');

    const config = {
        entry: {
            'rv-main': path.resolve(__dirname, 'src/app/app-loader.js')
        },

        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    include: [path.resolve(__dirname, 'src/app'), path.resolve(__dirname, 'src/plugins'), geoPath],
                    use: [{
                        loader: 'ng-annotate-loader'
                    }, {
                        loader: 'babel-loader',
                        options: babelPresets
                    }, {
                        loader: 'eslint-loader'
                    }]
                },
                {
                    test: /\.ts$/,
                    include: [path.resolve(__dirname, 'intention'), path.resolve(__dirname, 'api'), path.resolve(__dirname, 'src/app')],
                    use: [{
                        loader: 'babel-loader',
                        options: babelPresets
                    }, {
                        loader: 'ts-loader'
                    }]
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        env.hmr ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.html$/,
                    use: ['ngtemplate-loader?relativeTo=' + (path.resolve(__dirname, './src/app')), 'html-loader?minimize=false']
                },
                {
                    test: /\.(png|svg)$/,
                    use: 'url-loader'
                },
                {
                    test: /\.xsl$/,
                    use: 'raw-loader'
                }
            ]
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: "rv-styles.css"
            }),

            new webpack.ContextReplacementPlugin(
                /moment[\/\\]locale$/,
                /en|fr/
            ),

            new CopyWebpackPlugin([{
                context: 'src/content/samples',
                from: '**/*.+(json|js|css|html)',
                to: 'samples'
            },{
                from: 'src/locales/about',
                to: 'samples/about'
            },{
                from: 'src/locales/help',
                to: 'samples/help'
            },
            {
                from: 'src/polyfill/ie-polyfills.js',
                to: ''
            }]),

            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery'
            }),

            new TranslationPlugin('./src/locales/translations.csv'),

            new WrapperPlugin({
                header: fileName => /^rv-main\.js$/.test(fileName) ? fs.readFileSync('./scripts/webpack/header.js', 'utf8') : '',
                footer: fileName => /^rv-main\.js$/.test(fileName) ? fs.readFileSync('./scripts/webpack/footer.js', 'utf8') : ''
            }),

            new VersionPlugin(),

            new CleanWebpackPlugin(['build']),

            new SchemaValidatorPlugin()
        ],

        resolve: {
            modules: [path.resolve(__dirname, 'node_modules'), path.resolve(geoPath, 'node_modules'), path.resolve(__dirname, 'intention/node_modules')],
            alias: {
                XSLT: path.resolve(__dirname, 'src/content/metadata/'),
                jquery: 'jquery/src/jquery', // so webpack builds from src and not dist - optional but good to have
                api: path.resolve(__dirname, 'api/src/'),
                src: path.resolve(__dirname, 'src/'),
                app: path.resolve(__dirname, 'src/app/'),
                intention: path.resolve(__dirname, 'intention/')
            },
            extensions: ['.ts', '.js', 'css', 'scss']
        },

        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
            ignored: /node_modules/
        },

        devServer: {
            host: '0.0.0.0',
            publicPath: '/',
            historyApiFallback: {
                index: '/samples/webpack-note.html',
                verbose: true
            },
            disableHostCheck: true,
            contentBase: false,
            port: 6001,
            stats: { colors: true },
            compress: true
        }
    };

    const files = glob.sync("samples/**/*", {cwd: './src/content/', nodir: true});
    config.plugins.push(...files.map(file => {
        if (/\.tpl$/.test(file)) {
            const filePath = file.split('/');
            const fileName = filePath.pop();
            return new HtmlWebpackPlugin({
                inject: false,
                filename: `${filePath.join('/')}/${fileName.replace(/\.[^/.]+$/, '.html')}`,
                template: `src/content/${file}`,
                excludeChunks: ['ie-polyfills']
            });
        }
        }).filter(x => x)
    );

    // not supported while doing hmr - causes memory leaks and slows build time by ~40%
    if (!env.hmr && !env.inspect) {
        config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
    }

    if (env.inspect) {
        config.plugins.push(new BundleAnalyzerPlugin({openAnalyzer: false, generateStatsFile: true}));
    }

    if (env.geoLocal) {
        config.resolve.alias['geoApi$'] = geoPath;
    }

    return config;
}
