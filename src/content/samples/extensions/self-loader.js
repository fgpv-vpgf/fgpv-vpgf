$('body').append(`
    <div id="fgpmap" class="myMap" rv-config="config.rcs.[lang].json" rv-langs='["en-CA", "fr-CA"]' rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-extensions="extensions/hello-world.js"></div>
`);


const mapInstance = new RZ.Map(document.getElementById('fgpmap'));
console.error(mapInstance);