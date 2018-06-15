$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', './panel.css'));
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
        document.getElementsByClassName('rv-inner-shell')[0].clientHeight = "auto";

    });
});