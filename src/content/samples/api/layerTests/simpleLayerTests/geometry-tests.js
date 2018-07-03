$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RZ.mapAdded.subscribe(mapi => {

        mapi.layers.addLayer('simpleLayer');

        const simpleLayer = mapi.layers.getLayersById('simpleLayer')[0];

        // create different types of API points
        const pointA = new RZ.GEO.Point(0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Purple_star_unboxed.svg/120px-Purple_star_unboxed.svg', [-85, 59]);
        const pointE = new RZ.GEO.Point(4, 'M24.0,2.199C11.9595,2.199,2.199,11.9595,2.199,24.0c0.0,12.0405,9.7605,21.801,21.801,21.801c12.0405,0.0,21.801-9.7605,21.801-21.801C45.801,11.9595,36.0405,2.199,24.0,2.199zM31.0935,11.0625c1.401,0.0,2.532,2.2245,2.532,4.968S32.4915,21.0,31.0935,21.0c-1.398,0.0-2.532-2.2245-2.532-4.968S29.697,11.0625,31.0935,11.0625zM16.656,11.0625c1.398,0.0,2.532,2.2245,2.532,4.968S18.0555,21.0,16.656,21.0s-2.532-2.2245-2.532-4.968S15.258,11.0625,16.656,11.0625zM24.0315,39.0c-4.3095,0.0-8.3445-2.6355-11.8185-7.2165c3.5955,2.346,7.5315,3.654,11.661,3.654c4.3845,0.0,8.5515-1.47,12.3225-4.101C32.649,36.198,28.485,39.0,24.0315,39.0z', [-89, 59]);
        const multipointB = new RZ.GEO.MultiPoint(11, '', [pointA, pointE, [79, 43], [-79, 32]]);
        const lineB = new RZ.GEO.LineString(12, [pointA, pointE]);

        // create hovers
        const hoverPointA = new RZ.GEO.Hover(0, 'my annotation', { position: 'right' });
        const hoverPointB = new RZ.GEO.Hover(1, '<a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>', { keepOpen: true, position: 'left' });

        let multipointAdded = false;
        let addPoint = false;
        let lineAdded = false;


        //subscribe to geometry added
        simpleLayer.geometryAdded.subscribe(l => {
            console.log('Geometry added');

            // confirm hoverpoint and hover got added correctly, test passes
            if (addPoint === true && !document.getElementById("AddHover").disabled) {
                if (simpleLayer.geometry.length === 2 && simpleLayer.geometry[0].hover !== null && simpleLayer.geometry[1].hover !== null) {
                    document.getElementById("AddHover").style.backgroundColor = "lightgreen";
                    document.getElementById("RemoveHover").disabled = false;
                }
                else {
                    document.getElementById("AddHover").style.backgroundColor = "red";
                    console.log("Either the hover or points were not added!")
                }
            }
            //confirm multipoint and hover got added correctly, test passes
            if (multipointAdded === true && !document.getElementById("AddMultiPoint").disabled) {
                if (simpleLayer.geometry.length === 1 && simpleLayer.geometry[0].hover !== null) {
                    document.getElementById("AddMultiPoint").style.backgroundColor = "lightgreen";
                    document.getElementById("RemoveHover2").disabled = false;
                }
                else {
                    document.getElementById("AddMultiPoint").style.backgroundColor = "red";
                    console.log("Either the hover or multipoint was not added!")
                }
            }

            //confirm line and hover got added correctly, test passes
            if (lineAdded === true) {
                if (simpleLayer.geometry.length === 1 && simpleLayer.geometry[0].hover !== null) {
                    document.getElementById("AddLine").style.backgroundColor = "lightgreen";
                    document.getElementById("RemoveHover3").disabled = false;
                }
                else {
                    document.getElementById("AddLine").style.backgroundColor = "red";
                    console.log("Either the line or hover was not added!")
                }
            }


        });

        //subsribe to geometry removed
        simpleLayer.geometryRemoved.subscribe(l => {

            //testing for if multipoint removed
            if (multipointAdded === true) {
                if (simpleLayer.geometry.length === 0) {
                    document.getElementById("RemovePoints2").style.backgroundColor = "lightgreen";
                    document.getElementById("RemovePoints2").disabled = true;
                }
                else{
                    document.getElementById("RemovePoints2").style.backgroundColor = "red";
                    console.log("Multipoint was not removed successfully!");
                }
            }
            //testing for if points were removed
            else{
                if (simpleLayer.geometry.length === 0) {
                    document.getElementById("RemovePoints").style.backgroundColor = "lightgreen";
                    document.getElementById("RemovePoints").disabled = true;
                }
                else{
                    document.getElementById("RemovePoints").style.backgroundColor = "red";
                    console.log("Points were not removed successfully!");
                }
            }

        })

        //add points with hover
        document.getElementById("AddHover").onclick = function () {
            pointA.hover = hoverPointA;
            pointE.hover = hoverPointB;
            addPoint = true;
            simpleLayer.addGeometry([pointA, pointE]);
            document.getElementById("AddHover").disabled = true;
        }

        //add multipoint with hover
        document.getElementById("AddMultiPoint").onclick = function () {
            multipointB.hover = hoverPointB;
            multipointAdded = true;
            simpleLayer.addGeometry(multipointB);
            document.getElementById("AddMultiPoint").disabled = true;
        }

        //add line with hover
        document.getElementById("AddLine").onclick = function () {
            // create a hoverpoint instance and add it to the line
            lineB.hover = hoverPointB;
            // add line to the layer
            lineAdded = true;
            simpleLayer.addGeometry([lineB]);
            document.getElementById("AddLine").disabled = true;
        }


        //remove hover from points
        document.getElementById("RemoveHover").onclick = function () {

            //remove hoverpoints
            removeHover();

            //if hoverpoints have been removed, test passes (green), fails (red)
            if (simpleLayer.geometry[0].hover === null && simpleLayer.geometry[1].hover === null) {
                document.getElementById("RemoveHover").style.backgroundColor = "lightgreen";
                document.getElementById("RemoveHover").disabled = true;
                document.getElementById("RemovePoints").disabled = false;
            }
            else {
                document.getElementById("RemoveHover").style.backgroundColor = "red";
                document.getElementById("RemoveHover").disabled = true;
                console.log("Hovers were not removed successfully from points!");
            }
        }


        //remove hover from multipoint
        document.getElementById("RemoveHover2").onclick = function () {

            //remove hoverpoints
            removeHover();

            //if hoverpoints have been removed, test passes (green), fails (red)
            if (simpleLayer.geometry[0].hover === null) {
                document.getElementById("RemoveHover2").style.backgroundColor = "lightgreen";
                document.getElementById("RemoveHover2").disabled = true;
                document.getElementById("RemovePoints2").disabled = false;
            }
            else {
                document.getElementById("RemoveHover2").style.backgroundColor = "red";
                document.getElementById("RemoveHover2").disabled = true;
                console.log("Hover was not removed successfully from multipoint!");
            }
        }

        //remove hover from line
        document.getElementById("RemoveHover3").onclick = function () {

            //remove hoverpoints
            removeHover();

            //if hoverpoints have been removed, test passes (green), fails (red)
            if (simpleLayer.geometry[0].hover === null) {
                document.getElementById("RemoveHover3").style.backgroundColor = "lightgreen";
                document.getElementById("RemoveHover3").disabled = true;
            }
            else {
                document.getElementById("RemoveHover3").style.backgroundColor = "red";
                document.getElementById("RemoveHover3").disabled = true;
                console.log("Hover was not removed successfully from line!");
            }
        }

        //resets map after points have been added
        document.getElementById("RemovePoints").onclick = function () {
            simpleLayer.removeGeometry();
            document.getElementById("AddMultiPoint").disabled = false;
        }

        //resets map after multipoints have been added
        document.getElementById("RemovePoints2").onclick = function () {
            simpleLayer.removeGeometry();
            document.getElementById("AddLine").disabled = false;
        }

        function removeHover(){
            simpleLayer.geometry.forEach(geometry => {
                geometry.removeHover();
            });
        }

    });
    $('#main').append(`<div id="fgpmap" style="height:700px; width:75%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/"></div>`);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
