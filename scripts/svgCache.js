const iconCache = [
    { file: 'src/content/images/iconsets/default-icons.svg', prefix: 'default', icons: 'check logo northarrow snowman sadpanda flag crosshairs'.split(' '), isDefault: true },
    { file: 'src/content/images/iconsets/action-icons.svg', prefix: 'action', icons: 'settings_input_svideo search home history description delete settings info_outline info visibility visibility_off zoom_in zoom_out check_circle open_in_new print shopping_cart opacity swap_vert touch_app translate cached'.split(' ') },
    { file: 'src/content/images/iconsets/alert-icons.svg', prefix: 'alert', icons: 'error warning'.split(' ') },
    { file: 'src/content/images/iconsets/communication-icons.svg', prefix: 'communication', icons: 'location_on'.split(' ') },
    { file: 'src/content/images/iconsets/mdi-icons.svg', prefix: 'community', icons: 'filter filter-remove chevron-double-left chevron-double-right emoticon-sad emoticon-happy vector-square table-large map-marker-off apple-keyboard-control vector-point vector-polygon vector-polyline github help export cube-outline'.split(' ') },
    { file: 'src/content/images/iconsets/content-icons.svg', prefix: 'content', icons: 'create add remove'.split(' ') },
    { file: 'src/content/images/iconsets/editor-icons.svg', prefix: 'editor', icons: 'insert_drive_file drag_handle'.split(' ') },
    { file: 'src/content/images/iconsets/file-icons.svg', prefix: 'file', icons: 'file_upload cloud'.split(' ') },
    { file: 'src/content/images/iconsets/hardware-icons.svg', prefix: 'hardware', icons: 'keyboard_arrow_right keyboard_arrow_down keyboard_arrow_up'.split(' ') },
    { file: 'src/content/images/iconsets/image-icons.svg', prefix: 'image', icons: 'tune photo'.split(' ') },
    { file: 'src/content/images/iconsets/maps-icons.svg', prefix: 'maps', icons: 'place layers my_location map layers_clear navigation'.split(' ') },
    { file: 'src/content/images/iconsets/navigation-icons.svg', prefix: 'navigation', icons: 'menu check more_vert close more_horiz refresh arrow_back arrow_upward arrow_downward fullscreen'.split(' ') },
    { file: 'src/content/images/iconsets/social-icons.svg', prefix: 'social', icons: 'person share'.split(' ') },
    { file: 'src/content/images/iconsets/toggle-icons.svg', prefix: 'toggle', icons: 'radio_button_checked radio_button_unchecked check_box check_box_outline_blank indeterminate_check_box'.split(' ') }
];

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
            // tried xpath.find(jsonXml, `//g[@id='${icon}']`)[0] which doesn't seem to match
            // entries from community icon set, if possible try to find a more robust querying
            // method
            resolve(icons.map(icon => jsonXml.svg.defs[0].g.find(g => g['$'].id === icon) ));
        });
    });
    return res;
}

function buildCache(callback) {
    const promises = [];
    iconCache.forEach(({file, prefix, icons, isDefault}) => {
        console.log(file);
        const xmlJunk = fs.readFileSync(file);
        const filePromise = pullIcons(xmlJunk, icons)
            .then(icons => {
                const paths = icons.map(icon => builder.buildObject(icon).toString()).join('');
                const svgData = `<svg><defs>${paths}</defs></svg>`;
                fs.writeFileSync(`src/content/svgCache/${prefix}.svg`, svgData);
                if (isDefault) {
                    console.log(`    .defaultIconSet('app/${prefix}.svg')`);
                } else {
                    console.log(`    .iconSet('${prefix}', 'app/${prefix}.svg')`);
                }
            })
            .catch(e => {
                console.error(`Error processing ${file}`);
                console.error(e);
            });
        promises.push(filePromise);
    });
    Promise.all(promises).then(() => { if (callback) { callback(); } });
}


buildCache();
