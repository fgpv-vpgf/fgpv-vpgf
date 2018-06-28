$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {
    RZ.mapAdded.subscribe(mapi => {

        mapi.layers.addLayer('simpleLayer');

        const simpleLayer = mapi.layers.getLayersById('simpleLayer')[0];

        //TEST POINT GEOMETRY
        // create different types of API points
        const pointA = new RZ.GEO.Point(0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Purple_star_unboxed.svg/120px-Purple_star_unboxed.svg', [-85, 59]);
        const pointE = new RZ.GEO.Point(4, 'M24.0,2.199C11.9595,2.199,2.199,11.9595,2.199,24.0c0.0,12.0405,9.7605,21.801,21.801,21.801c12.0405,0.0,21.801-9.7605,21.801-21.801C45.801,11.9595,36.0405,2.199,24.0,2.199zM31.0935,11.0625c1.401,0.0,2.532,2.2245,2.532,4.968S32.4915,21.0,31.0935,21.0c-1.398,0.0-2.532-2.2245-2.532-4.968S29.697,11.0625,31.0935,11.0625zM16.656,11.0625c1.398,0.0,2.532,2.2245,2.532,4.968S18.0555,21.0,16.656,21.0s-2.532-2.2245-2.532-4.968S15.258,11.0625,16.656,11.0625zM24.0315,39.0c-4.3095,0.0-8.3445-2.6355-11.8185-7.2165c3.5955,2.346,7.5315,3.654,11.661,3.654c4.3845,0.0,8.5515-1.47,12.3225-4.101C32.649,36.198,28.485,39.0,24.0315,39.0z', [-89, 59]);

        // create hoverpoint instances and add them to the different points
        const hoverPointA = new RZ.GEO.Hover(0, 'my annotation', { position: 'right' });
        const hoverPointB = new RZ.GEO.Hover(1, '<a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>', { keepOpen: true, position: 'left' });

        // create a line instance using pre-existing API points
        const lineD = new RZ.GEO.LineString(12, [pointA, pointE]);
        // create a hoverpoint instance and add it to the line
        const hoverPointD = new RZ.GEO.Hover(1, '<a href="https://www.w3schools.com/html/">Line Hover!</a>', { keepOpen: true, followCursor: true, position: 'bottom' });


        //////////////////////////      TESTS       ///////////////////////////////////////////////////////////////////////////////

        //ADD GEOMETRIES (Points and Hoverpoints): SUBSCRIPTION
        simpleLayer.geometryAdded.subscribe(l => {
            console.log('Geometry added');
            // confirm hoverpoint and geometry got added correctly, test passes
            if (simpleLayer.geometry.length === 2 && simpleLayer.geometry[0].hover !== null && simpleLayer.geometry[1].hover !== null) {
                document.getElementById("AddHover").style.backgroundColor = "#00FF00";
            }
        });

        simpleLayer.geometryRemoved.subscribe(l => {

        })

        document.getElementById("AddHover").onclick = function () {
            pointA.hover = hoverPointA;
            pointE.hover = hoverPointB;
            simpleLayer.addGeometry([pointA, pointE]);
            document.getElementById("AddHover").disabled = true;
            document.getElementById("RemoveHover").disabled = false;
        }

        document.getElementById("RemoveHover").onclick = function () {

            //remove hoverpoints
            simpleLayer.geometry.forEach(geometry => {
                geometry.removeHover();
            });

            //if hoverpoints have been removed, test passes
            if(simpleLayer.geometry[0].hover === null && simpleLayer.geometry[1].hover === null){
                document.getElementById("RemoveHover").style.backgroundColor = "#00FF00";
                document.getElementById("RemoveHover").disabled = true;
            }
            else{
                document.getElementById("RemoveHover").style.backgroundColor = "red";
                document.getElementById("RemoveHover").disabled = true;
            }
        }


    });
    $('#main').append(`<div id="fgpmap" style="height:700px; width:75%; margin-left:10px" class="column" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/"></div>`);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');
});
