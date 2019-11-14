$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RAMP.mapAdded.subscribe(mapi => {

        //SETUP:
        //add simpleLayer
        mapi.layers.addLayer('simpleLayer');
        // set the config layer to a constant for ease of use
        const simpleLayer = mapi.layers.getLayersById('simpleLayer')[0];
        //svg path as icon
        const SVG = new RAMP.GEO.Point(0, [-85, 59], {icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Purple_star_unboxed.svg/120px-Purple_star_unboxed.svg'});
        //jpg as icon
        const JPG = new RAMP.GEO.Point(1, [-89, 59], {icon: 'http://www.oneworldkids.net/Star%20orange%20copy.jpg'});
        //default icons
        const DEF1 = new RAMP.GEO.Point(2, [-80, 59]);
        const DEF2 = new RAMP.GEO.Point(3, [-85, 57]);

        let svgRem = false;
        let defRem = false
        let allRem = false;

        // subscribe to geometry added
        simpleLayer.geometryAdded.subscribe(l => {
            console.log('Geometry added');
            //if all four geometries are added to the map, then test passes
            if (simpleLayer.geometry.length === 4) {
                document.getElementById("AddGeometries").style.backgroundColor = "#00FF00";

                //in case of reset, activate disabled remove tests
                document.getElementById("RemoveAll").disabled = false;
                document.getElementById("RemoveSVG").disabled = false;
                document.getElementById("RemoveDefault").disabled = false;

                document.getElementById("Reset").disabled = true;

                //in case of reset, reset to default button colour
                document.getElementById("RemoveAll").style.backgroundColor = '';
                document.getElementById("RemoveSVG").style.backgroundColor = '';
                document.getElementById("RemoveDefault").style.backgroundColor = '';

                //inc ase of reset, reset to default button click values
                svgRem = false;
                defRem = false
                allRem = false;
            }
            else {
                document.getElementById("AddGeometries").style.backgroundColor = "red";
                console.log("All four geometries were not added successfully to the map!");
            }
        });

        //subscribe to geometry removed
        simpleLayer.geometryRemoved.subscribe(l => {
            console.log('Geometry removed');

            //check to see if SVG was removed
            if (svgRem === true) {
                if (simpleLayer.geometry.find(geo => geo.id === '0') === undefined) {
                    //if geometry removed and not found, test is a success
                    document.getElementById("RemoveSVG").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveSVG").style.backgroundColor = "red";
                    console.log("SVG star was not successfully removed!");
                }
            }

            //check to see if default points were removed
            if (defRem === true) {
                if (simpleLayer.geometry.find(geo => geo.id === '2' || geo.id == '3') === undefined) {
                    document.getElementById("RemoveDefault").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveDefault").style.backgroundColor = "red";
                    console.log("Default points were not successfully removed!");
                }
            }

            //check to see if all points were removed
            if (allRem === true) {
                if (simpleLayer.geometry.length === 0) {
                    document.getElementById("RemoveAll").style.backgroundColor = "#00FF00";
                    document.getElementById("RemoveSVG").style.backgroundColor = "#00FF00";
                    document.getElementById("RemoveDefault").style.backgroundColor = "#00FF00";
                }
                else {
                    document.getElementById("RemoveAll").style.backgroundColor = "red";
                    console.log("All points were not successfully removed!");
                }
            }

        });


        //add gemoetries
        simpleLayer.addGeometry(SVG);
        simpleLayer.addGeometry(JPG);
        simpleLayer.addGeometry([DEF1, DEF2]);

        // subscribe to name changed, and toggle button if layer name is successfully changed
        simpleLayer.nameChanged.subscribe(l => {
            console.log('Name changed');

            if ($("#ChangeName").text() == "Change to 'simpleLayer'") {
                if (simpleLayer.name == "simpleLayer" && simpleLayer.id == "simpleLayer") {
                    $("#ChangeName").text("Change to 'new Name'");
                    document.getElementById("output").innerHTML = "simpleLayer";
                }
            } else {
                if (simpleLayer.name == "new Name" && simpleLayer.id == "new Name") {
                    $("#ChangeName").text("Change to 'simpleLayer'");
                    document.getElementById("output").innerHTML = "new Name";
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

        //remove purple star
        document.getElementById("RemoveSVG").onclick = function () {
            svgRem = true;
            simpleLayer.removeGeometry('0');
            document.getElementById("RemoveSVG").disabled = true;
        }

        //remove two red points
        document.getElementById("RemoveDefault").onclick = function () {
            defRem = true;
            simpleLayer.removeGeometry(['2', '3']);
            document.getElementById("RemoveDefault").disabled = true;
        }

        //remove all points (purple star, orange star, two red points)
        document.getElementById("RemoveAll").onclick = function () {
            allRem = true;
            simpleLayer.removeGeometry();
            document.getElementById("RemoveSVG").disabled = true;
            document.getElementById("RemoveDefault").disabled = true;
            document.getElementById("RemoveAll").disabled = true;
            document.getElementById("Reset").disabled = false;
        }

        //reset remove test by adding geometries back
        document.getElementById("Reset").onclick = function () {
            simpleLayer.addGeometry(SVG);
            simpleLayer.addGeometry(JPG);
            simpleLayer.addGeometry([DEF1, DEF2]);
        }

    });

    $('#main').append(`
        <div id="fgpmap" style="height:700px; width:75%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/"></div>
    `);

    const mapInstance = new RAMP.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
