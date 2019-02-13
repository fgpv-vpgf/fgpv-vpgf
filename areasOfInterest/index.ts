import { pinImg, hasPic, noPic } from './html-assets';

class AreasOfInterest {
    // A store of the instances of areasOfInterest, 1 per map
    static instances: { [id: string]: AreasOfInterest } = {};

    preInit(pluginConfig) {
        this.config = pluginConfig;

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

        AreasOfInterest.instances[this.api.id] = this;

        const topElement = $('<ul style="overflow-y:auto;" class="rv-list rv-basemap-list"></ul>');

        this.config.areas.forEach((area, i) => {
            let areaHTML = this.config.noPicture ? noPic : hasPic;
            areaHTML = areaHTML.replace(/{areaIndex}/, i);
            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || pinImg);
            topElement.append(areaHTML);

            const currBtn = topElement.find('button').last();
            currBtn.click(() => (this.api.extent = area));
        });

        this.button = this.api.mapI.addPluginButton(
            AreasOfInterest.prototype.translations[this._RV.getCurrentLang()].title,
            this.onMenuItemClick()
        );

        this.makePanel(topElement);
    }

    onMenuItemClick() {
        return () => {
            this.button.isActive ? this.panel.close() : this.panel.open();
        };
    }

    makePanel(bodyElement) {
        // panel is already made
        if (this.panel) {
            return;
        }

        this.panel = this.api.createPanel('area-of-interest');

        this.panel.opening.subscribe(() => {
            this.button.isActive = true;
        });
        this.panel.closing.subscribe(() => {
            this.button.isActive = false;
        });

        this.panel.position([420, 0], [720, this.api.div.height() - (48 + 20)], true);

        if (!this.config.noPicture) {
            this.panel.panelBody.css('padding', '0px');
        }

        let closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');
        this.panel.setControls([
            `<h2 style="font-weight: normal;display:inline;vertical-align:middle">{{ 't.title' | translate }}</h2>`,
            closeBtn
        ]);
        this.panel.setBody(bodyElement);
        this.panel.open();
    }
}

interface AreasOfInterest {
    translations: any;
    config: any;
    api: any;
    panel: any;
    _RV: any;
    button: any;
}

AreasOfInterest.prototype.translations = {
    'en-CA': {
        title: 'Areas of Interest'
    },
    'fr-CA': {
        title: `Zones d'intérêt`
    }
};

(<any>window).areasOfInterest = AreasOfInterest;
