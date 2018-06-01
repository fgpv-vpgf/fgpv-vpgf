$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', './panel.css'));
$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css') );

$.getScript('../../../../rv-main.js', function () {

    //first append map to body
    $('body').append(`
        <div id="fgpmap" style="height: 700px;" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-extensions="../../hello-world.js"></div>
    `);

    //this is the mapInstance
    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');

    //once map is added
    RZ.mapAdded.subscribe(mapi => {

        //SETUP:
        let text = "Title";
        // let text = "<p>Text PanelElem</p><h2></h2>"; //multiple top level elements --> throws exception successfully 
        let htmlInput = $("#coolInput");
        let panelElem1 = new RZ.PanelElem(text);
        let panelElem2 = new RZ.PanelElem($("<div>Contents:</div>"));
        let panelElem3 = new RZ.PanelElem(htmlInput);
        let panelElem4 = new RZ.PanelElem($('<p>Controls:</p>'))
        let imgElem = new RZ.PanelElem($("#coolImg"));
        let closeBtn = new RZ.PanelElem('x');

        let btn = new RZ.Btn();
        btn.text = "Btn.";
        $(btn.element).click(function () {
            alert('Btn element clicked!')
        });


        let btn2 = new RZ.Btn();
        btn2.icon = document.getElementById('green-rect');

        //Creating a panelElem to be set as contents. User defines line breaks/formatting etc. (this is like dropping a document fragment)
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append(btn.element);
        $(panelElem2.element).append(btn2.element);
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append(imgElem.element);
        

        
        let lightyear = new RZ.Panel("Buzz Lightyear");
        mapi.createPanel('Buzz Lightyear', lightyear);

        let woody = new RZ.Panel("Woody");
        mapi.createPanel('Woody', woody);

        console.log(lightyear.availableSpaces()); //or console.log(mapi.panelRegistry);

        //PANEL TESTS:         

        //line breaks need to be added in by the user        
        lightyear.controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T') , panelElem1, new RZ.PanelElem($('<br>')), panelElem4, panelElem3];
        
        //console.log(lightyear.controls);        
        lightyear.content = panelElem2;
        console.log(lightyear.content);


        //console.log("Panel ID: "+ lightyear.id);        
        //console.log(lightyear.element);
        //lightyear.setPosition(2,3,4,25); //out of bounds of grid
        //lightyear.setMinPosition(2,3,3,4); 
        //lightyear.setMinPosition(-1, 3, 4, 5) //out of bounds of grid (also of the set position)
        //lightyear.setPosition(5, 5, 9, 18);
        //lightyear.setMinPosition(5,5,7,7); //if not set, all -1 should be set because of default minimum position 

        woody.setPosition (10,1, 15, 4);

        lightyear.open();
        woody.open();
        //console.log(mapi.panelRegistry); 
        //console.log

        //conflict detected tests

        //PANEL OBSERVABLES FIRE:
        //rowsChanged
        //colsChanged
        //positionChanged
        //visibilityChanged


        console.log("panelElem1 ID: " + panelElem1.id);

        /**
         * TEST CASES: 
         * lightyear.open() before lightyear.setPosition (expect console error)
         * Set min position out of bounds of original position
         * Set position out of bounds of grid
         * Set position with invalid values (lower than zero)
         * Set invalid positions (where topLeft values are greater than bottomRight values)
         * Set panel's min position within another panel's position (should throw an error that panel can't be set)
         * If panel's non-min position is within another panel's territory (doesn't matter if other panel's territory is at min or not)
         * - If panel can shrink out of it then it should
         * Does available spaces change everytime panel opens/closes? (not when position it set or changed without open/closing)
         * Does available spaces change everytime panel is added/deleted from map class?
         * Error if panel registry tries to be updated without map instance there (implicitly done)
         * Error if user tries to open or close panel whose position is not set, and whose map isn't created
         * 
         */

    });
});