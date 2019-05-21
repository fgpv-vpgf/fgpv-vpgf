$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        //SETUP:
        // JSON snippet to be added as a ConfigLayer
        const layerJSON = {
          "id": "0",
          "name": "Coal",
          "layerType": "esriFeature",
          "state": {
            "boundingBox": false
          },
          "url": "http://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/18"
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

                //Click button, filter gets set to Country = Canada
                document.getElementById("FilterCountryCA").onclick = function () {
                    configLayer.setFilterSql('test',"Country = 'Canada'");
                }

                //Click button, filter gets set to Country = Mexico
                document.getElementById("FilterCountryMX").onclick = function () {
                    configLayer.setFilterSql('test',"Country = 'Mexico'");
                }

                //Click button, filter gets set to Country = United States
                document.getElementById("FilterCountryUS").onclick = function () {
                    configLayer.setFilterSql('test',"Country = 'United States'");
                }

                //Click button, filter gets reset
                document.getElementById("RemoveFilter").onclick = function () {
                    configLayer.setFilterSql('test',"");
                }

                //Click button, updates the input box to the current SQL value
                document.getElementById("FetchFilter").onclick = function () {
                    document.getElementById("FilterValue").value = configLayer.getFilterSql('test');
                }
            }

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:70%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
