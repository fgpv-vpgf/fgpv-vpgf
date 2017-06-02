import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/DynamicMap1.js"

$('head').append('<link rel="stylesheet" href="http://js.arcgis.com/3.14/esri/css/esri.css" type="text/css" />');

$('body').append(`
    <div id="map" style="height: 700px; width: 900px; margin: 0; overflow: hidden;"></div>
`);

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Map Testing on Dynamic Layer Record - visibility, opacity, zoom');

    var config1 = {
        id: 'guts',
        name: 'Dynamic Test',
        url: 'http://section917.cloudapp.net/arcgis/rest/services/TestData/Nest/MapServer',
        nameField: 'siteShortName_en',
        metadataUrl: 'http://www.github.com',
        layerType: 'esriDynamic',
        tolerance: 5,
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
                    visibility: true,                            
                    query: false
                },
                stateOnly: true
            }
        ]
    };
    
    var mapOpts = {
        extent: {
            xmax: -5007771.626060756,
            xmin: -16632697.354854,
            ymax: 10015875.184845109,
            ymin: 5022907.964742964,
            spatialReference: {
                wkid: 102100,
                latestWkid: 3857
            }
        },
        lods: [
            { level: 0, resolution: 19567.87924099992, scale: 73957190.948944 },
            { level: 1, resolution: 9783.93962049996, scale: 36978595.474472 },
            { level: 2, resolution: 4891.96981024998, scale: 18489297.737236 },
            { level: 3, resolution: 2445.98490512499, scale: 9244648.868618 },
            { level: 4, resolution: 1222.992452562495, scale: 4622324.434309 },
            { level: 5, resolution: 611.4962262813797, scale: 2311162.217155 },
            { level: 6, resolution: 305.74811314055756, scale: 1155581.108577 },
            { level: 7, resolution: 152.87405657041106, scale: 577790.554289 },
            { level: 8, resolution: 76.43702828507324, scale: 288895.277144 },
            { level: 9, resolution: 38.21851414253662, scale: 144447.638572 },
            { level: 10, resolution: 19.10925707126831, scale: 72223.819286 },
            { level: 11, resolution: 9.554628535634155, scale: 36111.909643 },
            { level: 12, resolution: 4.77731426794937, scale: 18055.954822 },
            { level: 13, resolution: 2.388657133974685, scale: 9027.977411 },
            { level: 14, resolution: 1.1943285668550503, scale: 4513.988705 },
            { level: 15, resolution: 0.5971642835598172, scale: 2256.994353 },
            { level: 16, resolution: 0.29858214164761665, scale: 1128.497176 },
            { level: 17, resolution: 0.14929107082380833, scale: 564.248588 },
            { level: 18, resolution: 0.07464553541190416, scale: 282.124294 },
            { level: 19, resolution: 0.03732276770595208, scale: 141.062147 },
            { level: 20, resolution: 0.01866138385297604, scale: 70.5310735 }
        ],
        basemaps: [
            {
                id: "baseEsriWorld",
                name: "World Imagery",
                description: "World Imagery provides one meter or better satellite and aerial imagery in many parts of the world and lower resolution satellite imagery worldwide.",
                altText: "altText - World Imagery",
                layers: [
                {
                    id: "World_Imagery",
                    layerType: "esriFeature",
                    url: "http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer"
                }
                ],
                tileSchemaId: "EXT_ESRI_World_AuxMerc_3857#LOD_ESRI_World_AuxMerc_3857"
            }
        ]
    };

    var layerRec = api.layer.createDynamicRecord(config1);
    console.log('layer PROOF ', layerRec);
    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    var map = new api.Map(document.getElementById('map'), mapOpts);
    map.addLayer(layerRec._layer);
    console.log('mah map', map);

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
        
        // remember, we are not using completeConfig swtich, so things get defaulted
        console.log('leaf 3 visible, should be false', leaf3proxy.visibility);
        console.log('leaf 2 visible, should be false', leaf2proxy.visibility);
        
        console.log('layer proxy visible -- sb false', proxy.visibility);
        
        leaf3proxy.setVisibility(true);
        console.log('layer proxy visible -- sb true', proxy.visibility);
        console.log('leaf 3 visible -- sb true', leaf3proxy.visibility);
    
        leaf3proxy.zoomToBoundary(map);
        leaf3proxy.zoomToScale(map, mapOpts.lods, true);

    }

});

