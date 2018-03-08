var webpack = require('webpack');
var path = require('path');

module.exports = {
    devtool: '#inline-source-map',

    entry: ['./tests/query.spec.ts'],

    output: {
        filename: 'dist/bundle.js'
    },

    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.LoaderOptionsPlugin({
            debug: true
        })
    ],

    resolve: {
        extensions: ['.ts', '.js', '.tsx']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    }
};
