$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RZ.mapAdded.subscribe(mapi => {

        //SETUP
        //set the layer group to a constant for ease of use
        const layerGroup = mapi.layers;


        // JSON snippet to be added as a ConfigLayer
        const layerJSON = {
            "id": "0",
            "name": "Liquids Pipeline",
            "layerType": "esriFeature",
            "state": {
                "visibility": true
            },
            "url": "http://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/3"
        };

        //add layer to map
        layerGroup.addLayer(layerJSON);


        //Subscribe to layer added
        layerGroup.layerAdded.subscribe(layer => {

            console.log('Layer added');

            //set the layers being tested to a constant for ease of use
            const configLayers = layerGroup.getLayersById('0');


            //ADD LAYER
            //test to see if layer added correctly
            $("#AddLayerCheck").click(function () {
                if (layerGroup.contains(0) === true) {
                    $("#AddLayerCheck").css('background-color', 'lightgreen');
                }
                else {
                    $("#AddLayerCheck").css('background-color', 'red');
                }
            });

            //ALL LAYERS
            //expect that layers are being added to the group and populating the array
            $("#AllLayersCheck").click(function () {
                if (layerGroup.allLayers.length > 0) {
                    $("#AllLayersCheck").css('background-color', 'lightgreen');
                }
                else {
                    $("#AllLayersCheck").css('background-color', 'red');
                }
            });

            //if this evaluates to true, layerGroup.getLayersByID works
            $("#LayersByID").click(function () {
                if (configLayers.length > 0) {
                    $("#LayersByID").css('background-color', 'lightgreen');
                }
                else {
                    $("#LayersByID").css('background-color', 'red');
                }
            });

            //if this evaluates to true, layerGroup.getLayersByType works
            $("#LayersByType").click(function () {
                if (layerGroup.getLayersByType(RZ.LAYERS.ConfigLayer).length > 0) {
                    $("#LayersByType").css('background-color', 'lightgreen');
                }
                else {
                    $("#LayersByType").css('background-color', 'red');
                }
            });


            $("#FetchAttributes").click(function () {
                configLayers[0].fetchAttributes();
            });

            $("#SetAttribute").click(function () {
                configLayers[0].setAttributes(1, 'Country', 'new Country');
            });

            $("#SetAllAttributes").click(function () {
                configLayers[0].setAttributes(2, { Country: 'Country is new', OBJECTID: -1 });
            });

            //test to see if layer added correctly
            if (layer.id === '0') {
                // subscribe to attributes added
                layerGroup.attributesAdded.subscribe(l => {
                    console.log('Attributes added');
                    $("#FetchAttributes").css('background-color', 'lightgreen');
                });

                layerGroup.attributesChanged.subscribe(l => {
                    console.log('Attributes changed');
                    $("button").click(function () {
                        //if a geometry added --> change disabled button to green
                        if (this.id === "SetAttribute" || this.id === "SetAllAttributes") {
                            document.getElementById(this.id).style.backgroundColor = "lightgreen";
                        }
                    });
                });
            }


        });

    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:80%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
