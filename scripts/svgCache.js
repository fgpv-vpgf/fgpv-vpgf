const config = require('../gulp.config')();
const xjs = require('xml2js');
const fs = require('fs');
const xpath = require('xml2js-xpath');

const builder = new xjs.Builder({ rootName: 'g', renderOpts: { pretty: false }, headless: true });

function pullIcons(xmlJunk, icons) {
    const res = new Promise((resolve, reject) => {
        xjs.parseString(xmlJunk, (err, jsonXml) => {
            if (err) {
                reject(err);
            }
            resolve(icons.map(icon => xpath.find(jsonXml, `//g[@id='${icon}']`)[0]));
        });
    });
    return res;
}

function buildCache(callback) {
    console.log('Please add the following to configureIconsets in core.config.js:');
    console.log('$mdIconProvider');
    const promises = [];
    config.iconCache.forEach(({file, prefix, icons, isDefault}) => {
        const xmlJunk = fs.readFileSync(config.src+file);
        const filePromise = pullIcons(xmlJunk, icons)
            .then(icons => {
                const paths = icons.map(icon => builder.buildObject(icon).toString()).join('');
                const svgData = `<svg><defs>${paths}</defs></svg>`;
                fs.writeFileSync(`${config.svgCache}/${prefix}.svg`, svgData);
                if (isDefault) {
                    console.log(`    .defaultIconSet('app/${prefix}.svg')`);
                } else {
                    console.log(`    .iconSet('${prefix}', 'app/${prefix}.svg')`);
                }
            });
        promises.push(filePromise);
    });
    Promise.all(promises).then(() => { if (callback) { callback(); } });
}


module.exports = {
    buildCache
}
