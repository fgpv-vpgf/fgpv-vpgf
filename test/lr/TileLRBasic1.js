import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/TileLRBasic1.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Basic Testing on Tile Layer Record');
    

    var config1 = {
        id: 'dog',
        name: 'Tile Test',
        url: 'http://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/Graticule/MapServer',
        
        metadataUrl: 'http://www.github.com',
        layerType: 'esriTile',
        controls: ['visibility', 'opacity', 'boundingBox'],
        state: {
            opacity: 1,
            visibility: true,
            boundingBox: false,
            query: false
        }
    };

    var lods = [
        { "level": 15, "resolution": 13.229193125052918, "scale": 50000 },
        { "level": 16, "resolution": 7.9375158750317505, "scale": 30000 },
        { "level": 17, "resolution": 4.6302175937685215, "scale": 17500 } ];

    var sameSR = {
         wkid: 3978
    };
    var diffSR = {
         wkid: 102100
    };

    var layerRec = api.layer.createTileRecord(config1);
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

        console.log('visible scale set - sb 0,0', layerRec.getVisibleScales());

        console.log('queryable, should be false', proxy.query);

        console.log('proj check good, should be true', proxy.validateProjection(sameSR));
        console.log('proj check bad, should be false', proxy.validateProjection(diffSR));

/*
        layerRec.isOffScale(20000).then(offscale => {
            console.log('offscale test - sb false, flase', offscale);
        });

        // note using hack of layerRec._layer for zoom scales, as that thing is private
        console.log('find zoom scale test - sb level 17', layerRec.findZoomScale(lods, layerRec._layer, false));

        console.log('visible - sb true', layerRec.visible);

        proxy.symbology.then(sym => {
            console.log('symbology - sb 1 element', sym);
        });
        
*/

    }

});
