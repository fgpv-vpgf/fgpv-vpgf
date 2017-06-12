const net = require('net');
const execa = require('execa');

class Server {
    constructor(opts) {

        this.opts = opts;

        this.isReady = new Promise(resolve => {
            this.isReadyResolver = resolve;
            this.isReadyInterval = setInterval(this.socketCheck.bind(this), this.opts.wait ? this.opts.wait : 3000);
        });

        this.startup();
    }

    startup () {
        console.log(`Starting ${this.opts.name}.`);
        execa(
            `node_modules/.bin/${this.opts.commands.shift()}`,
            [this.opts.commands])
        .catch(cp => 1);
    }

    kill () {
        if (/^win/.test(process.platform))
            execa(
                'scripts/protractor/killports.bat',
                [this.opts.port],
                { stdio: ['ignore', 'ignore', 'ignore'] })
            .catch(cp => 1);
        else
            execa.shell(
                `lsof -i tcp:${this.opts.port} | grep LISTEN | awk '{print $2}' | xargs kill -9`,
                { stdio: ['ignore', 'ignore', 'ignore'] })
            .catch(cp => 1);
    }

    socketCheck () {
        this.socket = new net.Socket();
        this.socket.setTimeout(1000);
        this.socket.on('error', () => this.socketError());
        this.socket.on('timeout', () => this.socketError());

        this.socket.connect(this.opts.port, 'localhost', () => {
            console.log(`${this.opts.name} started on port ${this.opts.port}`);
            clearInterval(this.isReadyInterval);
            this.isReadyResolver(true);
            this.socket.end();
        });
    }

    socketError () {
        this.socket.destroy();
    }
}

execa('node_modules/.bin/webdriver-manager', ['update']).then(cp => {
    console.log('Selenium Server update completed.');

    const seleniumServer = new Server({
        port: 4444,
        name: 'Selenium Server',
        commands: ['webdriver-manager', 'start']
    });

    const webpackServer = new Server({
        port: 6001,
        name: 'Webpack Dev Server',
        commands: ['webpack-dev-server'],
        wait: 12000
    });

    const protractorFinished = cp => {
        console.log(cp.stdout);
        console.log(cp.stderr);
        seleniumServer.kill();
        webpackServer.kill();
    };

    Promise.all([seleniumServer.isReady, webpackServer.isReady]).then(cp => {
        console.log('Protractor tests are starting.');
        execa('node_modules/.bin/protractor', ['protractor_tests/conf.js']).then(cp => {
            protractorFinished(cp);
        }).catch(cp => {
            protractorFinished(cp);
            process.exit(1);
        });
    });
}).catch(cp => console.log(cp.stdout));
