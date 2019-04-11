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

            // Item Tests:
            $("#ItemToggleVis").click(function () {
                if (legendItem._availableControls.includes('visibility')) {
                    if (legendItem.visibility === true) {
                        legendItem.visibility = false;
                    }
                    else if (legendItem.visibility === false) {
                        legendItem.visibility = true;
                    }
                    else {
                        $('#ItemToggleVis').css('background-color', 'red');
                        console.log('Visibility is undefined for an item with available controls');
                    }
                }
            });

            $("#ItemToggleOpacity").click(function () {
                if (legendItem._availableControls.includes('opacity')) {
                    if ($('#ItemToggleOpacity').text() === 'Toggle Opacity to 0.3') {
                        legendItem.opacity = 0.3;
                        document.getElementById("ItemToggleOpacity").innerHTML = 'Toggle Opacity to 1.0';
                    }
                    else if ($('#ItemToggleOpacity').text() === 'Toggle Opacity to 1.0') {
                        legendItem.opacity = 1;
                        document.getElementById("ItemToggleOpacity").innerHTML = 'Toggle Opacity to 0.3';
                    }
                    else if (legendItem.opacity === undefined) {
                        $('#ItemToggleOpacity').css('background-color', 'red');
                        console.log('Opacity is undefined for a item with available controls.');
                    }
                }
            });

            $("#ItemToggleQuery").click(function () {
                if (legendItem._availableControls.includes('query')) {
                    if (legendItem.queryable === true) {
                        legendItem.queryable = false;
                    }
                    else if (legendItem.queryable === false) {
                        legendItem.queryable = true;
                    }
                    else {
                        $('#ItemToggleQuery').css('background-color', 'red');
                        console.log('Queryable is undefined for an item with available controls.');
                    }
                }
            });

            // Group Tests:
            $("#GroupToggleVis").click(function () {
                if (legendGroup._availableControls.includes('visibility')) {
                    if (legendGroup.visibility === true) {
                        legendGroup.visibility = false;
                    }
                    else if (legendGroup.visibility === false) {
                        legendGroup.visibility = true;
                    }
                    else {
                        $('#GroupToggleVis').css('background-color', 'red');
                        console.log('Visibility is undefined for a group with available controls');
                    }
                }
            });

            $("#GroupToggleOpacity").click(function () {

                if (legendGroup._availableControls.includes('opacity')) {
                    if ($('#GroupToggleOpacity').text() === 'Toggle Opacity to 0.3') {
                        legendGroup.opacity = 0.3;
                        document.getElementById("GroupToggleOpacity").innerHTML = 'Toggle Opacity to 1.0';
                        document.getElementById("ItemToggleOpacity").innerHTML = 'Toggle Opacity to 1.0';
                    }
                    else if ($('#GroupToggleOpacity').text() === 'Toggle Opacity to 1.0') {
                        legendGroup.opacity = 1;
                        document.getElementById("GroupToggleOpacity").innerHTML = 'Toggle Opacity to 0.3';
                        document.getElementById("ItemToggleOpacity").innerHTML = 'Toggle Opacity to 0.3';
                    }
                    else if (legendGroup.opacity === undefined) {
                        $('#GroupToggleOpacity').css('background-color', 'red');
                        console.log('Opacity is undefined for a group with available controls.');
                    }
                }
            });

            $("#GroupToggleQuery").click(function () {
                if (legendGroup._availableControls.includes('query')) {
                    if (legendGroup.queryable === true) {
                        legendGroup.queryable = false;
                    }
                    else if (legendGroup.queryable === false) {
                        legendGroup.queryable = true;
                    }
                    else {
                        $('#GroupToggleQuery').css('background-color', 'red');
                        console.log('Queryable is undefined for a group with available controls.');
                    }
                }
            });

            // InfoSection Tests:
            $("#InfoToggleVis").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('visibility')) {
                    $('#InfoToggleVis').css('background-color', 'red');
                    console.log('Visibility is an available control for an InfoSection.');
                }
            });

            $("#InfoToggleOpacity").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('opacity')) {
                    $('#InfoToggleOpacity').css('background-color', 'red');
                    console.log('Opacity is an available control for an InfoSection.');
                }
            });

            $("#InfoToggleQuery").click(function () {
                if (legendInfo._availableControls && legendInfo._availableControls.includes('opacity')) {
                    $('#InfoToggleQuery').css('background-color', 'red');
                    console.log('Queryable is an available control for an InfoSection.');
                }
            });
        });
    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:60%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/""></div>
    `);
    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../test-legend-one.json');
});
