import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/DynamicLR1.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Basic Testing on Dynamic Layer Record');

    var config1 = {
        id: 'guts',
        name: 'Dynamic Test',
        url: 'http://section917.cloudapp.net/arcgis/rest/services/TestData/Nest/MapServer',
        nameField: 'siteShortName_en',
        metadataUrl: 'http://www.github.com',
        layerType: 'esriDynamic',
        tolerance: 5,
        extent: { pigdog: true},
        controls: ['visibility', 'opacity', 'boundingBox', 'query', 'data'],
        state: {
            opacity: 1,
            visibility: true,
            boundingBox: false,
            query: true
        },
        layerEntries: [
            {
                index: 0,
                outfields: '*',
                controls: ['visibility', 'opacity', 'boundingBox', 'query'],
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true
                },
                stateOnly: false,
                name: 'Hamhocks'
            },
            { 
                index: 2,
                name: 'doggguts',
                state: {
                    opacity: 0,
                    visibility: false,                            
                    query: false
                },
                stateOnly: true                       
            }
        ]
    };

    var lods = [
        { "level": 15, "resolution": 13.229193125052918, "scale": 50000 },
        { "level": 16, "resolution": 7.9375158750317505, "scale": 30000 },
        { "level": 17, "resolution": 4.6302175937685215, "scale": 17500 } ];

    var layerRec = api.layer.createDynamicRecord(config1);
    console.log('layer PROOF ', layerRec);
    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    // do early proxy attempts
    const early3 = layerRec.getChildProxy(3); // throw away result, make sure test below is good.
    console.log('leaf 3 proxy loading state ', early3.state);
    console.log('leaf 3 proxy type ', early3.layerType);
    console.log('early proxy 11 - should be placeholder', layerRec.getChildProxy(11));

    // hack to wait for layer to load

    var to = setInterval(() => {
        if (layerRec.state === 'rv-loaded') {
            clearInterval(to);
            afterLoadTests();
        }
    }, 1000);

    function afterLoadTests() {
        console.log('enhanced loaded')

        var leaf2proxy = layerRec.getChildProxy(2);
        var leaf3proxy = layerRec.getChildProxy(3);

        console.log('leaf layer type eee - sb feature', leaf3proxy.layerType);

        console.log('symbology - sb one circle svg', leaf3proxy.symbology);

        // remember, we are not using completeConfig swtich, so things get defaulted
        console.log('leaf 3 visible, should be false', leaf3proxy.visibility);
        console.log('leaf 2 visible, should be false', leaf2proxy.visibility);

        layerRec.getFormattedAttributes(2).then(fa => {
            console.log('formatted attributes child 2', fa);
        });

        layerRec.getFormattedAttributes(3).then(fa => {
            console.log('formatted attributes child 3', fa);
            console.log('attributes to details ', leaf3proxy.attributesToDetails({
                PRUID: "pigdog",
                AREA: 33.33
            }, fa.fields));
        });

        console.log('child tree', layerRec.getChildTree());

        console.log('root layer type - sb dynamic', proxy.layerType);
        console.log('leaf layer type - sb feature', leaf3proxy.layerType);

        console.log('leaf loaded state', leaf3proxy.state);
        console.log('layer loaded state', proxy.state);                

        console.log('layer proxy visible -- sb false', proxy.visibility);
        proxy.setVisibility(true);
        console.log('layer proxy visible -- sb true', proxy.visibility);
        console.log('layer visible -- sb true', layerRec.visibility);

        console.log('leaf 3 name -- sb prov_point_l1', leaf3proxy.name);
        console.log('leaf 2 name -- sb doggguts', leaf2proxy.name);
            
        console.log('geom type child 3 - sb point', leaf3proxy.geometryType);
        console.log('geom type layer root - sb undefined', proxy.geometryType);

        console.log('feature count child 2 - sb 13', leaf2proxy.featureCount);

        console.log('root layer type - sb dynamic', proxy.layerType);
        console.log('leaf layer type - sb feature', leaf3proxy.layerType);

        console.log('root layer extent - sb {}', proxy.extent);
        console.log('leaf layer extent - sb {}', leaf2proxy.extent);

        leaf3proxy.setDefinitionQuery('test');
        console.log('definition query - sb array with index 3 = test', layerRec._layer.layerDefinitions);

    }

});
