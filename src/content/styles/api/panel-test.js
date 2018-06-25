$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', '../../../../rv-styles.css'));

$.getScript('../../../../rv-main.js', function () {

    //first append map to body
    $('body').append(`
        <div id="fgpmap" style="height: 700px; display:flex;" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-extensions="../../hello-world.js"></div>
    `);

    //this is the mapInstance
    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../../config.rcs.[lang].json');

    //once map is added
    RZ.mapAdded.subscribe(mapi => {

        //creating Panel + opening
        let panel1 = RZ.mapInstances[0].createPanel('panel1');
        panel1.id;
        panel1.setPosition([10, 1], [13, 14]);
        panel1.open();

        //creating PanelElems
        let panelElem1 = panel1.createPanelElem("Layers");
        let panelElem2 = panel1.createPanelElem($("<div style='color: lightslategray'>Contents:</div>"));
        let panelElem3 = panel1.createPanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
        let panelElem4 = panel1.createPanelElem($('<p style="color: lightslategray">Controls:</p>'))
        let imgElem = panel1.createPanelElem($("<img id='coolImg' src='http://www.geographicguide.com/planet/images/mercator.jpg'></img>"));

        let btn = panel1.createBtn();
        btn.text = "Btn.";
        $(btn.element).click(function () {
            alert('Btn element clicked!')
        });

        //setting up the SVG icon

        let svg = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>');

        //assigning it to the btn2

        let btn2 = panel1.createBtn();
        btn2.icon = svg[0];

        //content setup
        let closeBtn = panel1.createPanelElem('x');
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append(btn.element);
        $(panelElem2.element).append(btn2.element);
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append($("<br>"));
        $(panelElem2.element).append(imgElem.element);

        //assigning contents
        panel1.content = panelElem2;
        panel1.content;

        //assinging controls
        panel1.controls = [closeBtn, panel1.createPanelElem('|'), panel1.createPanelElem('T'), panelElem1, panel1.createPanelElem($('<br>')), panelElem4, panelElem3];
        panel1.controls;
    });
});
