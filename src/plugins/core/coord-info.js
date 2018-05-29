/* global RV */
(() => {
    // define english/french translations for use inside plugin
    const translations = {
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

    // urls for services to get information about
    const urls = {
        nts: 'http://geogratis.gc.ca/services/delimitation/en/nts?',
        utm: 'http://geogratis.gc.ca/services/delimitation/en/utmzone?',
        alti: 'http://geogratis.gc.ca/services/elevation/cdem/altitude?',
        decli: 'http://geomag.nrcan.gc.ca/service/tools/magnetic/calculator/?'
    };

    let self;
    let handler;
    let addStyle = false;

    class CoordInfo extends RV.BasePlugins.MenuItem {
        /**
         * Returns a function to be executed when the map is clicked.
         *
         * @function  onMenuItemClick
         * @return  {Function}    Callback to be executed when map is clicked
         */
        onMenuItemClick () {
            let identifySetting;
            return () => {
                this.api.toggleSideNav('close');

                // only set event if not already created
                if (typeof handler === 'undefined') {
                    handler = this.api.getMapClickInfo(this.clickHandlerBuilder);

                    // set cursor
                    self.setMapCursor('crosshair');

                    // set active (checked) in the side menu
                    this.isActive = true;

                    // store current identify value and then disable in viewer
                    identifySetting = self.appInfo.mapi.layers.identifyMode;
                    self.appInfo.mapi.layers.identifyMode = 'none';
                } else {
                    // remove the click handler and set the cursor
                    handler.click.remove();
                    handler = undefined;
                    self.setMapCursor('');

                    // set inactive (unchecked) in the side menu
                    this.isActive = false;

                    // reset identify value to stored value
                    self.appInfo.mapi.layers.identifyMode = identifySetting;
                }
            };
        }

        /**
         * Manage callback when the map is clicked.
         *
         * @function  clickHandlerBuilder
         * @param  {Object}  clickEvent the map click event
         */
        clickHandlerBuilder (clickEvent) {
            // get current language
            const lang = self.getCurrentLang();

            // get point in lat/long
            const pt = self.projectGeometry(clickEvent.mapPoint, 4326);

            // get point in dms
            const dms = self.convertDDToDMS(pt.y, pt.x);

            // todays date for magnetic declination
            const date = new Date().toISOString().substr(0, 10);

            // get info from services (nts, utm zone, altimetry and magnetic declination)
            const promises = [];
            promises.push(new Promise(resolve => {
                $.ajax({
                    url: urls.nts,
                    cache: false,
                    data: { bbox: `${pt.x},${pt.y},${pt.x},${pt.y}` },
                    dataType: 'jsonp',
                    success: data => resolve(parseNTS(data.features))
                });
            }));

            promises.push(new Promise(resolve => {
                $.ajax({
                    url: urls.utm,
                    cache: false,
                    data: { bbox: `${pt.x},${pt.y},${pt.x},${pt.y}` },
                    dataType: 'jsonp',
                    success: data => resolve(parseUtm(data.features, pt))
                });
            }));

            promises.push(new Promise(resolve => {
                $.ajax({
                    url: urls.alti,
                    cache: false,
                    data: { lat: pt.y, lon: pt.x },
                    dataType: 'jsonp',
                    success: data => resolve(data.altitude !== null ? data.altitude : 0)
                });
            }));

            promises.push(new Promise(resolve => {
                $.ajax({
                    url: urls.decli,
                    cache: true,
                    data: { latitude: pt.y, longitude: pt.x, date: date, format: 'json' },
                    dataType: 'jsonp',
                    success: data => resolve(parseDecli(data, lang))
                });
            }));

            // wait for all promises to resolve then show info
            Promise.all(promises).then(values => {
                generateOutput(values, pt, dms, date, lang);
            });
        }

        init () {
            self = this.api;
            this.name = 'coordButtonLabel';
            this.translations = translations;
            this.action = this.onMenuItemClick();
        }
    }

    /**
     * Generate dialog window content.
     *
     * @function  generateOutput
     * @param  {Array}  val the array of response from the promises
     * @param {Object}  pt  the point in decimal degree
     * @param {Object}  dms the point in degree minute second
     * @param {String}  date the today's date
     * @param {String} lang  the current language
     */
    function generateOutput(val, pt, dms, date, lang) {
        // get current translation
        const trans = translations[lang].plugin.coordInfo;

        const coord = `<li>
                            <strong>${trans.coordSection}</strong>
                            <div class="rv-subsection">
                                <div>${trans.coordDecimal}</div>
                                <div>${trans.coordLat}${pt.y.toFixed(6)}</div>
                                <div>${trans.coordLong}${pt.x.toFixed(6)}</div>
                                <div>${trans.coordDMS}</div>
                                <div>${trans.coordLat}${dms.y}</div>
                                <div>${trans.coordLong}${dms.x}</div>
                            </div>
                        </li>`;

        const utm = `<li>
                            <strong>${trans.utmSection}</strong>
                            <div class="rv-subsection">
                                <div>${trans.utmZone}${val[1].zone}</div>
                                <div>${trans.utmEast}${val[1].outPt.x}</div>
                                <div>${trans.utmNorth}${val[1].outPt.y}</div>
                            </div>
                    </li>`;

        const nts = `<li>
                            <strong>${trans.ntsSection}</strong>
                            <div class="rv-subsection">
                                <div>${val[0].nts250}</div>
                                <div>${val[0].nts50}</div>
                            </div>
                    </li>`;

        const alti = `<li>
                            <div><strong>${trans.altiSection}</strong>
                            <div class="rv-subsection">${val[2]} m</div>
                    </li>`;

        const mag = `<li>
                            <div><strong>${trans.magSection}</strong>
                            <div class="rv-subsection">
                                <div>${trans.magDate}${date}</div>
                                <div>${trans.magDecli}${val[3].magnetic}</div>
                                <div>${trans.magChange}${val[3].annChange}</div>
                                <div>${val[3].compass}</div>
                            </div>
                    </li>`;

        // set controller template
        const template = `<md-dialog class="side-nav-plugin">
                <rv-content-pane close-panel="self.close()" title-style="title" title-value="{{ self.title }}">
                    <!-- set tabIndex, if not focus is not trap. Also let keyboard user focus text to scroll -->
                    <p class="rv-plugin" ng-bind-html="self.content" tabindex="-2"></p>
                </rv-content-pane>
            </md-dialog>`;

        // set controller locals
        const items = {
            title: trans.title,
            content: `<ul class="rv-list">${coord}${utm}${nts}${alti}${mag}</ul>`
        };

        // set style
        if (!addStyle) {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '.side-nav-plugin { height: 80%; width: 40%; border-radius: 0; }';
            document.getElementsByTagName('head')[0].appendChild(style);
            addStyle = true;
        }

        // open info
        self.openDialogInfo({ items, template });
    }

    /**
     * Parse NTS answer from the service to generate content.
     *
     * @function  parseNTS
     * @param  {Object}  nts the answer from the service
     * @return {Object}   the nts information (nts250 {String} 250k nts name, nts50 {String} 50k nts name)
     */
    function parseNTS(nts) {
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
    function parseUtm(utm, pt) {
        if (utm.length === 0) {
            return { zone: 'Error', outPt: { x: '-', y: '-' } };
        }

        // set zone
        let zone = utm[0].properties.identifier;

        if (zone < 10) {
            zone = `0${zone}`;
        }

        // set the UTM easting/northing information using a geometry service
        const outPt = self.projectGeometry(pt, parseInt('326' + zone));

        return { zone, outPt: { x: outPt.x, y: outPt.y } };
    }

    /**
     * Parse declination answer from the service to generate content.
     *
     * @function  parseDecli
     * @param  {Object}  decli the answer from the service
     * @return {Object}   the declination information (magnetic {String} magnetic declination, annChange {Number} Annual change, compass {String} Compass information)
     */
    function parseDecli(decli, lang) {
        /* jshint -W106 */
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        const magnetic = decli.components.D !== null ? `${decli.components.D}${String.fromCharCode(176)}` : '---';
        const annChange = decli.annual_change.dD !== null ? decli.annual_change.dD : '---';
        const compass = decli.compass !== 'useless' ? '' : translations[lang].plugin.coordInfo.magCompassOut;

        return { magnetic, annChange, compass };
    }

    // Register this plugin with global plugins namespace
    RV.Plugins.CoordInfo = CoordInfo;
})();
