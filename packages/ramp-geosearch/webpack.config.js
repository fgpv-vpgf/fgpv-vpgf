const path = require('path');
const DeclarationBundlerPlugin = require('./scripts/declaration.webpack-plugin');

module.exports = function(env, argv) {
    const config = {
        mode: argv.mode,
        devtool: argv.mode === 'development' ? 'cheap-eval-source-map' : false,
        entry: './src/index.ts',
    
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'index.js',
            // NOTE: [monoRAMP] since this plugin is bundled directly into the RAMP core, it needs to be packaged as cjs module
            libraryTarget: 'commonjs2'
        },

        module: {
            rules: [{
                test: /\.ts$/,
                enforce: 'pre',
                use: [{
                    loader: 'ts-loader'
                }, 'eslint-loader'],
                exclude: /node_modules/
            }]
        },
    
        resolve: {
            extensions: ['.ts', '.js' ]
        },

        /* plugins: [
            new DeclarationBundlerPlugin({
                moduleName:'GeoSearch',
                out:'./geosearch.d.ts',
            })
        ] */
    };

    return config;
}