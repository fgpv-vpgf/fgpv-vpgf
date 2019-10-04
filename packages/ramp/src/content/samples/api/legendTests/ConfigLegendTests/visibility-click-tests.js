$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        // make sure our legend gets populated properly before moving on with tests
        let legendPopulated = new Promise(function (resolve, reject) {
            const childrenLoaded = setInterval(() => {
                if (mapi.ui.configLegend.children.length === 2 && mapi.ui.configLegend.children[0].children.length === 3 && mapi.ui.configLegend.children[1].children.length === 3) {
                    resolve('Legend sucessfully populated');
                }
            }, 1000);
        });


        legendPopulated.then(value => {
            let legend = mapi.ui.configLegend;
            let count = 0;
            legend.click.subscribe(val => { count++; document.getElementById('count').innerHTML = count.toString(); });

            $("#CollapseGroups").click(function () {
                legend.collapseGroups();
            });

            $("#ExpandGroups").click(function () {
                legend.expandGroups();
            });

            $("#HideAll").click(function () {
                legend.hideAll();
            });

            $("#ShowAll").click(function () {
                legend.showAll();
            });


        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:80%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-three.json');
});
