const translations = {
    'en-CA': 'Areas of Interest',
    'fr-CA': 'Zones d\'intérêt'
};

//initialize attributes
let map = mapInstance; // map object that rv-extension loads into this file
let self = map.mapI.getApi();
let mapConfig = self.getConfig('map');
let zones = mapConfig.components.areaOfInterest._source.areas;
let noPic = mapConfig.components.areaOfInterest._source.noPicture;
let zoneList = ' ';
let title = translations[self.getCurrentLang()];

//define and append setExtent to head
let setExtent = `
<script>
function setExtent(xmin, xmax, ymin, ymax, map) {
    const zone = {
        xmin,
        xmax,
        ymin,
        ymax,
        spatialReference: { wkid: 4326 }
    };
    for (let mapInstance of RZ.mapInstances) {
        if(document.getElementById(mapInstance.id) === map){
            mapInstance.mapI.getApi().setExtent(zone);
        }
    }
}
</script>`;
$('head').append($(setExtent));


//if areas of interest provided, create panel contents
if (zones !== undefined) {
    for (let zone of zones) {

        let img = (zone.thumbnailUrl !== '') ? zone.thumbnailUrl :
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD+UlEQVRoBe1YPWgUQRTO/aiVEPAwRbSx9g9TCWpzoiZg4Q9RSCUIp9hIQEkuuZDcJRG1i9UZsRBEjGgKwUQlBi3FHxQbg5pKMXIR5ZqQ4+78ns4kk2X29r3dbYI3sMybed/73nvzt7Pb0FAv9RH4v0cgElb6IyMj64rF4r5qtXooEonsBm8Tnma0y6jn0PcN9Us8E6VS6Xl/f/8i5MAllASGhobaEeg1RLORGdF34M739vbeZeJdYYESQOBNCPwm2NtcPdRWTGBmTvX09MzVhrlrfSeQy+UOwPltUCfc6VmaAgahI5PJPGGhHSBfCVDw0Wh0Eo592TtiaMBAVCuVShuSmHTqvNriAAYHB5tB+gFPoxe5UP8L+K3YF18ldlEJmLAYrTuowg6eqBsVN8nsIkpgeHj4OJbNXja7EEjcmOFjEjNRAnBwWULuB4tZuCKxYyeQzWZbkMAWJvk4AtmP9Ryhh2TYjXNsyQf54mAJE+cCEcRhDha4PpzrOROL9hTaU3hvZBBg1tTZZOXrtU3n7GPPAI7NPU5jS3vCGbyJUbpHZp9NRgLsfcZOAI4225yZfXB81WzbZMyAJwY8m2y2tj52AnDsSYpLmue0l8vlN7ZAHH30rmEVdgIYFfFLjxWBHcSOiw3EDBTsvpZ7Y7HYruWWXeJgOL40OzsBTMAnbeRWA3PRTaf7gbmgZbea40vbshPAqLzVRjXqVrxJ+9z0Sud59Wb6+uuG/R4A+gWeTrfgjP4BBLoTo5jHsfmY+nH+H0RQKYhHDFwtkXyxCntj5vP5NYVCYR6BrGcx+wQh8WIikdiQSqVKHAr2EiJCBB/4E9ArKPgY4wZPXOwElONRrwBC0F+XcLCXkCbF+n4Hebtuh1y/x+Vvh4RTOgP0QXNJ4kCC9cMtTgDXhTEENSsJjImdVdxM+D+YOAH8kKrgZso5TmWBgJO4RUYAi/eAdoC98BQyfaiEUZ5h7Sf9EIlnQDvBLJyDLB4xba9rrPsq7kf0kvNVfCeQTqdn4PGGL6+GEc790e7ubs97lmGyQvSdALHE43G6vM2vYJQ1fioOmZWBDpRAV1fXb3CdNfik4hnFIbVbwgdKgFiw+e5hHd9aYmQKZEO2TLgrLHACxIzzm2bho6sXhwLBzygbh0be9H2MOl3hX842nEyv0L/WqXO0F5FAC67a9H81cIkFZlAE09PTP5LJJO2JVg/OTiydhx4Ytjq0GdAe8fFyH0fjUd02a4z8A4y86N+naW+TQ9kDJjHWdgfan80+khH8F6VzqgK1Q08A95kFRHQSD9W6LGBWTiid7gulDj0BigprnDZzO0a9TA/Jqo/Uq6dgP5ymZ/VEXI+0PgKrbwT+AFIjLxu3HbkQAAAAAElFTkSuQmCC`;
        //if thumbnail pictures disabled show list of areas as black buttons
        if (noPic) {
            zoneList +=
                `<li class="rv-basemap-list-item" style="height: 50px;">
                            <div style="position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%">
                                <div style="max-height: 50px; max-width: 350px; text-align: center;"></div>
                                <div class="rv-basemap-footer"><span>${zone.title}</span></div>
                                    <button class="rv-body-button rv-button-square md-button md-ink-ripple"
                                        type="button" aria-label="bookmark" onclick="setExtent(${zone.xmin}, ${zone.xmax}, ${zone.ymin}, ${zone.ymax}, ${map.id})">
                                        <div class="md-ripple-container" style=""></div>
                                    </button>
                                </div>
                        </li>`;
        }
        //else show list of areas with thumbnails
        else {
            zoneList +=
                `<li class="rv-basemap-list-item" style="height: 175px;">
                            <div style="position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%">
                                <div style="max-height: 175px; max-width: 350px; text-align: center;"><img alt="" src="${img}"/></div>
                                <div class="rv-basemap-footer"><span style="text-overflow:ellipses">${zone.title}</span></div>
                                    <button class="rv-body-button rv-button-square md-button md-ink-ripple"
                                        type="button" aria-label="bookmark" onclick="setExtent(${zone.xmin}, ${zone.xmax}, ${zone.ymin}, ${zone.ymax}, ${map.id})">
                                        <div class="md-ripple-container" style=""></div>
                                    </button>
                                </div>
                        </li>`;
        }
    }
}


//creating Panel + opening
let height = $('#' + mapInstance.id).height();
let panel0 = mapInstance.createPanel('panel0');
panel0.position([-10, -10], [290, height - 52]);
$('div').removeClass('hidden');
let closeBtn = new panel0.button('X');
closeBtn.element.css('float', 'right');
panel0.open();

//set controls (close button and title), and content (areas of interest)
panel0.controls = [new panel0.button(''), new panel0.container(`<h2 style="font-weight: normal;display:inline;vertical-align:middle">${title}</h2>`), closeBtn];
panel0.content = new panel0.container(`<ul class="rv-list rv-basemap-list">${zoneList}</ul>`);
