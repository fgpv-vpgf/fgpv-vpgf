$('head').append('<link rel="stylesheet" type="text/css" href="extensions/mini-chart/styles.css">');


mapInstance.ui.anchors.CONTEXT_MAP.html(`
    <div class="mApiOverViewMap">
        <div>
            <h4 style="margin:0;">Mini Chart clicked <span>0<span></h4>
            <hr>
            <div class="contents"></div>
        </div>
    </div>
`);


const miniContents = mapInstance.ui.anchors.CONTEXT_MAP.find('div.mApiOverViewMap div.contents');
mapInstance.click.subscribe(c => {
    miniContents.html('');
    
    c.features.subscribe(f => {
        miniContents.append(`<p>Country: ${f.name}<br>oid: ${f.oid}</p>`);
    });
});


mapInstance.ui.anchors.CONTEXT_MAP.on('click', () => {
    const h4span = mapInstance.ui.anchors.CONTEXT_MAP.find('div.mApiOverViewMap h4 span');
    h4span.html(parseInt(h4span.html()) + 1);
});