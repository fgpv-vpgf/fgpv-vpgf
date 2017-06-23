import geoapi from '../../src/index';

// https://github.com/fgpv-vpgf/geoApi/wiki/Locally-Testing-GeoAPI
// to run, temporarily update package.json
// "main": "test/lr/FeatureMap3.js"

$('head').append('<link rel="stylesheet" href="http://js.arcgis.com/3.14/esri/css/esri.css" type="text/css" />');

$('body').append(`
    <div id="map" style="height: 700px; width: 900px; margin: 0; overflow: hidden;"></div>
`);

geoapi('http://js.arcgis.com/3.14/', window).then(function (api) {
    console.log('TEST PAGE - Zoom To Feature (poly) on scale dependant Feature Layer Record');

        var config1 = {
        id: 'dog',
        name: 'Feature Test',
        url: 'http://maps-cartes.dev.ec.gc.ca/arcgis/rest/services/CESI/CESI_PA/MapServer/14',
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

    var layerRec = api.layer.createFeatureRecord(config1);
    console.log('layer PROOF ', layerRec);
    var proxy = layerRec.getProxy();
    console.log('proxy PROOF ', proxy);

    var map = new api.Map(document.getElementById('map'), mapOpts);
    map.selectBasemap('baseEsriWorld');
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
        console.log('enhanced loaded');

        // zoom to a poly
        // zoom in past scale, then back to scale: 37878
        // zoom in above scale, then continue to scale 62088
        proxy.zoomToGraphic(62088, map, { x:0, y:0 }).then(() => {
            console.log('zoom to poly done');
        });

    }

});

