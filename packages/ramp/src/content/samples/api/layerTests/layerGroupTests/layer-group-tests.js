$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        //SETUP
        //set the layer group to a constant for ease of use
        const layerGroup = mapi.layers;
        let setAttrib;
        let setAttribs;
        let remOne;
        let remAll;


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

            //test to see if layer added correctly
            $("#AddLayerCheck").click(function () {
                if (layerGroup.contains(0) === true) {
                    $("#AddLayerCheck").css('background-color', 'lightgreen');
                }
                else {
                    $("#AddLayerCheck").css('background-color', 'red');
                    console.log("Layer group doesn't contain Layer 0");
                }
            });

            //expect that layers are being added to the group and populating the array
            $("#AllLayersCheck").click(function () {
                if (layerGroup.allLayers.length > 0) {
                    $("#AllLayersCheck").css('background-color', 'lightgreen');
                }
                else {
                    $("#AllLayersCheck").css('background-color', 'red');
                    console.log("allLayers array is not populated");
                }
            });

            //getLayersByID test
            $("#LayersByID").click(function () {
                //if this evaluates to true, layerGroup.getLayersByID works
                if (configLayers.length > 0) {
                    $("#LayersByID").css('background-color', 'lightgreen');
                }
                else {
                    $("#LayersByID").css('background-color', 'red');
                    console.log("getLayersByID probably doesn't work");
                }
            });

            //getLayersByType test
            $("#LayersByType").click(function () {
                //if this evaluates to true, layerGroup.getLayersByType works
                if (layerGroup.getLayersByType(RAMP.LAYERS.ConfigLayer).length > 0) {
                    $("#LayersByType").css('background-color', 'lightgreen');
                }
                else {
                    $("#LayersByType").css('background-color', 'red');
                    console.log("getLayersByType probably doesn't work");
                }
            });

            //resets tests
            $("#Reset").click(function () {
                $("#LayersByType").css('background-color', '');
                $("#LayersByID").css('background-color', '');
                $("#AllLayersCheck").css('background-color', '');
                $("#AddLayerCheck").css('background-color', '');
            });

        });

    });

    $('#main').append(`
        <div id="fgpmap" style="height:600px; width:85%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
