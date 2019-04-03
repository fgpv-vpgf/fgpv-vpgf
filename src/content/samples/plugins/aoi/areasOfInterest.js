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
/******/ 	return __webpack_require__(__webpack_require__.s = "./areasOfInterest/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./areasOfInterest/html-assets.ts":
/*!****************************************!*\
  !*** ./areasOfInterest/html-assets.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.pinImg = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD+UlEQVRoBe1YPWgUQRTO/aiVEPAwRbSx9g9TCWpzoiZg4Q9RSCUIp9hIQEkuuZDcJRG1i9UZsRBEjGgKwUQlBi3FHxQbg5pKMXIR5ZqQ4+78ns4kk2X29r3dbYI3sMybed/73nvzt7Pb0FAv9RH4v0cgElb6IyMj64rF4r5qtXooEonsBm8Tnma0y6jn0PcN9Us8E6VS6Xl/f/8i5MAllASGhobaEeg1RLORGdF34M739vbeZeJdYYESQOBNCPwm2NtcPdRWTGBmTvX09MzVhrlrfSeQy+UOwPltUCfc6VmaAgahI5PJPGGhHSBfCVDw0Wh0Eo592TtiaMBAVCuVShuSmHTqvNriAAYHB5tB+gFPoxe5UP8L+K3YF18ldlEJmLAYrTuowg6eqBsVN8nsIkpgeHj4OJbNXja7EEjcmOFjEjNRAnBwWULuB4tZuCKxYyeQzWZbkMAWJvk4AtmP9Ryhh2TYjXNsyQf54mAJE+cCEcRhDha4PpzrOROL9hTaU3hvZBBg1tTZZOXrtU3n7GPPAI7NPU5jS3vCGbyJUbpHZp9NRgLsfcZOAI4225yZfXB81WzbZMyAJwY8m2y2tj52AnDsSYpLmue0l8vlN7ZAHH30rmEVdgIYFfFLjxWBHcSOiw3EDBTsvpZ7Y7HYruWWXeJgOL40OzsBTMAnbeRWA3PRTaf7gbmgZbea40vbshPAqLzVRjXqVrxJ+9z0Sud59Wb6+uuG/R4A+gWeTrfgjP4BBLoTo5jHsfmY+nH+H0RQKYhHDFwtkXyxCntj5vP5NYVCYR6BrGcx+wQh8WIikdiQSqVKHAr2EiJCBB/4E9ArKPgY4wZPXOwElONRrwBC0F+XcLCXkCbF+n4Hebtuh1y/x+Vvh4RTOgP0QXNJ4kCC9cMtTgDXhTEENSsJjImdVdxM+D+YOAH8kKrgZso5TmWBgJO4RUYAi/eAdoC98BQyfaiEUZ5h7Sf9EIlnQDvBLJyDLB4xba9rrPsq7kf0kvNVfCeQTqdn4PGGL6+GEc790e7ubs97lmGyQvSdALHE43G6vM2vYJQ1fioOmZWBDpRAV1fXb3CdNfik4hnFIbVbwgdKgFiw+e5hHd9aYmQKZEO2TLgrLHACxIzzm2bho6sXhwLBzygbh0be9H2MOl3hX842nEyv0L/WqXO0F5FAC67a9H81cIkFZlAE09PTP5LJJO2JVg/OTiydhx4Ytjq0GdAe8fFyH0fjUd02a4z8A4y86N+naW+TQ9kDJjHWdgfan80+khH8F6VzqgK1Q08A95kFRHQSD9W6LGBWTiid7gulDj0BigprnDZzO0a9TA/Jqo/Uq6dgP5ymZ/VEXI+0PgKrbwT+AFIjLxu3HbkQAAAAAElFTkSuQmCC\";\r\nexports.noPic = \"\\n                    <li class=\\\"rv-basemap-list-item\\\" style=\\\"height: 50px;\\\">\\n                        <div style=\\\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\\\">\\n                            <div style=\\\"max-height: 50px; max-width: 350px; text-align: center;\\\"></div>\\n                            <div class=\\\"rv-basemap-footer\\\">\\n                                <span>{{ 'plugins.areasOfInterest.areaTitles.{areaIndex}' | translate }}</span>\\n                            </div>\\n\\n                            <button class=\\\"rv-body-button rv-button-square md-button\\\" type=\\\"button\\\"></button>\\n                        </div>\\n                    </li>\\n                    \";\r\nexports.hasPic = \"\\n                        <li class=\\\"rv-basemap-list-item\\\" style=\\\"height: 175px;\\\">\\n                            <div style=\\\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\\\">\\n                                <div style=\\\"max-height: 175px; max-width: 350px; text-align: center;\\\"><img alt=\\\"\\\" src=\\\"{imgSrc}\\\" /></div><div class=\\\"rv-basemap-footer\\\">\\n                                    <span style=\\\"text-overflow:ellipses\\\">{{ 'plugins.areasOfInterest.areaTitles.{areaIndex}' | translate }}</span>\\n                                </div>\\n\\n                                <button class=\\\"rv-body-button rv-button-square md-button\\\" type=\\\"button\\\"></button>\\n                            </div>\\n                        </li>\\n                        \";\r\n\n\n//# sourceURL=webpack:///./areasOfInterest/html-assets.ts?");

/***/ }),

/***/ "./areasOfInterest/index.ts":
/*!**********************************!*\
  !*** ./areasOfInterest/index.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nvar html_assets_1 = __webpack_require__(/*! ./html-assets */ \"./areasOfInterest/html-assets.ts\");\r\nvar AreasOfInterest = /** @class */ (function () {\r\n    function AreasOfInterest() {\r\n    }\r\n    AreasOfInterest.prototype.preInit = function (pluginConfig) {\r\n        var _this = this;\r\n        this.config = pluginConfig;\r\n        // standardize the configuration language titles for translation\r\n        this.config.areas.forEach(function (area, i) {\r\n            Object.keys(area).forEach(function (key) {\r\n                var matchResult = key.match(/title-(.*)/);\r\n                if (matchResult) {\r\n                    var translation = _this.translations[matchResult[1]];\r\n                    translation.areaTitles = translation.areaTitles ? translation.areaTitles : {};\r\n                    translation.areaTitles[i] = area[key];\r\n                    delete area[key];\r\n                }\r\n                else if (key === 'wkid') {\r\n                    area.spatialReference = { wkid: area[key] };\r\n                    delete area[key];\r\n                }\r\n            });\r\n        });\r\n    };\r\n    AreasOfInterest.prototype.init = function (api) {\r\n        var _this = this;\r\n        this.api = api;\r\n        AreasOfInterest.instances[this.api.id] = this;\r\n        var topElement = $('<ul style=\"overflow-y:auto;\" class=\"rv-list rv-basemap-list\"></ul>');\r\n        this.config.areas.forEach(function (area, i) {\r\n            var areaHTML = _this.config.noPicture ? html_assets_1.noPic : html_assets_1.hasPic;\r\n            areaHTML = areaHTML.replace(/{areaIndex}/, i);\r\n            areaHTML = areaHTML.replace(/{imgSrc}/, area.thumbnailUrl || html_assets_1.pinImg);\r\n            topElement.append(areaHTML);\r\n            var currBtn = topElement.find('button').last();\r\n            currBtn.click(function () { return (_this.api.extent = area); });\r\n        });\r\n        this.button = this.api.mapI.addPluginButton(AreasOfInterest.prototype.translations[this._RV.getCurrentLang()].title, this.onMenuItemClick());\r\n        this.makePanel(topElement);\r\n    };\r\n    AreasOfInterest.prototype.destroy = function () {\r\n        this.panel = this.panel.destroy();\r\n    };\r\n    AreasOfInterest.prototype.onMenuItemClick = function () {\r\n        var _this = this;\r\n        return function () {\r\n            _this.button.isActive ? _this.panel.close() : _this.panel.open();\r\n        };\r\n    };\r\n    AreasOfInterest.prototype.makePanel = function (bodyElement) {\r\n        var _this = this;\r\n        // panel is already made\r\n        if (this.panel) {\r\n            return;\r\n        }\r\n        this.panel = this.api.panels.create('area-of-interest');\r\n        this.panel.element.css({\r\n            width: '400px'\r\n        });\r\n        this.panel.element.addClass('mobile-fullscreen');\r\n        if (!this.config.noPicture) {\r\n            this.panel.body.css('padding', '0px');\r\n        }\r\n        this.panel.opening.subscribe(function () {\r\n            _this.button.isActive = true;\r\n        });\r\n        this.panel.closing.subscribe(function () {\r\n            _this.button.isActive = false;\r\n        });\r\n        var closeBtn = this.panel.header.closeButton;\r\n        this.panel.header.title = 'plugins.areasOfInterest.title';\r\n        this.panel.body = bodyElement;\r\n        this.panel.open();\r\n    };\r\n    // A store of the instances of areasOfInterest, 1 per map\r\n    AreasOfInterest.instances = {};\r\n    return AreasOfInterest;\r\n}());\r\nAreasOfInterest.prototype.translations = {\r\n    'en-CA': {\r\n        title: 'Areas of Interest'\r\n    },\r\n    'fr-CA': {\r\n        title: \"Zones d'int\\u00E9r\\u00EAt\"\r\n    }\r\n};\r\nwindow.areasOfInterest = AreasOfInterest;\r\n\n\n//# sourceURL=webpack:///./areasOfInterest/index.ts?");

/***/ })

/******/ });