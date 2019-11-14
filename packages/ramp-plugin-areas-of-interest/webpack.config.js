const path = require('path');

module.exports = (env, argv) => ({
    mode: argv.mode,
    devtool: argv.mode === 'development' ? 'cheap-eval-source-map' : false,
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: 'AreasOfInterest',
        libraryExport: 'default', // [monoRAMP] assign the default export of your entry point to the library
        libraryTarget: 'window' // [monoRAMP] assign the return value of your entry point to the window
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        // if multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest.
        extensions: ['.ts', '.js']
    }
});
