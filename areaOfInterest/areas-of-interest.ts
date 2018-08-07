import { pinImg, picHTML1, HTMLmiddle, HTMLmiddle2, picHTML2, HTMLend, noPicHTML1 } from './html-assets';

class AreasOfInterest {

    preInit(config: any) {
        this.config = config;
    }

    init(api: any) {
        //initialize attributes
        let map = api; // map object that rv-extension loads into this file
        let mapConfig = JSON.parse(document.getElementById('aoi-config').innerHTML);
        let zones = mapConfig.areas;
        let noPic = mapConfig.noPicture;
        let wkid = mapConfig.wkid;
        let zoneList = ' ';
        let title = this.translations[this.config.language]['title'];
        let topElement = document.createElement('div');

        //if areas of interest provided, create panel contents
        if (zones !== undefined) {

            let count = 0;

            for (let zone of zones) {

                count += 1;

                let img = (zone.thumbnailUrl !== '') ? zone.thumbnailUrl : pinImg;
                let zoneImg = `src="${img}"`;
                let zoneTitle = `${zone.title}`;

                //if thumbnail pictures disabled show list of areas as black buttons
                if (noPic) {
                    zoneList = noPicHTML1 + zoneTitle + HTMLmiddle + `id="btn${count}"` + HTMLmiddle2 + HTMLend;
                    $(topElement).append(zoneList);
                }
                //else show list of areas with thumbnails
                else {
                    zoneList = picHTML1 + zoneImg + picHTML2 + zoneTitle + HTMLmiddle + `id="btn${count}"` + HTMLmiddle2 + HTMLend;
                    $(topElement).append(zoneList);
                }

                let currBtn :HTMLElement = topElement.querySelector(`#btn${count}`) as HTMLElement;
                currBtn.onclick = () => map.setExtent(zone.xmin, zone.xmax, zone.ymin, zone.ymax, wkid);

            }
        }

        //if an area of interest panel exists on map close the panel
        let panel0 = map.panelRegistry.find(panel => {
            if (panel.id === 'area-of-interest') {
                panel.close();
                return panel;
            }
        });

        //if it doesn't exist, create one
        if (!panel0) {
            panel0 = map.createPanel('area-of-interest');
        }

        //then open the panel
        let height = $('#' + map.id).height();
        if (height) {
            panel0.position([-10, -10], [290, height - 52]);
        }
        let closeBtn = new panel0.button('X');
        closeBtn.element.css('float', 'right');
        panel0.open();
        //set controls (close button and title), and content (areas of interest)
        panel0.controls = [new panel0.button(''), new panel0.container(`<h2 style="font-weight: normal;display:inline;vertical-align:middle">${title}</h2>`), closeBtn];
        
        let panelContent = document.createElement('ul');
        panelContent.style.overflowY = "auto";
        panelContent.classList.add('rv-list');
        panelContent.classList.add('rv-basemap-list');
        $(panelContent).append(topElement);

        panel0.content = new panel0.container(panelContent);
    }
};

interface AreasOfInterest {
    translations: any;
    config: any;
}

AreasOfInterest.prototype.translations = {
    'en-CA': {
        'title': 'Areas of Interest'
    },
    'fr-CA': {
        'title': 'Zones d\'intérêt'
    }
};

(<any>window).areaOfInterest = AreasOfInterest;
