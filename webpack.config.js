const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '.');
const ENHANCED_TABLE_PATH = path.join(SOURCE_PATH, './enhancedTable');
const AREA_OF_INTEREST_PATH = path.join(SOURCE_PATH, './areaOfInterest');

module.exports = {
    entry: {
        enhancedTable: path.join(ENHANCED_TABLE_PATH, './index.ts'),
        areaOfInterest: path.join(AREA_OF_INTEREST_PATH, './index.ts')
    },

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
                test: /\.ts$/,
                include: [ENHANCED_TABLE_PATH],
                loader: 'ts-loader',
                options: {
                    configFile: path.join(ENHANCED_TABLE_PATH, './tsconfig.json')
                }
            },

            {
                test: /\.ts$/,
                include: [AREA_OF_INTEREST_PATH],
                loader: 'ts-loader',
                options: {
                    configFile: path.join(AREA_OF_INTEREST_PATH, './tsconfig.json')
                }
            },

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
    ]
};
