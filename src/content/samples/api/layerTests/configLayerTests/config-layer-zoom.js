$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        //SETUP:
        // JSON snippet to be added as a ConfigLayer
        const layerJSON = {
            "id": "0",
            "name": "minor_cities",
            "layerType": "esriFeature",
            "state": {
                "visibility": true
            },
            "url": "http://section917.cloudapp.net/arcgis/rest/services/TestData/SupportData/MapServer/2"
        };

        //add config layer
        mapi.layers.addLayer(layerJSON);

        mapi.layers.layerAdded.subscribe(layer => {
            if (layer.id === '0') {

                // set the config layer to a constant for ease of use
                const configLayer = mapi.layers.getLayersById('0')[0];

                //checks zoom level when zoomed in to the furthest possible
                document.getElementById("CheckZoomLevel").onclick = function () {
                    if (mapi.zoom === 17) {
                        document.getElementById("CheckZoomLevel").style.backgroundColor = "#00FF00";
                        document.getElementById("CheckZoomLevel").disabled = true;
                        document.getElementById("PanToBoundary").disabled = false;
                    }
                    else {
                        console.log("Test failed (though it could be because user did not zoom enough).")
                        document.getElementById("CheckZoomLevel").style.backgroundColor = "#cd0000";
                    }
                }

                //checks zoom level when zoomed out to the furthest possible
                document.getElementById("CheckZoomLevel2").onclick = function () {
                    if (mapi.zoom === 0) {
                        document.getElementById("CheckZoomLevel2").style.backgroundColor = "#00FF00";
                        //activates zooom to scale if successful (makes sense to do this when zoomed out to 0)
                        document.getElementById("CheckZoomLevel2").disabled = true;
                        document.getElementById("ZoomToScale").disabled = false;
                    }
                    else {
                        console.log("Test failed (though it could be because user did not zoom enough).")
                        document.getElementById("CheckZoomLevel2").style.backgroundColor = "#cd0000";
                    }
                }

                //zooms out so that the bounding box is visible
                document.getElementById("PanToBoundary").onclick = function () {

                    // turn on the bounding box for the layer whose boundary is being panned to and then pan to layer boundary
                    configLayer.panToBoundary();
                    if (mapi.zoom === 3) {
                        document.getElementById("PanToBoundary").style.backgroundColor = "#00FF00";
                        document.getElementById("PanToBoundary").disabled = true;
                    }
                    else {
                        document.getElementById("PanToBoundary").style.backgroundColor = "#cd0000";
                        console.log("Test failed because map wasn't changed to correct zoom level (3).");
                    }
                }

                // zoom to layer scale
                document.getElementById("ZoomToScale").onclick = function () {
                    configLayer.zoomToScale();

                    //takes couple of milliseconds for mapi.zoom to update (otherwise always fails this test because returns 0)
                    window.setTimeout(function () {
                        if (mapi.zoom === 8) {
                            document.getElementById("ZoomToScale").style.backgroundColor = "#00FF00";
                            document.getElementById("ZoomToScale").disabled = true;
                            document.getElementById("ZoomToScale2").disabled = false;
                        }
                        else {
                            document.getElementById("ZoomToScale").style.backgroundColor = "#cd0000";
                            console.log('Map zoom level not >=6 on zoom to scale');
                        }
                    }, 500);
                }

                //check if zoom level remains the same if already zoomed to scale previously
                document.getElementById("ZoomToScale2").onclick = function () {
                    const prev = mapi.zoom;
                    configLayer.zoomToScale();
                    //takes couple of milliseconds for mapi.zoom to update (so wait to see if it actually didn't update)
                    window.setTimeout(function () {
                        if (mapi.zoom === prev) {
                            document.getElementById("ZoomToScale2").style.backgroundColor = "#00FF00";
                            document.getElementById("ZoomToScale2").disabled = true;
                        }
                        else {
                            document.getElementById("ZoomToScale2").style.backgroundColor = "#cd0000";
                            console.log('Map zoom level not >=6 on zoom to scale');
                        }
                    }, 500);
                }

                //Resets tests
                document.getElementById("Reset").onclick = function () {
                    document.getElementById("CheckZoomLevel").style.backgroundColor = "";
                    document.getElementById("CheckZoomLevel").disabled = false;
                    document.getElementById("CheckZoomLevel2").style.backgroundColor = "";
                    document.getElementById("CheckZoomLevel2").disabled = false;
                    document.getElementById("PanToBoundary").style.backgroundColor = "";
                    document.getElementById("PanToBoundary").disabled = true;
                    document.getElementById("ZoomToScale").style.backgroundColor = "";
                    document.getElementById("ZoomToScale").disabled = true;
                    document.getElementById("ZoomToScale2").style.backgroundColor = "";
                    document.getElementById("ZoomToScale2").disabled = true;
                }

            }

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:70%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
