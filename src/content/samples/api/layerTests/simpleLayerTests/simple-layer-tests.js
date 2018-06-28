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
        //subscribe to stream
        //simpleLayer.addGeometry(SVG);
        //simpleLayer.removeGeometry(SVG);

        // subscribe to geometry added
        //TODO: why isn't first geometry to be clicked not registering?
        simpleLayer.geometryAdded.subscribe(l => {
            console.log('Geometry added');

            $("button").click(function () {
                //if a geometry added --> change disabled button HTML to success
                if (this.id == "AddSVG" || this.id == "AddJPG" || this.id == "AddDefault") {
                    document.getElementById(this.id).style.backgroundColor = "#00FF00";
                    //user is allowed to remove all geometries
                    document.getElementById("RemoveAll").disabled = false;

                    //If SVG added --> User allowed to remove SVG
                    if (this.id == "AddSVG") {
                        document.getElementById("RemoveSVG").disabled = false;
                    }
                    //If Defaults added --> User allowed to remove defaults
                    else if (this.id == "AddDefault") {
                        document.getElementById("RemoveDefault").disabled = false;
                    }
                }
            });

        });

        //ADD GEOMETRY TEST:
        //Add geometry buttons clicked --> Add geometry buttons disabled
        document.getElementById("AddSVG").onclick = function () {
            simpleLayer.addGeometry(SVG);
            document.getElementById("AddSVG").disabled = true;
        }

        document.getElementById("AddJPG").onclick = function () {
            simpleLayer.addGeometry(JPG);
            document.getElementById("AddJPG").disabled = true;
        }

        document.getElementById("AddDefault").onclick = function () {
            simpleLayer.addGeometry([DEF1, DEF2]);
            document.getElementById("AddDefault").disabled = true;
        }

        //ADD NAME CHANGE TESTS:
        // subscribe to name changed
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

        //Click button, change name
        document.getElementById("ChangeName").onclick = function () {
            if (simpleLayer.name == "simpleLayer") {
                simpleLayer.name = "new Name";
            }
            else {
                simpleLayer.name = "simpleLayer";
            }
        }

        //ADD OPACITY TESTS:
        // subscribe to opacity changed
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

        //Click button, opacity changes
        document.getElementById("ChangeOpacity").onclick = function () {
            if (simpleLayer.opacity == 1) {
                simpleLayer.opacity = 0.3;
            }
            else {
                simpleLayer.opacity = 1;
            }
        }

        //ADD Visibility TESTS:
        // subscribe to visibility changed
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

        document.getElementById("ChangeVisibility").onclick = function () {
            if (simpleLayer.visibility == false) {
                simpleLayer.visibility = true;
            }
            else {
                simpleLayer.visibility = false;
            }
        }

        //REMOVE GEOMETRY

        // subscribe to geometry removed
        simpleLayer.geometryRemoved.subscribe(l => {
            console.log('Geometry removed');

            $("button").click(function () {
                if (this.id == "RemoveSVG" || this.id == "RemoveDefault" || this.id == "RemoveAll") {

                    //activate "Find Tests" to verify geometries can't be found on layer
                    if (this.id == "RemoveSVG") {
                        if (simpleLayer.geometry.find(geo => geo.id === '0') === undefined) {
                            //if geometry removed and not found, test is a success
                            document.getElementById(this.id).style.backgroundColor = "#00FF00";
                        }
                        else {
                            console.log("Test failed because geo.id '0' found")
                            document.getElementById(this.id).style.backgroundColor = "#cd0000";
                        }
                    }
                    if (this.id == "RemoveDefault") {
                        if (simpleLayer.geometry.find(geo => geo.id === '2' || geo.id == '3') === undefined) {//if geometry removed and not found, test is a success
                            document.getElementById(this.id).style.backgroundColor = "#00FF00";
                        }
                        else {
                            console.log("Test failed because geo.id '2' and geo.id '3' found")
                            document.getElementById(this.id).style.backgroundColor = "#cd0000";
                        }
                    }
                    if (this.id == "RemoveAll") {
                        if (simpleLayer.geometry.length === 0) {
                            document.getElementById(this.id).style.backgroundColor = "#00FF00";
                        }
                        else {
                            console.log("Test failed because geometry.length =/= 0");
                            document.getElementById(this.id).style.backgroundColor = "#cd0000";
                        }
                    }
                }
            });

        });

        //Once user removes elements --> remove options become disabled
        document.getElementById("RemoveSVG").onclick = function () {
            simpleLayer.removeGeometry('0');
            document.getElementById("RemoveSVG").disabled = true;
        }

        document.getElementById("RemoveDefault").onclick = function () {
            simpleLayer.removeGeometry(['2', '3']);
            document.getElementById("RemoveDefault").disabled = true;
        }

        document.getElementById("RemoveAll").onclick = function () {
            simpleLayer.removeGeometry();
            document.getElementById("RemoveSVG").disabled = true;
            document.getElementById("RemoveDefault").disabled = true;
            document.getElementById("RemoveAll").disabled = true;
        }

    });

    $('#main').append(`
        <div id="fgpmap" style="height:900px; width:75%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/"></div>
    `);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
