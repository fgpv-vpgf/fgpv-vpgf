
const V1_SCHEMA_VERSIONS = '1.0 1.1 1.2 1.3 1.4 1.5 1.6'.split(' ');

function layerNodeUpgrade(layerCfg) {

    // jscs:disable maximumLineLength
    const layerDirectCopy = 'id name url layerType metadataUrl catalogueUrl extent nameField tolerance featureInfoMimeType legendMimeType'.split(' ');
    const entryCopy = 'id index name outfields'.split(' ');
    const stateCopy = 'opacity visibility boundingBox query snapshot'.split(' ');
    const controlsCopy = 'opacity visibility boundingBox query snapshot metadata boundaryZoom refresh reload remove settings data'.split(' ');
    // jscs:enable maximumLineLength

    const copySettings = (src, dst) => {
        const stateFields = stateCopy.filter(key => src.options && src.options[key] && src.options[key].hasOwnProperty('value'));
        if (stateFields.length > 0) {
            dst.state = {};
            stateFields.forEach(key =>
                (dst.state[key] = src.options[key].value));
        }
        const controls = controlsCopy.filter(key => !src.options || !src.options.hasOwnProperty(key) || !src.options[key].hasOwnProperty('enabled') || src.options[key].enabled);
        if (controls.length !== controlsCopy.length) {
            dst.controls = controls;
        }
    };

    const l = {};
    layerDirectCopy.filter(key => layerCfg.hasOwnProperty(key)).forEach(key =>
        (l[key] = layerCfg[key]));
    copySettings(layerCfg, l);
    if (layerCfg.hasOwnProperty('layerEntries')) {
        l.layerEntries = layerCfg.layerEntries.map(ole => {
            const le = {};
            copySettings(ole, le);
            entryCopy.filter(key => ole.hasOwnProperty(key)).forEach(key =>
                (le[key] = ole[key]));
            return le;
        });
    }
    return l;
}

// eslint-disable-next-line max-statements, complexity
function oneToTwo(cfg) {
    // FIXME: needs update as schema has changed: legendIsOpen moved to legend section in ui
    const topToUi = 'theme logoUrl navBar sideMenu restrictNavigation legendIsOpen'.split(' ');
    const topToService = 'googleApiKey export search'.split(' ');
    const baseMapDirectCopy =
        'id name description typeSummary altText thumbnailUrl layers attribution zoomLevels'.split(' ');

    const namingThings = {
        4326: 'Mercator',
        102100: 'Web Mercator',
        3857: 'Web Mercator',
        3978: 'Lambert',
        3979: 'Lambert'
    };

    let res = { ui: {}, version: '2.0' };
    if (cfg.language) {
        res.language = cfg.language;
    }
    if (cfg.services) {
        res.services = JSON.parse(JSON.stringify(cfg.services));
    }
    if (cfg.map) {
        res.map = JSON.parse(JSON.stringify(cfg.map));
    }
    if (cfg.legend) {
        res.map.legend = cfg.legend;
    }
    if (cfg.layers) {
        res.map.layers = cfg.layers.map(l => layerNodeUpgrade(l));
    }

    const extentMap = {};
    res.map.extentSets.forEach(es => {
        extentMap[es.id] = { id: es.id };
        'default full maximum'.split(' ').filter(key => es.hasOwnProperty(key)).forEach(key => {
            extentMap[es.id][key] = {
                xmax: es[key].xmax,
                xmin: es[key].xmin,
                ymax: es[key].ymax,
                ymin: es[key].ymin
            };
            extentMap[es.id].spatialReference = es[key].spatialReference;
        });
        console.info(extentMap[es.id]);
    });
    res.map.extentSets = Object.keys(extentMap).map(key => extentMap[key]);

    const lodMap = {};
    res.map.lodSets = res.map.lods;
    delete res.map.lods;
    res.map.lodSets.forEach(l =>
        (lodMap[l.id] = l));

    const tileSchemaMap = {};
    const tsUsed = []; // set of schemas which have a basemap under them
    Object.keys(extentMap).forEach(eid => Object.keys(lodMap).forEach(lid => {
        const ts = {};
        const tsId = eid + '#' + lid;
        ts.id = tsId;
        const wkid = extentMap[eid].spatialReference.wkid;
        if (namingThings.hasOwnProperty(String(wkid))) {
            ts.name = namingThings[String(wkid)] + ' Maps';
        } else {
            ts.name = ts.id;
        }
        ts.extentSetId = eid;
        ts.lodSetId = lid;
        tileSchemaMap[tsId] = ts;
    }));

    if (cfg.baseMaps) {
        res.map.baseMaps = cfg.baseMaps.map(obm => {
            const bm = {};
            baseMapDirectCopy.filter(key => obm.hasOwnProperty(key)).forEach(key =>
                (bm[key] = obm[key]));
            const tsId = obm.extentId + '#' + obm.lodId;
            if (!tileSchemaMap.hasOwnProperty(tsId)) {
                console.error('Tile schema was not converted');
            }
            bm.tileSchemaId = tsId;
            tsUsed.push(tsId);
            return bm;
        });
    }
    res.map.tileSchemas = tsUsed.map(key => tileSchemaMap[key]);
    // console.log(util.inspect(res.map.tileSchemas, { depth: 2}))

    topToUi.filter(key => cfg.hasOwnProperty(key)).forEach(key =>
        (res.ui[key] = cfg[key]));

    topToService.filter(key => cfg.hasOwnProperty(key)).forEach(key =>
        (res.services[key] = cfg[key]));

    // topToMap = 'legend layers'.split(' ');
    // console.log(util.inspect(res, { depth: 2}))
    return res;
}

function isV1Schema(versionString) {
    return V1_SCHEMA_VERSIONS.indexOf(versionString) > -1;
}

const exportCollection = { oneToTwo, layerNodeUpgrade, V1_SCHEMA_VERSIONS, isV1Schema };

if (typeof module === 'object' && module.exports) {
    module.exports = exportCollection;
} else if (typeof angular === 'object') {
    angular.module('app.core').factory('schemaUpgrade', () => exportCollection);
}
