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

            //resets to default button colour in case reset button was clicked
            document.getElementById("SetAttribute").style.backgroundColor = "";
            document.getElementById("SetAllAttributes").style.backgroundColor = "";
            document.getElementById("RemoveAttribute").style.backgroundColor = "";
            document.getElementById("RemoveAllAttributes").style.backgroundColor = "";
            document.getElementById("FetchAttributes").style.backgroundColor = "";
            document.getElementById("ClickLayer").style.backgroundColor = "";
            document.getElementById("RemoveLayer").style.backgroundColor = "";

            //resets values to unclicked in case reset button was clicked
            setAttrib = false;
            setAttribs = false;
            remOne = false;
            remAll = false;

            //set the layers being tested to a constant for ease of use
            const configLayers = layerGroup.getLayersById('0');

            //if attributes were added, fetch attribute test passes
            layerGroup.attributesAdded.subscribe(l => {
                console.log('Attributes added');
                $("#FetchAttributes").css('background-color', 'lightgreen');
            });

            // subscribe to attributes changed
            layerGroup.attributesChanged.subscribe(l => {
                console.log('Attributes changed');
                if (setAttrib === true) {
                    document.getElementById("SetAttribute").style.backgroundColor = "lightgreen";
                }

                if (setAttribs === true) {
                    document.getElementById("SetAllAttributes").style.backgroundColor = "lightgreen";
                }
            });

            //set the country of OID1
            document.getElementById("SetAttribute").onclick = function () {
                setAttrib = true;
                configLayers[0].setAttributes(1, 'Country', 'new Country');
            }

            //set multiple attributes of OID2
            document.getElementById("SetAllAttributes").onclick = function () {
                setAttrib = false;
                setAttribs = true;
                configLayers[0].setAttributes(2, {
                    Country: 'New Country',
                    OBJECTID: 2, Pipeline: 'New Pipeline',
                    Owner: 'New Owner',
                    Latitude: 31.74,
                    Longitude: -99.510534,
                    City: "New City",
                    County: "New County",
                    StateProv: "New State",
                    ToState: "New Province",
                    CountryFrom: "Newe Country",
                    ToCountry: "Newer Country",
                    TypeProd: "New Resource",
                    NumPipes: 3,
                    Diam_Inch: "5",
                    MaxOP_psi: "280000",
                    Vol_Mbpd: "2",
                    Source: "New Country: Department of Energy",
                    Period: 2017,
                    Diam_mm: "609.6",
                    MaxOP_kPa: "1930532",
                    Vol_km3d: "",
                    ZipCode: "M3J M3J",
                    Address: "",
                    FrmState: "",
                    FrmCountry: "",
                });
            }

            //subscribe to attributes removed
            layerGroup.attributesRemoved.subscribe(l => {
                console.log('Layer removed');

                //if OID5 was removed, check to see it is undefined while another attribute is still defined
                if (remOne === true) {
                    if (configLayers[0].getAttributes(5) === undefined && configLayers[0].getAttributes(10) !== undefined) {
                        document.getElementById("RemoveAttribute").style.backgroundColor = "lightgreen";
                    }
                    else {
                        document.getElementById("RemoveAttribute").style.backgroundColor = "red";
                        console.log('did not successfully remove attribute!')
                    }
                }

                //if all attributes removed, check to see previously defined attribute defined, and length of getAttributes is 0
                if (remAll === true) {
                    if (configLayers[0].getAttributes(10) === undefined) {
                        if (configLayers[0].getAttributes().length === 0) {
                            configLayers[0].removeAttributes();
                            document.getElementById("RemoveAllAttributes").style.backgroundColor = "lightgreen";
                        }
                        else {
                            document.getElementById("RemoveAllAttributes").style.backgroundColor = "red";
                            console.log('did not successfully remove attributes!')
                        }
                    }
                    else {
                        document.getElementById("RemoveAllAttributes").style.backgroundColor = "red";
                        console.log('did not successfully remove attributes!')
                    }
                }

            });

            //remove OID5
            $("#RemoveAttribute").click(function () {
                remOne = true;
                configLayers[0].removeAttributes(5);
            });

            //remove all attributes
            $("#RemoveAllAttributes").click(function () {
                remOne = false;
                remAll = true;
                configLayers[0].removeAttributes();
            });

            //subscribe to layer removed
            layerGroup.layerRemoved.subscribe(l => {
                console.log('Layer removed')
                if (layerGroup.contains(0) === false) {
                    document.getElementById("RemoveLayer").style.backgroundColor = "lightgreen";
                }
                else {
                    document.getElementById("RemoveLayer").style.backgroundColor = "red";
                    console.log('Did not successfully remove layer!')
                }
            });

            //subscribe to layer clicked
            layerGroup.click.subscribe(l => {
                console.log('Layer clicked');
                document.getElementById("ClickLayer").style.backgroundColor = "lightgreen";
            });

            //remove layer
            $("#RemoveLayer").click(function () {
                layerGroup.removeLayer(0);
            });

        });

        //resets tests
        $("#Reset").click(function () {
            layerGroup.addLayer(layerJSON);
        });

    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:85%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
