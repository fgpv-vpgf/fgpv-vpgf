const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
    entry: {
        'enhancedTable': './enhancedTable/index.ts'
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './[name]/[name].js'
    },

    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' },

            {
                test: /\.s?[ac]ss$/,
                use: [ MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader' ]
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "./[name]/[name].css"
        })
    ]
};