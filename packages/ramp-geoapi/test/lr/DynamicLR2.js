import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/DynamicLR2.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Raster Testing on Dynamic Layer Record');

    var config1 = {
        id: 'guts',
        name: 'Dynamic Test Child Raster',
        url: 'http://section917.cloudapp.net/arcgis/rest/services/TestData/aafc_crop_spatial_density_wheat/MapServer',                
        metadataUrl: 'http://www.github.com',
        layerType: 'esriDynamic',
        tolerance: 5,
        state: {"opacity":1,"visibility":true,"boundingBox":false,"query":true,"snapshot":false},
        layerEntries: [
            {"index":0}
        ]
    };

    var layerRec = api.layer.createDynamicRecord(config1);
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
        
        const proxyLeaf0 = layerRec.getChildProxy(0);

        console.log('proxy leaf 0', proxyLeaf0);

        console.log('feature count - sb undefined', proxyLeaf0.featureCount);
        console.log('geometry type - sb undefined', proxyLeaf0.geometryType);

        console.log('leaf 0 visible, should be false', proxyLeaf0.visibility);                   
        console.log('layer proxy visible -- sb false', proxy.visibility);                
        proxyLeaf0.setVisibility(true);
        console.log('leaf 0 visible, should be true', proxyLeaf0.visibility);                    
        console.log('layer proxy visible -- sb true', proxy.visibility);

        console.log('leaf 0 name -- sb aafc_crop_spatial_density_wheat.tif ', proxyLeaf0.name);
        console.log('leaf 0 type -- sb esriRaster ', proxyLeaf0.layerType);
        console.log('main type -- sb esriDynamic ', proxy.layerType);

        console.log('offscale test - sb false, flase', layerRec.isOffScale(0, 20000));

        console.log('leaf 0 symbology -- sb three squares ', proxyLeaf0.symbology);

    }

});
