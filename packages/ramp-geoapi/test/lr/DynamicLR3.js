import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/DynamicLR3.js"

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Visibility Delay on Dynamic Layer Record');

    var config1 = {
        id: 'guts',
        name: 'Dynamic Test',
        url: 'http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_SO2/MapServer',                
        metadataUrl: 'http://www.github.com',
        layerType: 'esriDynamic',
        tolerance: 5,   
        state: {
            opacity: 1,
            visibility: true,
            boundingBox: false,
            query: true
        },
        layerEntries: [
            {
                index: 1,
                outfields: '*',                       
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true
                },
                stateOnly: false,
                name: 'Hamhocks One'
            },
            {
                index: 2,
                outfields: '*',                       
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true
                },
                stateOnly: false,
                name: 'Hamhocks Two'
            },
            {
                index: 3,
                outfields: '*',                       
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true
                },
                stateOnly: false,
                name: 'Hamhocks Three'
            },
            {
                index: 4,
                outfields: '*',                       
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true
                },
                stateOnly: false,
                name: 'Hamhocks Four'
            },
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

        // everything starts off invisible
        var leaf4proxy = layerRec.getChildProxy(4);
        var leaf3proxy = layerRec.getChildProxy(3);
        var leaf2proxy = layerRec.getChildProxy(2);
        var leaf1proxy = layerRec.getChildProxy(1);


        console.log('symbology - sb 6 elements', leaf1proxy.symbology);

        // from invisible to semi visible

        leaf2proxy.setVisibility(true);
        leaf3proxy.setVisibility(true);
        leaf4proxy.setVisibility(true);

        console.log('leaf 4 should refresh the layer');


        /*
        // from visible to invisible

        // prep the layer to be visible with two kids on
        leaf2proxy.setVisibility(true);
        leaf3proxy.setVisibility(true);

        // wait a bit for prep timers to finish
        var toTo = setTimeout(() => {
            
            clearTimeout(toTo);

            console.log('starting timed test. leaf 3 should refresh the layer');
            leaf2proxy.setVisibility(false);
            leaf3proxy.setVisibility(false);

        }, 1000);
        */

        /*
        // from visible to visible

        // prep the layer to be visible with one kid on
        leaf2proxy.setVisibility(true);

        // wait a bit for prep timers to finish
        var toTo = setTimeout(() => {
            
            clearTimeout(toTo);

            console.log('starting timed test. leaf 1 should refresh the layer');
            leaf3proxy.setVisibility(true);
            leaf1proxy.setVisibility(true);

        }, 1000);
        */
    }

});
