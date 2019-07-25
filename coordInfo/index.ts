import { template, magSection } from './html-assets';

class CoordInfo {
    private urls = {
        nts: 'https://geogratis.gc.ca/services/delimitation/en/nts?',
        utm: 'https://geogratis.gc.ca/services/delimitation/en/utmzone?',
        alti: 'https://geogratis.gc.ca/services/elevation/cdem/altitude?',
        decli: 'https://geomag.nrcan.gc.ca/service/tools/magnetic/calculator/?'
    };

    init(api: any) {
        this.api = api;
        this.button = this.api.mapI.addPluginButton(
            CoordInfo.prototype.translations[this._RV.getCurrentLang()].coordButtonLabel,
            this.onMenuItemClick()
        );

        // check to see if this init is due to projection change or language switch
        const activeNode = this.api.mapDiv[0].getAttributeNode('coord-info-active');
        if (activeNode !== null) {
            this.api.layers.identifyMode = 'none';
            // if coordinate info was active, turn it on again
            if (this.panel !== undefined) {
                // destroy old panel so that new one gets created
                this.panel.close({ destroy: true });
                this.panel = undefined;
            }
            this.toggleActive();
        }
    }

    /**
     * Returns a function to be executed when the map is clicked.
     *
     * @function  onMenuItemClick
     * @return  {Function}    Callback to be executed when map is clicked
     */
    onMenuItemClick() {
        let identifySetting;
        return () => {
            this._RV.toggleSideNav('close');

            // only set event if not already created
            if (typeof this.handler === 'undefined') {
                // activate coordInfo crosshairs, store current identify value
                identifySetting = this.toggleActive();

                //set coord-info-active attr on map
                const activeNode = document.createAttribute('coord-info-active');
                this.api.mapDiv[0].setAttributeNode(activeNode);
            } else {
                // remove the click handler and set the cursor
                this.handler.unsubscribe();
                this.handler = undefined;
                this._RV.setMapCursor('');

                // set inactive (unchecked) in the side menu
                this.button.isActive = false;
                // reset identify value to stored value
                this.api.layers.identifyMode = identifySetting;

                //remove coord-info-active attr on map
                const activeNode = this.api.mapDiv[0].getAttributeNode('coord-info-active');
                this.api.mapDiv[0].removeAttributeNode(activeNode);
            }
        };
    }

    /**
     * Helper method to init and toggleMenuItem on click.
     * Activates coordInfo crosshairs and menu checkmark.
     */
    toggleActive() {
        this.handler = this.api.click.subscribe(clickEvent => this.clickHandler(clickEvent));

        // set active (checked) in the side menu
        this.button.isActive = true;

        // set cursor
        this._RV.setMapCursor('crosshair');

        // return current identify value and then disable in viewer
        let identifySetting = this.api.layers.identifyMode;
        this.api.layers.identifyMode = 'none';

        return identifySetting;
    }

    /**
     * Manage callback when the map is clicked.
     *
     * @function  clickHandler
     * @param  {Object}  clickEvent the map click event
     */
    clickHandler(clickEvent) {
        // get current language
        const lang = this._RV.getCurrentLang();

        // get point in lat/long
        let pt = clickEvent.xy; //this._RV.projectGeometry(clickEvent.mapPoint, 4326);
        pt.spatialReference = 4326;

        // get point in dms
        const dms = this._RV.convertDDToDMS(pt.y, pt.x);

        // todays date for magnetic declination
        const date = new Date().toISOString().substr(0, 10);

        // get info from services (nts, utm zone, altimetry and magnetic declination)
        const promises = [];
        promises.push(
            new Promise(resolve => {
                $.ajax({
                    url: this.urls.nts,
                    cache: false,
                    data: { bbox: `${pt.x},${pt.y},${pt.x},${pt.y}` },
                    dataType: 'jsonp',
                    success: data => resolve(this.parseNTS(data.features))
                });
            })
        );

        promises.push(
            new Promise(resolve => {
                $.ajax({
                    url: this.urls.utm,
                    cache: false,
                    data: { bbox: `${pt.x},${pt.y},${pt.x},${pt.y}` },
                    dataType: 'jsonp',
                    success: data => resolve(this.parseUtm(data.features, pt))
                });
            })
        );

        promises.push(
            new Promise(resolve => {
                $.ajax({
                    url: this.urls.alti,
                    cache: false,
                    data: { lat: pt.y, lon: pt.x },
                    dataType: 'jsonp',
                    success: data => resolve(data.altitude !== null ? data.altitude : 0)
                });
            })
        );

        promises.push(
            new Promise(resolve => {
                $.ajax({
                    url: this.urls.decli,
                    cache: true,
                    data: { latitude: pt.y, longitude: pt.x, date: date, format: 'json' },
                    dataType: 'jsonp',
                    success: data => resolve(this.parseDecli(data, lang)),
                    error: () => {
                        resolve(undefined);
                    }
                });
            })
        );

        // wait for all promises to resolve then show info
        Promise.all(promises).then(values => {
            this.generateOutput(values, pt, dms, date);
        });
    }

    /**
     * Generate dialog window content.
     *
     * @function  generateOutput
     * @param  {Array}  val the array of response from the promises
     * @param {Object}  pt  the point in decimal degree
     * @param {Object}  dms the point in degree minute second
     * @param {String}  date the today's date
     */
    generateOutput(val, pt, dms, date) {
        let output = template
            // coord
            .replace(/{pt.y}/, pt.y.toFixed(6))
            .replace(/{pt.x}/, pt.x.toFixed(6))
            .replace(/{dms.y}/, dms.y)
            .replace(/{dms.x}/, dms.x)
            // utm
            .replace(/{zone}/, val[1].zone)
            .replace(/{outPt.x}/, val[1].outPt.x)
            .replace(/{outPt.y}/, val[1].outPt.y)
            // nts
            .replace(/{nts250}/, val[0].nts250)
            .replace(/{nts50}/, val[0].nts50)
            // alti
            .replace(/{elevation}/, val[2]);

        // magnetic declination service is only available in http
        // the server seems to also have a tendency to throw 500s
        if (val[3]) {
            let magOutput = magSection
                .replace(/{date}/, date)
                .replace(/{magnetic}/, val[3].magnetic)
                .replace(/{annChange}/, val[3].annChange)
                .replace(/{compass}/, val[3].compass);

            output = output.replace(/{magSection}/, magOutput);
        } else {
            output = output.replace(/{magSection}/, '');
        }

        if (!this.panel) {
            // make sure both header and body have a digest cycle run on them
            this.panel = this.api.panels.create('coord-info');

            this.panel.element.css({
                bottom: '0em',
                width: '400px'
            });

            this.panel.element.addClass('mobile-fullscreen');

            let closeBtn = this.panel.header.closeButton;
            this.panel.header.title = `plugins.coordInfo.coordButtonLabel`;
        } else {
            this.panel.close();
        }
        this.panel.body = output;

        this.panel.open();
    }

    /**
     * Parse NTS answer from the service to generate content.
     *
     * @function  parseNTS
     * @param  {Object}  nts the answer from the service
     * @return {Object}   the nts information (nts250 {String} 250k nts name, nts50 {String} 50k nts name)
     */
    parseNTS(nts) {
        // set 250k
        const nts250 = nts.length > 0 ? `${nts[0].properties.identifier}-${nts[0].properties.name}` : '';

        // set 50k
        const nts50 = nts.length > 1 ? `${nts[1].properties.identifier}-${nts[1].properties.name}` : '';

        return { nts250, nts50 };
    }

    /**
     * Parse UTM answer from the service to generate content.
     *
     * @function  parseUtm
     * @param  {Object}  utm the answer from the service
     * @param  {Object}  pt the point to reproject
     * @return {Object}   the utm information (zone {String} utm zone, x {Number} Easting, y {Number} Northing)
     */
    parseUtm(utm, pt) {
        if (utm.length === 0) {
            return { zone: 'Error', outPt: { x: '-', y: '-' } };
        }

        // set zone
        let zone = utm[0].properties.identifier;

        if (zone < 10) {
            zone = `0${zone}`;
        }

        // set the UTM easting/northing information using a geometry service
        const outPt = this._RV.projectGeometry(pt, parseInt('326' + zone));

        return { zone, outPt: { x: outPt.x, y: outPt.y } };
    }

    /**
     * Parse declination answer from the service to generate content.
     *
     * @function  parseDecli
     * @param  {Object}  decli the answer from the service
     * @param  {String}  lang the current language
     * @return {Object}   the declination information (magnetic {String} magnetic declination, annChange {Number} Annual change, compass {String} Compass information)
     */
    parseDecli(decli, lang) {
        /* jshint -W106 */
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        const magnetic = decli.components.D !== null ? `${decli.components.D}${String.fromCharCode(176)}` : '---';
        const annChange = decli.annual_change.dD !== null ? decli.annual_change.dD : '---';
        const compass =
            decli.compass !== 'useless' ? '' : CoordInfo.prototype.translations[lang].plugin.coordInfo.magCompassOut;

        return { magnetic, annChange, compass };
    }
}

interface CoordInfo {
    api: any;
    translations: any;
    _RV: any;
    handler: any;
    panel: any;
    button: any;
}

CoordInfo.prototype.translations = {
    'en-CA': {
        coordButtonLabel: 'Coords Info',
        title: 'Map location information',
        coordSection: 'Geographic Coordinates',
        coordLat: 'Latitude: ',
        coordLong: 'Longitude: ',
        coordDecimal: 'Degrees Decimal: ',
        coordDMS: 'Degrees Minutes Seconds (DMS): ',
        utmSection: 'UTM Coordinates',
        utmZone: 'Zone: ',
        utmEast: 'Easting: ',
        utmNorth: 'Northing: ',
        ntsSection: 'NTS Mapsheet',
        altiSection: 'Elevation',
        magSection: 'Magnetic declination',
        magDate: 'Date: ',
        magDecli: 'Magnetic declination (DD): ',
        magChange: 'Annual change (minutes/year): ',
        magDecliOut: '-WARNING- Out of scope.',
        magCompassOut: '-WARNING- Compass erratic for this coordinate.'
    },

    'fr-CA': {
        coordButtonLabel: 'Info coords',
        title: 'Information de localisation sur la carte',
        coordSection: 'Coordonnées géographiques',
        coordLat: 'Latitude : ',
        coordLong: 'Longitude : ',
        coordDecimal: 'Degrés décimaux : ',
        coordDMS: 'Degrés minutes secondes (DMS) : ',
        utmSection: 'Coordonnées UTM',
        utmZone: 'Zone : ',
        utmEast: 'Abscisse : ',
        utmNorth: 'Ordonnée : ',
        ntsSection: 'Carte du SNRC',
        altiSection: 'Élévation',
        magSection: 'Déclinaison magnétique',
        magDate: 'Date : ',
        magDecli: 'Déclinaison magnétique (DD) : ',
        magChange: 'Changement annuel (minutes/année) : ',
        magDecliOut: '-ATTENTION- Hors de portée.',
        magCompassOut: '-ATTENTION- Boussole peu fiable pour cette coordonnée.'
    }
};

(<any>window).coordInfo = CoordInfo;
