const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const wpConfig = require('../../build/webpack.config.js')();

class DevServerService {
    onPrepare(config) {
        const wpConfig = config.webpackConfig;
        const server = new WebpackDevServer(webpack(wpConfig), wpConfig.devServer);
        server.listen(wpConfig.devServer.port, '0.0.0.0', function(err) {
            if (err) {
                console.log(err);
            }
            console.log('WebpackDevServer listening at 0.0.0.0:', wpConfig.devServer.port);
        });
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    }
}

module.exports = new DevServerService();
