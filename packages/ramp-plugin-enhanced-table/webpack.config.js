const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => ({
    mode: argv.mode,
    devtool: argv.mode === 'development' ? 'cheap-eval-source-map' : false,
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'

        // NOTE: [monoRAMP] since this plugin is bundled directly into the RAMP core, it needs to be packaged as cjs module
        // in the future, when it's unbundled, it should be packaged to be exposed on the `window`
        // library: 'EhTable',
        // libraryExport: 'default', // assign the default export of your entry point to the library
        // libraryTarget: 'window' // assign the return value of your entry point to the window
    },
    module: {
        rules: [
            {
                test: /\.s?[ac]ss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg)$/,
                use: 'url-loader'
            }
        ]
    },
    plugins: [new MiniCssExtractPlugin()],
    resolve: {
        // if multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest.
        extensions: ['.ts', '.js', '.css', '.scss']
    },
    optimization: {
        // setting optimization.minimizer overrides the defaults provided by webpack, so make sure to also specify a JS minimizer
        // TerserJSPlugin is used by default, so we just reusing it
        // NOTE: do not extract comments or minimize for now because this plugin is included directly into the ramp-core build and it will be minimized the its parent build process
        minimize: false,
        minimizer: [new TerserJSPlugin({ extractComments: false /* true */ }), new OptimizeCSSAssetsPlugin({})]
    }
});
