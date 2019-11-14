import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/FeatureLR2.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Duplicate legend on Feature Layer Record');

    var config1 = {
        id: 'dog',
        name: 'Feature Test',
        url: 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/NEB/Incident/MapServer/0',
        nameField: 'siteShortName_en',
        metadataUrl: 'http://www.github.com',
        layerType: 'esriFeature',
        tolerance: 5,
        controls: ['snapshot', 'visibility', 'opacity', 'boundingBox', 'query', 'data'],
        state: {
            opacity: 1,
            visibility: true,
            boundingBox: false,
            query: true,
            snapshot: false
        }
    };

    var layerRec = api.layer.createFeatureRecord(config1);
    console.log('layer PROOF ', layerRec);
    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    // hack to wait for layer to load

    var to = setInterval(() => {
        if (layerRec.state === 'rv-loaded') {
            clearInterval(to);
            afterLoadTests();
        }
    }, 1000);

    function afterLoadTests() {
        console.log('enhanced loaded')

        console.log('symbology - sb 5 elements', proxy.symbology);

    }
});
