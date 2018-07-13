$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', '../../../rv-styles.css') );

$.getScript('../../../rv-main.js', function() {
    RZ.mapAdded.subscribe(mapi => {
        mapi.centerChanged.subscribe(xy => console.log(`Center changed to x: ${xy.x}, y: ${xy.y}`));
    });

    $('body').append(`
        <div id="fgpmap" style="height: 700px;" rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-extensions="../hello-world.js"></div>
    `);

    const mapInstance = new RZ.Map(document.getElementById('fgpmap'), '../../config.rcs.[lang].json');
});