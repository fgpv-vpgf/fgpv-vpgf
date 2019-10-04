const path = require('path');
const DeclarationBundlerPlugin = require('./scripts/declaration.webpack-plugin');

module.exports = function(env = {}) {
    const config = {
        entry: {
            'geosearch': './src/index.ts'
        },
    
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'src')
        },

        mode: env.mode === 'prod' ? 'production' : 'development',
    
        module: {
            rules: [{
                test: /\.ts$/,
                enforce: 'pre',
                use: [{
                    loader: 'ts-loader'
                }, 'tslint-loader']
            }]
        },
    
        resolve: {
            extensions: ['.ts', '.js' ]
        },

        plugins: [
            new DeclarationBundlerPlugin({
                moduleName:'GeoSearch',
                out:'./geosearch.d.ts',
            })
        ]
    };

    return config;
}