const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '.');

const pluginList = {
    enhancedTable: path.join(SOURCE_PATH, 'enhancedTable'),
    areaOfInterest: path.join(SOURCE_PATH, 'areaOfInterest')
};

module.exports = function(env = {}) {
    const config = {
        mode: 'development',

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
            })
        ],

        devServer: {
            host: 'localhost',
            https: !!env.https,
            publicPath: '/dist/',
            contentBase: [
                path.join(__dirname, 'enhancedTable/samples'),
                path.join(__dirname, 'areaOfInterest/samples'),
                path.join(__dirname, 'libs')
            ],
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
