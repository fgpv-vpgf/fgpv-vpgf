const path = require('path');

module.exports = {
    entry: './src/index.ts',

    output: {
        filename: 'geosearch.js',
        path: path.resolve(__dirname, 'dist')
    },

    module: {
        rules: [{
                test: /\.ts$/,
                use: [{
                    loader: 'babel-loader',
                    options: { presets: ['es2015', 'stage-2'], cacheDirectory: true }
                }, {
                    loader: 'ts-loader'
                }]
            }]
        }
};