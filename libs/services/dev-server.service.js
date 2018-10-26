const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

class DevServerService {
    onPrepare(config) {
        const wpConfig = config.webpackConfig;
        const server = new WebpackDevServer(webpack(wpConfig), wpConfig.devServer);
        server.listen(6001, 'localhost', function(err) {
            if (err) {
                console.log(err);
            }
            console.log('WebpackDevServer listening at localhost:', 6001);
        });
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    }
}

module.exports = new DevServerService();
