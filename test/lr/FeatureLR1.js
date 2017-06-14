import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/FeatureLR1.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Basic Testing on Feature Layer Record');

    var config1 = {
        id: 'dog',
        name: 'Feature Test',
        url: 'http://section917.cloudapp.net/arcgis/rest/services/JOSM/Oilsands_en/MapServer/2',
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

    var lods = [
        { "level": 15, "resolution": 13.229193125052918, "scale": 50000 },
        { "level": 16, "resolution": 7.9375158750317505, "scale": 30000 },
        { "level": 17, "resolution": 4.6302175937685215, "scale": 17500 } ];

    var layerRec = api.layer.createFeatureRecord(config1);
    console.log('layer PROOF ', layerRec);
    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    console.log('loading state', proxy.state);
    console.log('symbology while loading -- should be placeholder ', proxy.symbology);

    // hack to wait for layer to load

    var to = setInterval(() => {
        if (layerRec.state === 'rv-loaded') {
            clearInterval(to);
            afterLoadTests();
        }
    }, 1000);

    function afterLoadTests() {
        console.log('enhanced loaded')

        console.log('offscale test - sb false, flase', layerRec.isOffScale(20000));

        proxy.formattedAttributes.then(treats => {
            console.log('formatted attribs test - sb ? ', treats);
            console.log('attributes to details ', proxy.attributesToDetails({
                siteUUID: "pigdog",
                latitude: 33.33
            }, treats.fields));
        });

        // note using hack of layerRec._layer for zoom scales, as that thing is private
        console.log('find zoom scale test - sb level 17', layerRec.findZoomScale(lods, layerRec._layer, false));

        console.log('visible - sb true', layerRec.visible);
        console.log('proxy visible - sb true', proxy.visibility);

        proxy.setVisibility(false);
        console.log('proxy visible - sb false', proxy.visibility);

        console.log('symbology - sb 1 element', proxy.symbology);

        console.log('loaded state', proxy.state);

        console.log('geom type layer root - sb point', proxy.geometryType);
        console.log('feature count - sb 27', proxy.featureCount);
        console.log('root layer extent - sb {}', proxy.extent);

        proxy.setDefinitionQuery('test');
        console.log('definition query - sb test', layerRec._layer.getDefinitionExpression());

    }
});
