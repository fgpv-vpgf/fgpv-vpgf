import { pinImg, hasPic, noPic } from './html-assets';

class AreasOfInterest {
    preInit() {
        this.config = (<any>Object).assign({}, (<any>window).aioConfig);

        // standardize the configuration language titles for translation
        this.config.areas.forEach((area, i) => {
            Object.keys(area).forEach(key => {
                const matchResult = key.match(/title-(.*)/);
                if (matchResult) {
                    const translation = this.translations[matchResult[1]];
                    translation.areaTitles = translation.areaTitles ? translation.areaTitles : {};
                    translation.areaTitles[i] = area[key];
                    delete area[key];
                } else if (key === 'wkid') {
                    area.spatialReference = { wkid: area[key] };
                    delete area[key];
                }
            });
        });
    }

    init(api: any) {
        this.api = api;
        const topElement = $('<ul style="overflow-y:auto;" class="rv-list rv-basemap-list"></ul>');

        this.config.areas.forEach((area, i) => {
            let areaHTML = this.config.noPicture ? noPic : hasPic;
            areaHTML = areaHTML.replace(/{areaIndex}/, i);
            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || pinImg);
            topElement.append(this.api.$(areaHTML));

            const currBtn = topElement.find('button').last();
            currBtn.click(() => (this.api.extent = area));
        });

        this.makePanel(topElement);
    }

    makePanel(bodyElement) {
        // panel is already made
        if (this.panel) {
            return;
        }

        this.panel = this.api.createPanel('area-of-interest');
        this.panel.position([420, 0], [720, this.api.div.height() - 62]);

        if (!this.config.noPicture) {
            this.panel.panelBody.css('padding', '0px');
        }

        let closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');
        this.panel.open();
        this.panel.setControls([`<h2 style="font-weight: normal;display:inline;vertical-align:middle">{{ 't.title' | translate }}</h2>`, closeBtn]);
        this.panel.setBody(bodyElement);
    }
}

interface AreasOfInterest {
    translations: any;
    config: any;
    api: any;
    panel: any;
}

AreasOfInterest.prototype.translations = {
    'en-CA': {
        title: 'Areas of Interest'
    },
    'fr-CA': {
        title: `Zones d'intérêt`
    }
};

(<any>window).areaOfInterest = AreasOfInterest;
