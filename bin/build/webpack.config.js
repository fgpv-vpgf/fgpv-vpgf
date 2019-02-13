const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../../');

const pluginList = {
    enhancedTable: path.join(SOURCE_PATH, 'enhancedTable'),
    areasOfInterest: path.join(SOURCE_PATH, 'areasOfInterest'),
    backToCart: path.join(SOURCE_PATH, 'backToCart'),
    coordInfo: path.join(SOURCE_PATH, 'coordInfo')
};

module.exports = function(env = {}) {
    const config = {
        mode: env.prod ? 'production' : 'development',

        entry: {},

        output: {
            path: path.join(SOURCE_PATH, './dist'),
            filename: './[name]/[name].js'
        },

        resolve: {
            extensions: ['.ts', '.js', '.css', '.scss']
        },

        module: {
            rules: [
                {
                    test: /\.s?[ac]ss$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
                },
                {
                    test: /\.(png|svg)$/,
                    use: 'url-loader'
                }
            ]
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: './[name]/[name].css'
            }),

            new CopyWebpackPlugin([
                {
                    from: '*/samples/*.+(html|json)'
                },
                {
                    from: 'bin/test/ramp'
                }
            ])
        ],

        devServer: {
            host: '0.0.0.0',
            https: !!env.https,
            disableHostCheck: true,
            port: 6001,
            stats: { colors: true },
            compress: true
        }
    };

    Object.keys(pluginList).forEach(plKey => {
        config.entry[plKey] = path.join(pluginList[plKey], 'index.ts');

        config.module.rules.push({
            test: /\.ts$/,
            include: [pluginList[plKey]],
            loader: 'ts-loader',
            options: {
                configFile: path.join(SOURCE_PATH, 'tsconfig.json')
            }
        });
    });

    return config;
};
