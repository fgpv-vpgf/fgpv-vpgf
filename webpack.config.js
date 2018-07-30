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

    resolve: {
        extensions: [".ts", ".js", ".css", ".scss"]
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