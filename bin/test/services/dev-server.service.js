const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

class DevServerService {
    onPrepare(config) {
        const wpConfig = config.webpackConfig;
        wpConfig.devServer.quiet = true;
        const server = new WebpackDevServer(webpack(wpConfig), wpConfig.devServer);
        server.listen(wpConfig.devServer.port, '0.0.0.0', function (err) {
            if (err) {
                console.log(err);
            }
            console.log('WebpackDevServer listening at 0.0.0.0:', wpConfig.devServer.port);
        });
    }
}

module.exports = new DevServerService();
