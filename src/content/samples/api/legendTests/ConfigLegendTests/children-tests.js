$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        // make sure our legend gets populated properly before moving on with tests
        let legendPopulated = new Promise(function (resolve, reject) {
            const childrenLoaded = setInterval(() => {
                if (mapi.ui.configLegend.children.length === 3) {
                    resolve('Legend sucessfully populated');
                }
            }, 1000);
        });

        legendPopulated.then(value => {
            let legend = mapi.ui.configLegend;
            let legendItem = legend.children[1];

            $("#Children").click(function () {
                let children = '';
                let count = 0;
                legend.children.forEach(child => { count += 1; children += `${count}. `+ child.name + "\n"; }
                );
                $("textarea#ChildrenOut").val(children);
            });

            $("#ByID").click(function () {
                let node = legend.getById('node_1');
                $("textarea#ByIDOut").val("ID: "+ node.id + "\nName: " + node.name + "\nType: " + node.type);
            });


            $("#Position").click(function () {
                legend.updateLayerPosition(legendItem, 0);
                if (legendItem === legend.children[0]) {
                    legendItem = legend.children[1];
                }
                else{
                    legendItem = legend.children[0];
                }
            });

        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:60%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-four.json');
});
