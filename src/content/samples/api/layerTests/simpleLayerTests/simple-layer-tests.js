$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RZ.mapAdded.subscribe(mapi => {

        //SETUP:
        //add simpleLayer
        mapi.layers.addLayer('simpleLayer');
        // set the config layer to a constant for ease of use
        const simpleLayer = mapi.layers.getLayersById('simpleLayer')[0];
        //svg path as icon
        const SVG = new RZ.GEO.Point(0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Purple_star_unboxed.svg/120px-Purple_star_unboxed.svg', [-85, 59]);
        //jpg as icon
        const JPG = new RZ.GEO.Point(1, 'http://www.oneworldkids.net/Star%20orange%20copy.jpg', [-89, 59]);
        //default icons
        const DEF1 = new RZ.GEO.Point(2, '', [-80, 59]);
        const DEF2 = new RZ.GEO.Point(3, '', [-85, 57]);
        let svgRem = false;
        let defRem = false
        let allRem = false;

        // subscribe to geometry added
        simpleLayer.geometryAdded.subscribe(l => {
            console.log('Geometry added');
            //if all four geometries are added to the map, then test passes
            if (simpleLayer.geometry.length === 4) {
                document.getElementById("AddGeometries").style.backgroundColor = "#00FF00";
                document.getElementById("RemoveAll").disabled = false;
                document.getElementById("RemoveSVG").disabled = false;
                document.getElementById("RemoveDefault").disabled = false;
            }
            else {
                document.getElementById("AddGeometries").style.backgroundColor = "red";
            }
        });

        //subscribe to geometry removed
        simpleLayer.geometryRemoved.subscribe(l => {
            console.log('Geometry removed');

            if (svgRem === true) {
                if (simpleLayer.geometry.find(geo => geo.id === '0') === undefined) {
                    //if geometry removed and not found, test is a success
                    document.getElementById("RemoveSVG").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveSVG").style.backgroundColor = "red";
                }
            }

            if (defRem === true) {//if geometry removed and not found, test is a success
                if (simpleLayer.geometry.find(geo => geo.id === '2' || geo.id == '3') === undefined) {
                    document.getElementById("RemoveDefault").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveDefault").style.backgroundColor = "red";
                }
            }


            if (allRem === true) {
                if (simpleLayer.geometry.length === 0) {
                    document.getElementById("RemoveAll").style.backgroundColor = "#00FF00";
                    document.getElementById("RemoveSVG").style.backgroundColor = "#00FF00";
                    document.getElementById("RemoveDefault").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveAll").style.backgroundColor = "red";
                }
            }

        });


        //add gemoetries
        simpleLayer.addGeometry(SVG);
        simpleLayer.addGeometry(JPG);
        simpleLayer.addGeometry([DEF1, DEF2]);


        //ADD NAME CHANGE TESTS:
        // subscribe to name changed, and toggle button if layer name is successfully changed
        simpleLayer.nameChanged.subscribe(l => {
            console.log('Name changed');

            if ($("#ChangeName").text() == "to 'simpleLayer'") {
                if (simpleLayer.name == "simpleLayer" && simpleLayer.id == "simpleLayer") {
                    $("#ChangeName").text("to 'new Name'");
                }
            } else {
                if (simpleLayer.name == "new Name" && simpleLayer.id == "new Name") {
                    $("#ChangeName").text("to 'simpleLayer'");
                }
            }


        });

        //Click button, change layer name
        document.getElementById("ChangeName").onclick = function () {
            if (simpleLayer.name == "simpleLayer") {
                simpleLayer.name = "new Name";
            }
            else {
                simpleLayer.name = "simpleLayer";
            }
        }

        //ADD OPACITY TESTS:
        // subscribe to opacity changed, and toggle button if opacity is successfully changed
        simpleLayer.opacityChanged.subscribe(l => {
            console.log('Opacity changed');

            if ($("#ChangeOpacity").text() == "to 0.3") {
                if (simpleLayer.opacity == 0.3) {
                    $("#ChangeOpacity").text("to 1.0");
                }
            } else {
                if (simpleLayer.opacity == 1) {
                    $("#ChangeOpacity").text("to 0.3");
                }
            }
        });

        //Click button, change opacity
        document.getElementById("ChangeOpacity").onclick = function () {
            if (simpleLayer.opacity == 1) {
                simpleLayer.opacity = 0.3;
            }
            else {
                simpleLayer.opacity = 1;
            }
        }

        //ADD Visibility TESTS:
        // subscribe to visibility changed, and toggle button if visibility changes
        simpleLayer.visibilityChanged.subscribe(l => {
            console.log('Visibility changed');

            if ($("#ChangeVisibility").text() == "Make Visible") {
                if (simpleLayer.visibility == true) {
                    $("#ChangeVisibility").text("Make Invisible");
                }
            } else {
                if (simpleLayer.visibility == false) {
                    $("#ChangeVisibility").text("Make Visible");
                }
            }

        });

        //click button, change visibility
        document.getElementById("ChangeVisibility").onclick = function () {
            if (simpleLayer.visibility == false) {
                simpleLayer.visibility = true;
            }
            else {
                simpleLayer.visibility = false;
            }
        }

        //REMOVE GEOMETRIES BUTTONS
        document.getElementById("RemoveSVG").onclick = function () {
            svgRem = true;
            simpleLayer.removeGeometry('0');
            document.getElementById("RemoveSVG").disabled = true;
        }

        document.getElementById("RemoveDefault").onclick = function () {
            defRem = true;
            simpleLayer.removeGeometry(['2', '3']);
            document.getElementById("RemoveDefault").disabled = true;
        }

        document.getElementById("RemoveAll").onclick = function () {
            allRem = true;
            simpleLayer.removeGeometry();
            document.getElementById("RemoveSVG").disabled = true;
            document.getElementById("RemoveDefault").disabled = true;
            document.getElementById("RemoveAll").disabled = true;
        }

    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:75%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/"></div>
    `);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
