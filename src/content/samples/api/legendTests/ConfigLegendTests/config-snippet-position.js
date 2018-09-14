$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RZ.mapAdded.subscribe(mapi => {

        // make sure our legend gets populated properly before moving on with tests
        let legendPopulated = new Promise(function (resolve, reject) {
            const childrenLoaded = setInterval(() => {
                if (mapi.ui.configLegend.children.length === 2 && mapi.ui.configLegend.children[0].children.length === 4) {
                    resolve('Legend sucessfully populated');
                }
            }, 1000);
        });

        legendPopulated.then(value => {
            let legend = mapi.ui.configLegend;
            let legendItem = legend.children[1];

            $("#GetSnippet").click(function () {
                let children = '';
                legend.configSnippets.forEach(child => { children += `${child.name || child.content}` + "\n\n"; }
                );
                $("textarea#GetSnippetOut").val(children);
            });

            $("#SetSnippet").click(function () {
                legend.configSnippets = [legend.configSnippets[1]];
            });

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:60%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../test-legend-two.json');
});
