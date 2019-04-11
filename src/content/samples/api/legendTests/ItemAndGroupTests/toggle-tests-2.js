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

            // Item Test:
            $("#ItemToggleSymb").click(function () {
                if (legendItem._availableControls.includes('symbology')) {
                    legendItem.toggleSymbologyStack();
                }
            });


            // Group Tests:
            $("#GroupToggleGroup").click(function () {
                if (typeof legendGroup._legendBlock.expanded !== 'undefined') {
                    legendGroup.toggleExpanded();
                }
            });

            // InfoSection Tests:
            $("#InfoToggleSymb").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('symbology')) {
                    $('#InfoToggleSymb').css('background-color', 'red');
                    console.log('Symbology is an available control for an InfoSection.');
                }
            });

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:80%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-two.json');
});
