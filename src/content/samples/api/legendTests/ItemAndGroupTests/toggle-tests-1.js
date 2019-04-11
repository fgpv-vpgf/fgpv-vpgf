$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        // make sure our legend gets populated properly before moving on with tests
        let legendPopulated = new Promise(function (resolve, reject) {
            const childrenLoaded = setInterval(() => {
                if (mapi.ui.configLegend.children.length === 2 && mapi.ui.configLegend.children[0].children.length === 3) {
                    resolve('Legend sucessfully populated');
                }
            }, 1000);
        });

        legendPopulated.then(value => {
            let legendGroup = mapi.ui.configLegend.children[0];
            let legendItem = legendGroup.children[1];
            let legendInfo = mapi.ui.configLegend.children[1];

            // Item Tests:
            $("#ItemToggleMeta").click(function () {
                if (legendItem._availableControls.includes('metadata')) {
                    legendItem.toggleMetadata();
                }
            });

            $("#ItemToggleSettings").click(function () {
                if (legendItem._availableControls.includes('settings')) {
                    legendItem.toggleSettings();
                }
            });


            $("#ItemToggleData").click(function () {
                if (legendItem._availableControls.includes('data')) {
                    console.log(legendItem.toggleDataTable);
                    legendItem.toggleDataTable();
                }
            });

            // Group Tests:
            $("#GroupToggleMeta").click(function () {
                if (legendGroup._availableControls.includes('metadata')) {
                    legendGroup.toggleMetadata();
                }
            });

            $("#GroupToggleSettings").click(function () {
                if (legendGroup._availableControls.includes('settings')) {
                    legendGroup.toggleSettings();
                }
            });


            $("#GroupToggleData").click(function () {
                if (legendGroup._availableControls.includes('data')) {
                    legendGroup.toggleDataTable();
                }
            });


            // InfoSection Tests:
            $("#InfoToggleMeta").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('metadata')) {
                    $('#InfoToggleMeta').css('background-color', 'red');
                    console.log('Metadata is an available control for an InfoSection.');
                }
            });

            $("#InfoToggleSettings").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('settings')) {
                    $('#InfoToggleSettings').css('background-color', 'red');
                    console.log('Settings is an available control for an InfoSection.');
                }
            });

            $("#InfoToggleData").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('data')) {
                    $('#InfoToggleData').css('background-color', 'red');
                    console.log('Datatable is an available control for an InfoSection.');
                }
            });
        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:60%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-two.json');
});
