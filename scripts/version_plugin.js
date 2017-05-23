const pkg           = require('../package.json');
const ConcatSource  = require('webpack-sources').ConcatSource;

const version = {};

function version_plugin(options) {
    const packageVersion = pkg.version.split('.');
    version.major = packageVersion[0];
    version.minor = packageVersion[1];
    version.patch = packageVersion[2];
    version.gitHash = require('child_process').execSync('git rev-parse HEAD').toString().trim();
}

version_plugin.prototype.apply = function(compiler) {
    compiler.plugin('compilation', compilation => {
        compilation.plugin('optimize-chunk-assets', (chunks, done) => {
            chunks.forEach(chunk => {
                chunk.files.forEach(filename => {
                    if (/main\./.test(filename)) {
                        const content = `var RVersion = ${JSON.stringify(version)};`;
                        compilation.assets[filename] = new ConcatSource(content, compilation.assets[filename]);
                    }
                });
            });
            done();
        });
    });
}

module.exports = version_plugin;
