$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', './panel.css'));
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

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
        var mapInstance = mapi.createPanel('Buzz Lightyear');
        lightyear.setMap(mapInstance);

        let woody = new RZ.Panel("Woody");
        let mapInstance2 = mapi.createPanel('Woody');
        woody.setMap(mapInstance2);
        
        console.log(mapi.panelRegistry); //or console.log(mapi.panelRegistry);

        //PANEL TESTS:         

        //line breaks need to be added in by the user        
        lightyear.controls = [closeBtn, new RZ.PanelElem('|'), new RZ.PanelElem('T'), panelElem1, new RZ.PanelElem($('<br>')), panelElem4, panelElem3];

        //console.log(lightyear.controls);        
        lightyear.content = panelElem2;
        console.log(lightyear.content);


        //console.log("Panel ID: "+ lightyear.id);        
        //console.log(lightyear.element);
        //lightyear.setPosition(2,3,4,25); //out of bounds of grid
        //lightyear.setMinPosition(2,3,3,4); 
        //lightyear.setMinPosition(-1, 3, 4, 5) //out of bounds of grid (also of the set position)
        lightyear.setPosition(2, 2, 5, 10);

        lightyear.setMinPosition(2, 2, 5, 5); //if not set, all -1 should be set because of default minimum position 

        //woody.setPosition(7, 7, 11, 11);
        //woody.setMinPosition(10, 10, 11, 11); //if not set causes a conflict, if set and panel SHOULD autoshrink to 7, 9, 11, 11

        lightyear.open();
        //woody.open();
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
         * Set position out of bounds of grid
         * Set position with invalid values (lower than zero)
         * Set invalid positions (where topLeft values are greater than bottomRight values)
         * Open panel whose min position is within another panel's position (should throw error)
         * Adjust panel to min position if its non-min position is within another panel's position
         * If panel's non-min position is within another panel's territory (doesn't matter if other panel's territory is at min or not)
         * - If panel can shrink out of it then it should
         * Does available spaces change everytime panel opens/closes? (not when position it set or changed without open/closing)
         * Does available spaces change everytime panel is added/deleted from map class?
         * Error if panel registry tries to be updated without map instance there (implicitly done)
         * Error if user tries to open or close panel whose position is not set, and whose map isn't created
         * Error if min position is a not a subset of position 
         * Error if setMinPosition is called before setPosition
         * Error if available spaces is called without a map object existing
         * PanelElem control divider shortcut, close button shortcut
         * 
         * 
         * PANEL METHOD TESTS: 
         *  open(): void;
         *  close(): void;
         *  set controls(elems: PanelElem[]): void;
         *  get controls(): PanelElem[];
         *  get content(): PanelElem;
         *  set content(item: PanelElem): void;
         *  get id(): string;
         *  get element(): jQuery<HTMLElement>;
         *  setPosition(topLeft: number,bottomRight: number): void;
            setMinPosition(topLeft: number,bottomRight: number): void;
            widthChanged: Observable<number>; // the width in pixels of a grid square
            heightChanged: Observable<number>; // the height in pixels of a grid square
            positionChanged: Observable<number, number>; // topLeft, bottomRight
            opening: Observable;
            closing: Observable;
            static availableSpaces(width: number, height: number): number[][];
            availableSpaces(): number[][];
            get element(): jQuery<HTMLElement>;

            PANELELEM: 
            *get element

            BTN:
            set icon(svg: SVG): void;
            set text(txt: string): void;
         * 
         */

    });
});