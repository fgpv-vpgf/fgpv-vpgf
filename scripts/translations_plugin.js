const ConcatSource = require('webpack-sources').ConcatSource;
const csv = require('csvtojson');

class TranslationPlugin {

    constructor (csvPath) {
        this.translations = {};
        this.csvPath = csvPath;
    }

    apply (compiler) {
        compiler.plugin('compilation', (compilation) => {
            compilation.plugin('optimize-chunk-assets', (chunks, done) => {
                const sourceChunks = [];
                chunks.forEach(chunk => {
                    chunk.files.forEach(filename => {
                        if (/main\./.test(filename)) {
                            sourceChunks.push(filename);
                        }
                    });
                });

                this.init(sourceChunks, compilation, done);
            });
        });
    }

    init (srcChunks, compilation, done) {
        csv({
            noheader: true,
            ignoreColumns: [0]
        })
        .fromFile(this.csvPath)
        .on('csv', (row, rowNum) => {
            if (rowNum === 0) {
                row.shift();
                row.forEach(l => this.translations[l] = {});
            } else {
                this.flatten(row);
            }
        })
        .on('done', () => {
            const content = `var AUTOFILLED_TRANSLATIONS = ${JSON.stringify(this.translations)};`;
            srcChunks.forEach(c => {
                compilation.assets[c] = new ConcatSource(content, compilation.assets[c]);
            });
            done();
        });
    }

    flatten (row) {
        const key = row.shift();
        Object.keys(this.translations).map(l => this.translations[l]).forEach( (l, i) => {
            const value = row[i];
            let lastPlace = l;
            key.split('.').forEach( (k, i, a) => {
                if (i === a.length - 1) { // last key - setting the value
                    lastPlace[k] = value;
                } else {
                    lastPlace[k] = lastPlace[k] ? lastPlace[k] : {}; // set as empty if not defined
                    lastPlace = lastPlace[k]; // move placeholder forward
                }
            });
        });
    }
}

module.exports = TranslationPlugin;
