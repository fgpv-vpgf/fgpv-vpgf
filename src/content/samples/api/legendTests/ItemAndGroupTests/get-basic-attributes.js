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
            $("#ItemType").click(function () {
                $("textarea#ItemTypeOut").val(legendItem.type);
            });

            $("#ItemID").click(function () {
                $("textarea#ItemIDOut").val(legendItem.id);
            });


            $("#ItemName").click(function () {
                $("textarea#ItemNameOut").val(legendItem.name);
            });

            // Group Tests:
            $("#GroupType").click(function () {
                $("textarea#GroupTypeOut").val(legendGroup.type);
            });

            $("#GroupID").click(function () {
                $("textarea#GroupIDOut").val(legendGroup.id);
            });


            $("#GroupName").click(function () {
                $("textarea#GroupNameOut").val(legendGroup.name);
            });

            $("#GroupChildren").click(function () {
                let children = '';
                let count = 0;
                legendGroup.children.forEach(child => { count += 1; children += `${count}. `+ child.name + "\n"; }
                );
                $("textarea#GroupChildrenOut").val(children);
            });


            // InfoSection Tests:
            $("#InfoType").click(function () {
                $("textarea#InfoTypeOut").val(legendInfo.type);
            });

            $("#InfoID").click(function () {
                $("textarea#InfoIDOut").val(legendInfo.id);
            });


            $("#InfoName").click(function () {
                $("textarea#InfoNameOut").val(legendInfo.name || "undefined");
            });
        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:60%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-two.json');
});
