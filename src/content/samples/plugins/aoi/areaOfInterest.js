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
/******/ 	return __webpack_require__(__webpack_require__.s = "./areaOfInterest/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./areaOfInterest/html-assets.ts":
/*!***************************************!*\
  !*** ./areaOfInterest/html-assets.ts ***!
  \***************************************/
/*! exports provided: pinImg, noPic, hasPic */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"pinImg\", function() { return pinImg; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"noPic\", function() { return noPic; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"hasPic\", function() { return hasPic; });\nconst pinImg = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD+UlEQVRoBe1YPWgUQRTO/aiVEPAwRbSx9g9TCWpzoiZg4Q9RSCUIp9hIQEkuuZDcJRG1i9UZsRBEjGgKwUQlBi3FHxQbg5pKMXIR5ZqQ4+78ns4kk2X29r3dbYI3sMybed/73nvzt7Pb0FAv9RH4v0cgElb6IyMj64rF4r5qtXooEonsBm8Tnma0y6jn0PcN9Us8E6VS6Xl/f/8i5MAllASGhobaEeg1RLORGdF34M739vbeZeJdYYESQOBNCPwm2NtcPdRWTGBmTvX09MzVhrlrfSeQy+UOwPltUCfc6VmaAgahI5PJPGGhHSBfCVDw0Wh0Eo592TtiaMBAVCuVShuSmHTqvNriAAYHB5tB+gFPoxe5UP8L+K3YF18ldlEJmLAYrTuowg6eqBsVN8nsIkpgeHj4OJbNXja7EEjcmOFjEjNRAnBwWULuB4tZuCKxYyeQzWZbkMAWJvk4AtmP9Ryhh2TYjXNsyQf54mAJE+cCEcRhDha4PpzrOROL9hTaU3hvZBBg1tTZZOXrtU3n7GPPAI7NPU5jS3vCGbyJUbpHZp9NRgLsfcZOAI4225yZfXB81WzbZMyAJwY8m2y2tj52AnDsSYpLmue0l8vlN7ZAHH30rmEVdgIYFfFLjxWBHcSOiw3EDBTsvpZ7Y7HYruWWXeJgOL40OzsBTMAnbeRWA3PRTaf7gbmgZbea40vbshPAqLzVRjXqVrxJ+9z0Sud59Wb6+uuG/R4A+gWeTrfgjP4BBLoTo5jHsfmY+nH+H0RQKYhHDFwtkXyxCntj5vP5NYVCYR6BrGcx+wQh8WIikdiQSqVKHAr2EiJCBB/4E9ArKPgY4wZPXOwElONRrwBC0F+XcLCXkCbF+n4Hebtuh1y/x+Vvh4RTOgP0QXNJ4kCC9cMtTgDXhTEENSsJjImdVdxM+D+YOAH8kKrgZso5TmWBgJO4RUYAi/eAdoC98BQyfaiEUZ5h7Sf9EIlnQDvBLJyDLB4xba9rrPsq7kf0kvNVfCeQTqdn4PGGL6+GEc790e7ubs97lmGyQvSdALHE43G6vM2vYJQ1fioOmZWBDpRAV1fXb3CdNfik4hnFIbVbwgdKgFiw+e5hHd9aYmQKZEO2TLgrLHACxIzzm2bho6sXhwLBzygbh0be9H2MOl3hX842nEyv0L/WqXO0F5FAC67a9H81cIkFZlAE09PTP5LJJO2JVg/OTiydhx4Ytjq0GdAe8fFyH0fjUd02a4z8A4y86N+naW+TQ9kDJjHWdgfan80+khH8F6VzqgK1Q08A95kFRHQSD9W6LGBWTiid7gulDj0BigprnDZzO0a9TA/Jqo/Uq6dgP5ymZ/VEXI+0PgKrbwT+AFIjLxu3HbkQAAAAAElFTkSuQmCC`;\r\nconst noPic = `\r\n                    <li class=\"rv-basemap-list-item\" style=\"height: 50px;\">\r\n                        <div style=\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\">\r\n                            <div style=\"max-height: 50px; max-width: 350px; text-align: center;\"></div>\r\n                            <div class=\"rv-basemap-footer\">\r\n                                <span>{{ 't.areaTitles.{areaIndex}' | translate }}</span>\r\n                            </div>\r\n                        \r\n                            <button class=\"rv-body-button rv-button-square md-button\" type=\"button\"></button>\r\n                        </div>\r\n                    </li>\r\n                    `;\r\nconst hasPic = `\r\n                        <li class=\"rv-basemap-list-item\" style=\"height: 175px;\">\r\n                            <div style=\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\">\r\n                                <div style=\"max-height: 175px; max-width: 350px; text-align: center;\"><img alt=\"\" src=\"{imgSrc}\" /></div><div class=\"rv-basemap-footer\">\r\n                                    <span style=\"text-overflow:ellipses\">{{ 't.areaTitles.{areaIndex}' | translate }}</span>\r\n                                </div>\r\n                                \r\n                                <button class=\"rv-body-button rv-button-square md-button\" type=\"button\"></button>\r\n                            </div>\r\n                        </li>\r\n                        `;\r\n\n\n//# sourceURL=webpack:///./areaOfInterest/html-assets.ts?");

/***/ }),

/***/ "./areaOfInterest/index.ts":
/*!*********************************!*\
  !*** ./areaOfInterest/index.ts ***!
  \*********************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _html_assets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./html-assets */ \"./areaOfInterest/html-assets.ts\");\n\r\nclass AreasOfInterest {\r\n    preInit() {\r\n        this.config = Object.assign({}, window.aioConfig);\r\n        // standardize the configuration language titles for translation\r\n        this.config.areas.forEach((area, i) => {\r\n            Object.keys(area).forEach(key => {\r\n                const matchResult = key.match(/title-(.*)/);\r\n                if (matchResult) {\r\n                    const translation = this.translations[matchResult[1]];\r\n                    translation.areaTitles = translation.areaTitles ? translation.areaTitles : {};\r\n                    translation.areaTitles[i] = area[key];\r\n                    delete area[key];\r\n                }\r\n                else if (key === 'wkid') {\r\n                    area.spatialReference = { wkid: area[key] };\r\n                    delete area[key];\r\n                }\r\n            });\r\n        });\r\n    }\r\n    init(api) {\r\n        this.api = api;\r\n        const topElement = $('<ul style=\"overflow-y:auto;\" class=\"rv-list rv-basemap-list\"></ul>');\r\n        this.config.areas.forEach((area, i) => {\r\n            let areaHTML = this.config.noPicture ? _html_assets__WEBPACK_IMPORTED_MODULE_0__[\"noPic\"] : _html_assets__WEBPACK_IMPORTED_MODULE_0__[\"hasPic\"];\r\n            areaHTML = areaHTML.replace(/{areaIndex}/, i);\r\n            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || _html_assets__WEBPACK_IMPORTED_MODULE_0__[\"pinImg\"]);\r\n            topElement.append(this.api.$(areaHTML));\r\n            const currBtn = topElement.find('button').last();\r\n            currBtn.click(() => (this.api.extent = area));\r\n        });\r\n        this.makePanel(topElement);\r\n    }\r\n    makePanel(bodyElement) {\r\n        // panel is already made\r\n        if (this.panel) {\r\n            return;\r\n        }\r\n        this.panel = this.api.createPanel('area-of-interest');\r\n        this.panel.position([420, 0], [720, this.api.div.height() - 62]);\r\n        if (!this.config.noPicture) {\r\n            this.panel.panelBody.css('padding', '0px');\r\n        }\r\n        let closeBtn = new this.panel.button('X');\r\n        closeBtn.element.css('float', 'right');\r\n        this.panel.open();\r\n        this.panel.controls = [\r\n            new this.panel.container(`<h2 style=\"font-weight: normal;display:inline;vertical-align:middle\">{{ 't.title' | translate }}</h2>`),\r\n            closeBtn\r\n        ];\r\n        this.panel.content = new this.panel.container(bodyElement);\r\n    }\r\n}\r\nAreasOfInterest.prototype.translations = {\r\n    'en-CA': {\r\n        title: 'Areas of Interest'\r\n    },\r\n    'fr-CA': {\r\n        title: `Zones d'intérêt`\r\n    }\r\n};\r\nwindow.areaOfInterest = AreasOfInterest;\r\n\n\n//# sourceURL=webpack:///./areaOfInterest/index.ts?");

/***/ })

/******/ });