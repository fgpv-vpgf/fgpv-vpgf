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
            let legendItem = legendGroup.children[0];
            let legendInfo = mapi.ui.configLegend.children[1];

            // Item Test:
            $("#ItemReload").click(function () {
                if (legendItem._availableControls.includes('reload')) {

                    //make sure block is updated on reload
                    const oldId = legendItem.id;

                    legendItem.reload();

                    setTimeout(function () {
                        if (legendItem.id === oldId) {
                            $("#ItemReload").css('background-color', 'red');
                            console.log("LegendItem's _legendBlock did not update on reload.");
                        }
                    }, 3000);
                }
            });

            $("#ItemRemove").click(function () {
                if (legendItem._availableControls.includes('remove')) {
                    legendItem.remove();
                }
            });

            // Group Tests:
            $("#GroupReload").click(function () {
                if (legendGroup._availableControls.includes('reload')) {

                    //make sure block is updated on reload
                    const oldId = legendGroup.id;
                    legendGroup.reload();

                    setTimeout(function () {
                        if (legendGroup.id === oldId) {
                            $("#GroupReload").css('background-color', 'red');
                            console.log("LegendGroup's _legendBlock did not update on reload.");
                        }
                    }, 3000);
                }
            });

            $("#GroupRemove").click(function () {
                if (legendGroup._availableControls.includes('remove')) {
                    legendGroup.remove();
                }
            });

            // Info Tests:
            $("#InfoReload").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('reload')) {
                    $("#InfoReload").css('background-color', 'red');
                }
            });

            $("#InfoRemove").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('remove')) {
                    $("#InfoRemove").css('background-color', 'red');
                }
            });

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:80%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-one.json');
});
