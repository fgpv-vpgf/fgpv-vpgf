import geoapi from '../src/index';

/*
Change main property of geoApi's package.json to test/sample-test-layer-map-4.js
Run the serve command from within fgpv:     npm run serve -- --env.geoLocal
Open browser to http://localhost:6001/build/samples/blank.html

Note that the error "Uncaught TypeError: (0 , _geoApi2.default) is not a function" can be ignored for now, this is the the viewer failing to load geoApi which is now a test. I'll clean this up on the next update.
*/

$('head').append('<link rel="stylesheet" href="http://js.arcgis.com/3.14/esri/css/esri.css" type="text/css" />');

$('body').append(`
    <div id="map" style="height: 700px; width: 900px; margin: 0; overflow: hidden;"></div>
    <p id="mess" />
    <button type="button" oncanplay="">Test Button</button>
`);

let layerRec, map;

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    layerRec = api.layer.createDynamicRecord(getConfig());

    api.debug(true);

    layerRec = api.layer.createDynamicRecord(getConfig());
    console.log('layer PROOF ', layerRec);

    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    var eb = api.esriBundle();
    map = new eb.Map(document.getElementById('map'), { basemap: 'topo', zoom: 7, center: [-110, 55] });
    map.addLayer(layerRec._layer);
    console.log('mah map', map);

    map.on('click', clickHandler);

    // hack to wait for layer to load

    var to = setInterval(() => {
        if (layerRec.state === 'rv-loaded') {
            clearInterval(to);
            afterLoadTests();
        }
    }, 1000);

    function afterLoadTests() {
        console.log('enhanced loaded')

        var leaf4proxy = layerRec.getChildProxy(4);
        var leaf3proxy = layerRec.getChildProxy(3);
        leaf3proxy.setVisibility(true);
        leaf4proxy.setVisibility(true);
        leaf3proxy.setQuery(true);
        leaf4proxy.setQuery(true);

        console.log('featurename test - sb pigdog', leaf3proxy.getFeatureName('3', {
            SO2: 'hogleg',
            E_Province: 'doglog',
            City: 'pigdog'
        }));

    }

});


function clickHandler(clickBundle) {
    console.log('MOUSE CLICK EVENT', clickBundle);

    const opts = {
        map: map,
        clickEvent: clickBundle,
        geometry: clickBundle.mapPoint,
        width: map.width,
        height: map.height,
        mapExtent: map.extent,
    };

    const { identifyResults, identifyPromise } = layerRec.identify(opts);

    console.log('IDENTIFY RESULT', identifyResults);
    console.log('IDENTIFY PROMISE', identifyPromise);
}

function getConfig() {
    return  {
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
}
