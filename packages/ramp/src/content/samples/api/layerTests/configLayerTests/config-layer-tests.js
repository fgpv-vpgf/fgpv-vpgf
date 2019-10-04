$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        //SETUP:
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

        let setAttrib = false;
        let setAttribs = false;
        let remAttrib = false;
        let remAttribs = false;

        //add config layer to map
        mapi.layers.addLayer(layerJSON);

        mapi.layers.layerAdded.subscribe(layer => {
            let attributesGone = false;
            if (layer.id === '0') {
                // set the config layer to a constant for ease of use
                const configLayer = mapi.layers.getLayersById('0')[0];

                // subscribe to name changed
                configLayer.nameChanged.subscribe(l => {
                    console.log('Name changed');

                    if ($("#ChangeName").text() == "to 'Liquids Pipeline'") {
                        if (configLayer.name == "Liquids Pipeline") {
                            $("#ChangeName").text("to 'new Name'");
                        }
                    } else {
                        if (configLayer.name == "new Name") {
                            $("#ChangeName").text("to 'Liquids Pipeline'");
                        }
                    }

                });

                //Click button, change name
                document.getElementById("ChangeName").onclick = function () {
                    if (configLayer.name == "Liquids Pipeline") {
                        configLayer.name = "new Name";
                    }
                    else {
                        configLayer.name = "Liquids Pipeline";
                    }
                }

                // subscribe to opacity changed
                configLayer.opacityChanged.subscribe(l => {
                    console.log('Opacity changed');

                    if ($("#ChangeOpacity").text() == "to 0.3") {
                        if (configLayer.opacity === 0.3) {
                            $("#ChangeOpacity").text("to 1.0");
                        }
                    }
                    else {
                        if (configLayer.opacity === 1) {
                            $("#ChangeOpacity").text("to 0.3");
                        }
                    }
                });

                //Click button, opacity changes
                document.getElementById("ChangeOpacity").onclick = function () {
                    if (configLayer.opacity === 1) {
                        configLayer.opacity = 0.3;
                    }
                    else {
                        configLayer.opacity = 1;
                    }
                }

                // subscribe to visibility changed
                configLayer.visibilityChanged.subscribe(l => {
                    console.log('Visibility changed');

                    if ($("#ChangeVisibility").text() == "Make Visible") {
                        if (configLayer.visibility == true) {
                            $("#ChangeVisibility").text("Make Invisible");
                        }
                    } else {
                        if (configLayer.visibility == false) {
                            $("#ChangeVisibility").text("Make Visible");
                        }
                    }

                });

                //click button, visibility changes
                document.getElementById("ChangeVisibility").onclick = function () {
                    if (configLayer.visibility == false) {
                        configLayer.visibility = true;
                    }
                    else {
                        configLayer.visibility = false;
                    }
                }
            }

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:70%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
