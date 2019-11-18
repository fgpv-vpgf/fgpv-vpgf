/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./coordInfo/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./coordInfo/html-assets.ts":
/*!**********************************!*\
  !*** ./coordInfo/html-assets.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.template = \"<div tabindex=\\\"-2\\\"><ul class=\\\"rv-list\\\">\\n    <li>\\n        <strong>{{ 'plugins.coordInfo.coordSection' | translate }}</strong>\\n        <div class=\\\"rv-subsection\\\">\\n            <div>{{ 'plugins.coordInfo.coordDecimal' | translate }}</div>\\n            <div class=\\\"rv-subsection\\\">\\n            <div>{{ 'plugins.coordInfo.coordLat' | translate }}{pt.y}</div>\\n            <div>{{ 'plugins.coordInfo.coordLong' | translate }}{pt.x}</div>\\n            </div>\\n            <div>{{ 'plugins.coordInfo.coordDMS' | translate }}</div>\\n            <div class=\\\"rv-subsection\\\">\\n            <div>{{ 'plugins.coordInfo.coordLat' | translate }}{dms.y}</div>\\n            <div>{{ 'plugins.coordInfo.coordLong' | translate}}{dms.x}</div>\\n            </div>\\n        </div>\\n    </li>\\n    <li>\\n        <strong>{{ 'plugins.coordInfo.utmSection' | translate }}</strong>\\n        <div class=\\\"rv-subsection\\\">\\n            <div>{{ 'plugins.coordInfo.utmZone' | translate }}{zone}</div>\\n            <div>{{ 'plugins.coordInfo.utmEast' | translate }}{outPt.x}</div>\\n            <div>{{ 'plugins.coordInfo.utmNorth' | translate }}{outPt.y}</div>\\n        </div>\\n    </li>\\n    <li>\\n        <strong>{{ 'plugins.coordInfo.ntsSection' | translate }}</strong>\\n        <div class=\\\"rv-subsection\\\">\\n            <div>{nts250}</div>\\n            <div>{nts50}</div>\\n        </div>\\n    </li>\\n    <li>\\n        <strong>{{ 'plugins.coordInfo.altiSection' | translate }}</strong>\\n        <div class=\\\"rv-subsection\\\">{elevation} m</div>\\n    </li>\\n    {magSection}\\n</ul></div>\";\r\nexports.magSection = \"<li>\\n<strong>{{ 'plugins.coordInfo.magSection' | translate }}</strong>\\n<div class=\\\"rv-subsection\\\">\\n    <div>{{ 'plugins.coordInfo.magDate' | translate }}{date}</div>\\n    <div>{{ 'plugins.coordInfo.magDecli' | translate }}{magnetic}</div>\\n    <div>{{ 'plugins.coordInfo.magChange' | translate }}{annChange}</div>\\n    <div>{compass}</div>\\n</div>\\n</li>\";\r\n\n\n//# sourceURL=webpack:///./coordInfo/html-assets.ts?");

/***/ }),

/***/ "./coordInfo/index.ts":
/*!****************************!*\
  !*** ./coordInfo/index.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nvar html_assets_1 = __webpack_require__(/*! ./html-assets */ \"./coordInfo/html-assets.ts\");\r\nvar CoordInfo = /** @class */ (function () {\r\n    function CoordInfo() {\r\n        this.urls = {\r\n            nts: 'https://geogratis.gc.ca/services/delimitation/en/nts?',\r\n            utm: 'https://geogratis.gc.ca/services/delimitation/en/utmzone?',\r\n            alti: 'https://geogratis.gc.ca/services/elevation/cdem/altitude?',\r\n            decli: 'https://geomag.nrcan.gc.ca/service/tools/magnetic/calculator/?'\r\n        };\r\n    }\r\n    CoordInfo.prototype.init = function (api) {\r\n        this.api = api;\r\n        this.button = this.api.mapI.addPluginButton(CoordInfo.prototype.translations[this._RV.getCurrentLang()].coordButtonLabel, this.onMenuItemClick());\r\n        // check to see if this init is due to projection change or language switch\r\n        var activeNode = this.api.mapDiv[0].getAttributeNode('coord-info-active');\r\n        if (activeNode !== null) {\r\n            this.api.layers.identifyMode = 'none';\r\n            // if coordinate info was active, turn it on again\r\n            if (this.panel !== undefined) {\r\n                // destroy old panel so that new one gets created\r\n                this.panel.close({ destroy: true });\r\n                this.panel = undefined;\r\n            }\r\n            this.toggleActive();\r\n        }\r\n    };\r\n    /**\r\n     * Returns a function to be executed when the map is clicked.\r\n     *\r\n     * @function  onMenuItemClick\r\n     * @return  {Function}    Callback to be executed when map is clicked\r\n     */\r\n    CoordInfo.prototype.onMenuItemClick = function () {\r\n        var _this = this;\r\n        var identifySetting;\r\n        return function () {\r\n            _this._RV.toggleSideNav('close');\r\n            // only set event if not already created\r\n            if (typeof _this.handler === 'undefined') {\r\n                // activate coordInfo crosshairs, store current identify value\r\n                identifySetting = _this.toggleActive();\r\n                //set coord-info-active attr on map\r\n                var activeNode = document.createAttribute('coord-info-active');\r\n                _this.api.mapDiv[0].setAttributeNode(activeNode);\r\n            }\r\n            else {\r\n                // remove the click handler and set the cursor\r\n                _this.handler.unsubscribe();\r\n                _this.handler = undefined;\r\n                _this._RV.setMapCursor('');\r\n                // set inactive (unchecked) in the side menu\r\n                _this.button.isActive = false;\r\n                // reset identify value to stored value\r\n                _this.api.layers.identifyMode = identifySetting;\r\n                //remove coord-info-active attr on map\r\n                var activeNode = _this.api.mapDiv[0].getAttributeNode('coord-info-active');\r\n                _this.api.mapDiv[0].removeAttributeNode(activeNode);\r\n            }\r\n        };\r\n    };\r\n    /**\r\n     * Helper method to init and toggleMenuItem on click.\r\n     * Activates coordInfo crosshairs and menu checkmark.\r\n     */\r\n    CoordInfo.prototype.toggleActive = function () {\r\n        var _this = this;\r\n        this.handler = this.api.click.subscribe(function (clickEvent) { return _this.clickHandler(clickEvent); });\r\n        // set active (checked) in the side menu\r\n        this.button.isActive = true;\r\n        // set cursor\r\n        this._RV.setMapCursor('crosshair');\r\n        // return current identify value and then disable in viewer\r\n        var identifySetting = this.api.layers.identifyMode;\r\n        this.api.layers.identifyMode = 'none';\r\n        return identifySetting;\r\n    };\r\n    /**\r\n     * Manage callback when the map is clicked.\r\n     *\r\n     * @function  clickHandler\r\n     * @param  {Object}  clickEvent the map click event\r\n     */\r\n    CoordInfo.prototype.clickHandler = function (clickEvent) {\r\n        var _this = this;\r\n        // get current language\r\n        var lang = this._RV.getCurrentLang();\r\n        // get point in lat/long\r\n        var pt = clickEvent.xy; //this._RV.projectGeometry(clickEvent.mapPoint, 4326);\r\n        pt.spatialReference = 4326;\r\n        // get point in dms\r\n        var dms = this._RV.convertDDToDMS(pt.y, pt.x);\r\n        // todays date for magnetic declination\r\n        var date = new Date().toISOString().substr(0, 10);\r\n        // get info from services (nts, utm zone, altimetry and magnetic declination)\r\n        var promises = [];\r\n        promises.push(new Promise(function (resolve) {\r\n            $.ajax({\r\n                url: _this.urls.nts,\r\n                cache: false,\r\n                data: { bbox: pt.x + \",\" + pt.y + \",\" + pt.x + \",\" + pt.y },\r\n                dataType: 'jsonp',\r\n                success: function (data) { return resolve(_this.parseNTS(data.features)); }\r\n            });\r\n        }));\r\n        promises.push(new Promise(function (resolve) {\r\n            $.ajax({\r\n                url: _this.urls.utm,\r\n                cache: false,\r\n                data: { bbox: pt.x + \",\" + pt.y + \",\" + pt.x + \",\" + pt.y },\r\n                dataType: 'jsonp',\r\n                success: function (data) { return resolve(_this.parseUtm(data.features, pt)); }\r\n            });\r\n        }));\r\n        promises.push(new Promise(function (resolve) {\r\n            $.ajax({\r\n                url: _this.urls.alti,\r\n                cache: false,\r\n                data: { lat: pt.y, lon: pt.x },\r\n                dataType: 'jsonp',\r\n                success: function (data) { return resolve(data.altitude !== null ? data.altitude : 0); }\r\n            });\r\n        }));\r\n        promises.push(new Promise(function (resolve) {\r\n            $.ajax({\r\n                url: _this.urls.decli,\r\n                cache: true,\r\n                data: { latitude: pt.y, longitude: pt.x, date: date, format: 'json' },\r\n                dataType: 'jsonp',\r\n                success: function (data) { return resolve(_this.parseDecli(data, lang)); },\r\n                error: function () {\r\n                    resolve(undefined);\r\n                }\r\n            });\r\n        }));\r\n        // wait for all promises to resolve then show info\r\n        Promise.all(promises).then(function (values) {\r\n            _this.generateOutput(values, pt, dms, date);\r\n        });\r\n    };\r\n    /**\r\n     * Generate dialog window content.\r\n     *\r\n     * @function  generateOutput\r\n     * @param  {Array}  val the array of response from the promises\r\n     * @param {Object}  pt  the point in decimal degree\r\n     * @param {Object}  dms the point in degree minute second\r\n     * @param {String}  date the today's date\r\n     */\r\n    CoordInfo.prototype.generateOutput = function (val, pt, dms, date) {\r\n        var output = html_assets_1.template\r\n            // coord\r\n            .replace(/{pt.y}/, pt.y.toFixed(6))\r\n            .replace(/{pt.x}/, pt.x.toFixed(6))\r\n            .replace(/{dms.y}/, dms.y)\r\n            .replace(/{dms.x}/, dms.x)\r\n            // utm\r\n            .replace(/{zone}/, val[1].zone)\r\n            .replace(/{outPt.x}/, val[1].outPt.x)\r\n            .replace(/{outPt.y}/, val[1].outPt.y)\r\n            // nts\r\n            .replace(/{nts250}/, val[0].nts250)\r\n            .replace(/{nts50}/, val[0].nts50)\r\n            // alti\r\n            .replace(/{elevation}/, val[2]);\r\n        // magnetic declination service is only available in http\r\n        // the server seems to also have a tendency to throw 500s\r\n        if (val[3]) {\r\n            var magOutput = html_assets_1.magSection\r\n                .replace(/{date}/, date)\r\n                .replace(/{magnetic}/, val[3].magnetic)\r\n                .replace(/{annChange}/, val[3].annChange)\r\n                .replace(/{compass}/, val[3].compass);\r\n            output = output.replace(/{magSection}/, magOutput);\r\n        }\r\n        else {\r\n            output = output.replace(/{magSection}/, '');\r\n        }\r\n        if (!this.panel) {\r\n            // make sure both header and body have a digest cycle run on them\r\n            this.panel = this.api.panels.create('coord-info');\r\n            this.panel.element.css({\r\n                bottom: '0em',\r\n                width: '400px'\r\n            });\r\n            this.panel.element.addClass('mobile-fullscreen');\r\n            var closeBtn = this.panel.header.closeButton;\r\n            this.panel.header.title = \"plugins.coordInfo.coordButtonLabel\";\r\n        }\r\n        else {\r\n            this.panel.close();\r\n        }\r\n        this.panel.body = output;\r\n        this.panel.open();\r\n    };\r\n    /**\r\n     * Parse NTS answer from the service to generate content.\r\n     *\r\n     * @function  parseNTS\r\n     * @param  {Object}  nts the answer from the service\r\n     * @return {Object}   the nts information (nts250 {String} 250k nts name, nts50 {String} 50k nts name)\r\n     */\r\n    CoordInfo.prototype.parseNTS = function (nts) {\r\n        // set 250k\r\n        var nts250 = nts.length > 0 ? nts[0].properties.identifier + \"-\" + nts[0].properties.name : '';\r\n        // set 50k\r\n        var nts50 = nts.length > 1 ? nts[1].properties.identifier + \"-\" + nts[1].properties.name : '';\r\n        return { nts250: nts250, nts50: nts50 };\r\n    };\r\n    /**\r\n     * Parse UTM answer from the service to generate content.\r\n     *\r\n     * @function  parseUtm\r\n     * @param  {Object}  utm the answer from the service\r\n     * @param  {Object}  pt the point to reproject\r\n     * @return {Object}   the utm information (zone {String} utm zone, x {Number} Easting, y {Number} Northing)\r\n     */\r\n    CoordInfo.prototype.parseUtm = function (utm, pt) {\r\n        if (utm.length === 0) {\r\n            return { zone: 'Error', outPt: { x: '-', y: '-' } };\r\n        }\r\n        // set zone\r\n        var zone = utm[0].properties.identifier;\r\n        if (zone < 10) {\r\n            zone = \"0\" + zone;\r\n        }\r\n        // set the UTM easting/northing information using a geometry service\r\n        var outPt = this._RV.projectGeometry(pt, parseInt('326' + zone));\r\n        return { zone: zone, outPt: { x: outPt.x, y: outPt.y } };\r\n    };\r\n    /**\r\n     * Parse declination answer from the service to generate content.\r\n     *\r\n     * @function  parseDecli\r\n     * @param  {Object}  decli the answer from the service\r\n     * @param  {String}  lang the current language\r\n     * @return {Object}   the declination information (magnetic {String} magnetic declination, annChange {Number} Annual change, compass {String} Compass information)\r\n     */\r\n    CoordInfo.prototype.parseDecli = function (decli, lang) {\r\n        /* jshint -W106 */\r\n        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */\r\n        var magnetic = decli.components.D !== null ? \"\" + decli.components.D + String.fromCharCode(176) : '---';\r\n        var annChange = decli.annual_change.dD !== null ? decli.annual_change.dD : '---';\r\n        var compass = decli.compass !== 'useless' ? '' : CoordInfo.prototype.translations[lang].plugin.coordInfo.magCompassOut;\r\n        return { magnetic: magnetic, annChange: annChange, compass: compass };\r\n    };\r\n    return CoordInfo;\r\n}());\r\nCoordInfo.prototype.translations = {\r\n    'en-CA': {\r\n        coordButtonLabel: 'Coords Info',\r\n        title: 'Map location information',\r\n        coordSection: 'Geographic Coordinates',\r\n        coordLat: 'Latitude: ',\r\n        coordLong: 'Longitude: ',\r\n        coordDecimal: 'Degrees Decimal: ',\r\n        coordDMS: 'Degrees Minutes Seconds (DMS): ',\r\n        utmSection: 'UTM Coordinates',\r\n        utmZone: 'Zone: ',\r\n        utmEast: 'Easting: ',\r\n        utmNorth: 'Northing: ',\r\n        ntsSection: 'NTS Mapsheet',\r\n        altiSection: 'Elevation',\r\n        magSection: 'Magnetic declination',\r\n        magDate: 'Date: ',\r\n        magDecli: 'Magnetic declination (DD): ',\r\n        magChange: 'Annual change (minutes/year): ',\r\n        magDecliOut: '-WARNING- Out of scope.',\r\n        magCompassOut: '-WARNING- Compass erratic for this coordinate.'\r\n    },\r\n    'fr-CA': {\r\n        coordButtonLabel: 'Info coords',\r\n        title: 'Information de localisation sur la carte',\r\n        coordSection: 'Coordonnées géographiques',\r\n        coordLat: 'Latitude : ',\r\n        coordLong: 'Longitude : ',\r\n        coordDecimal: 'Degrés décimaux : ',\r\n        coordDMS: 'Degrés minutes secondes (DMS) : ',\r\n        utmSection: 'Coordonnées UTM',\r\n        utmZone: 'Zone : ',\r\n        utmEast: 'Abscisse : ',\r\n        utmNorth: 'Ordonnée : ',\r\n        ntsSection: 'Carte du SNRC',\r\n        altiSection: 'Élévation',\r\n        magSection: 'Déclinaison magnétique',\r\n        magDate: 'Date : ',\r\n        magDecli: 'Déclinaison magnétique (DD) : ',\r\n        magChange: 'Changement annuel (minutes/année) : ',\r\n        magDecliOut: '-ATTENTION- Hors de portée.',\r\n        magCompassOut: '-ATTENTION- Boussole peu fiable pour cette coordonnée.'\r\n    }\r\n};\r\nwindow.coordInfo = CoordInfo;\r\n\n\n//# sourceURL=webpack:///./coordInfo/index.ts?");

/***/ })

/******/ });