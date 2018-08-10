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
/******/ 	return __webpack_require__(__webpack_require__.s = "./areaOfInterest/areas-of-interest.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./areaOfInterest/areas-of-interest.ts":
/*!*********************************************!*\
  !*** ./areaOfInterest/areas-of-interest.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

  "use strict";
  eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nvar html_assets_1 = __webpack_require__(/*! ./html-assets */ \"./areaOfInterest/html-assets.ts\");\r\nvar AreasOfInterest = /** @class */ (function () {\r\n    function AreasOfInterest() {\r\n    }\r\n    AreasOfInterest.prototype.preInit = function (config) {\r\n        this.config = config;\r\n    };\r\n    AreasOfInterest.prototype.init = function (api) {\r\n        //initialize attributes\r\n        var map = api; // map object that rv-extension loads into this file\r\n        var mapConfig = JSON.parse(document.getElementById('aoi-config').innerHTML);\r\n        var zones = mapConfig.areas;\r\n        var noPic = mapConfig.noPicture;\r\n        var wkid = mapConfig.wkid;\r\n        var zoneList = ' ';\r\n        var title = this.translations[this.config.language]['title'];\r\n        var topElement = document.createElement('div');\r\n        //if areas of interest provided, create panel contents\r\n        if (zones !== undefined) {\r\n            var count = 0;\r\n            var _loop_1 = function (zone) {\r\n                count += 1;\r\n                var img = (zone.thumbnailUrl !== '') ? zone.thumbnailUrl : html_assets_1.pinImg;\r\n                var zoneImg = \"src=\\\"\" + img + \"\\\"\";\r\n                var zoneTitle = \"\" + zone.title;\r\n                //if thumbnail pictures disabled show list of areas as black buttons\r\n                if (noPic) {\r\n                    zoneList = html_assets_1.noPicHTML1 + zoneTitle + html_assets_1.HTMLmiddle + (\"id=\\\"btn\" + count + \"\\\"\") + html_assets_1.HTMLmiddle2 + html_assets_1.HTMLend;\r\n                    $(topElement).append(zoneList);\r\n                }\r\n                //else show list of areas with thumbnails\r\n                else {\r\n                    zoneList = html_assets_1.picHTML1 + zoneImg + html_assets_1.picHTML2 + zoneTitle + html_assets_1.HTMLmiddle + (\"id=\\\"btn\" + count + \"\\\"\") + html_assets_1.HTMLmiddle2 + html_assets_1.HTMLend;\r\n                    $(topElement).append(zoneList);\r\n                }\r\n                var currBtn = topElement.querySelector(\"#btn\" + count);\r\n                currBtn.onclick = function () { return map.setExtent(zone.xmin, zone.xmax, zone.ymin, zone.ymax, wkid); };\r\n            };\r\n            for (var _i = 0, zones_1 = zones; _i < zones_1.length; _i++) {\r\n                var zone = zones_1[_i];\r\n                _loop_1(zone);\r\n            }\r\n        }\r\n        //if an area of interest panel exists on map close the panel\r\n        var panel0 = map.panelRegistry.find(function (panel) {\r\n            if (panel.id === 'area-of-interest') {\r\n                panel.close();\r\n                return panel;\r\n            }\r\n        });\r\n        //if it doesn't exist, create one\r\n        if (!panel0) {\r\n            panel0 = map.createPanel('area-of-interest');\r\n        }\r\n        //then open the panel\r\n        var height = $('#' + map.id).height();\r\n        if (height) {\r\n            panel0.position([-10, -10], [290, height - 52]);\r\n        }\r\n        var closeBtn = new panel0.button('X');\r\n        closeBtn.element.css('float', 'right');\r\n        panel0.open();\r\n        //set controls (close button and title), and content (areas of interest)\r\n        panel0.controls = [new panel0.button(''), new panel0.container(\"<h2 style=\\\"font-weight: normal;display:inline;vertical-align:middle\\\">\" + title + \"</h2>\"), closeBtn];\r\n        var panelContent = document.createElement('ul');\r\n        panelContent.style.overflowY = \"auto\";\r\n        panelContent.classList.add('rv-list');\r\n        panelContent.classList.add('rv-basemap-list');\r\n        $(panelContent).append(topElement);\r\n        panel0.content = new panel0.container(panelContent);\r\n    };\r\n    return AreasOfInterest;\r\n}());\r\n;\r\nAreasOfInterest.prototype.translations = {\r\n    'en-CA': {\r\n        'title': 'Areas of Interest'\r\n    },\r\n    'fr-CA': {\r\n        'title': 'Zones d\\'intérêt'\r\n    }\r\n};\r\nwindow.areaOfInterest = AreasOfInterest;\r\n\n\n//# sourceURL=webpack:///./areaOfInterest/areas-of-interest.ts?");
  
  /***/ }),
  
  /***/ "./areaOfInterest/html-assets.ts":
  /*!***************************************!*\
    !*** ./areaOfInterest/html-assets.ts ***!
    \***************************************/
  /*! no static exports found */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.pinImg = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD+UlEQVRoBe1YPWgUQRTO/aiVEPAwRbSx9g9TCWpzoiZg4Q9RSCUIp9hIQEkuuZDcJRG1i9UZsRBEjGgKwUQlBi3FHxQbg5pKMXIR5ZqQ4+78ns4kk2X29r3dbYI3sMybed/73nvzt7Pb0FAv9RH4v0cgElb6IyMj64rF4r5qtXooEonsBm8Tnma0y6jn0PcN9Us8E6VS6Xl/f/8i5MAllASGhobaEeg1RLORGdF34M739vbeZeJdYYESQOBNCPwm2NtcPdRWTGBmTvX09MzVhrlrfSeQy+UOwPltUCfc6VmaAgahI5PJPGGhHSBfCVDw0Wh0Eo592TtiaMBAVCuVShuSmHTqvNriAAYHB5tB+gFPoxe5UP8L+K3YF18ldlEJmLAYrTuowg6eqBsVN8nsIkpgeHj4OJbNXja7EEjcmOFjEjNRAnBwWULuB4tZuCKxYyeQzWZbkMAWJvk4AtmP9Ryhh2TYjXNsyQf54mAJE+cCEcRhDha4PpzrOROL9hTaU3hvZBBg1tTZZOXrtU3n7GPPAI7NPU5jS3vCGbyJUbpHZp9NRgLsfcZOAI4225yZfXB81WzbZMyAJwY8m2y2tj52AnDsSYpLmue0l8vlN7ZAHH30rmEVdgIYFfFLjxWBHcSOiw3EDBTsvpZ7Y7HYruWWXeJgOL40OzsBTMAnbeRWA3PRTaf7gbmgZbea40vbshPAqLzVRjXqVrxJ+9z0Sud59Wb6+uuG/R4A+gWeTrfgjP4BBLoTo5jHsfmY+nH+H0RQKYhHDFwtkXyxCntj5vP5NYVCYR6BrGcx+wQh8WIikdiQSqVKHAr2EiJCBB/4E9ArKPgY4wZPXOwElONRrwBC0F+XcLCXkCbF+n4Hebtuh1y/x+Vvh4RTOgP0QXNJ4kCC9cMtTgDXhTEENSsJjImdVdxM+D+YOAH8kKrgZso5TmWBgJO4RUYAi/eAdoC98BQyfaiEUZ5h7Sf9EIlnQDvBLJyDLB4xba9rrPsq7kf0kvNVfCeQTqdn4PGGL6+GEc790e7ubs97lmGyQvSdALHE43G6vM2vYJQ1fioOmZWBDpRAV1fXb3CdNfik4hnFIbVbwgdKgFiw+e5hHd9aYmQKZEO2TLgrLHACxIzzm2bho6sXhwLBzygbh0be9H2MOl3hX842nEyv0L/WqXO0F5FAC67a9H81cIkFZlAE09PTP5LJJO2JVg/OTiydhx4Ytjq0GdAe8fFyH0fjUd02a4z8A4y86N+naW+TQ9kDJjHWdgfan80+khH8F6VzqgK1Q08A95kFRHQSD9W6LGBWTiid7gulDj0BigprnDZzO0a9TA/Jqo/Uq6dgP5ymZ/VEXI+0PgKrbwT+AFIjLxu3HbkQAAAAAElFTkSuQmCC\";\r\nexports.picHTML1 = \"<li class=\\\"rv-basemap-list-item\\\" style=\\\"height: 175px;\\\">\\n                         <div style=\\\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\\\">\\n                         <div style=\\\"max-height: 175px; max-width: 350px; text-align: center;\\\"><img alt=\\\"\\\" \";\r\nexports.picHTML2 = \"/></div><div class=\\\"rv-basemap-footer\\\"><span style=\\\"text-overflow:ellipses\\\">\";\r\nexports.HTMLmiddle = \"</span></div><button \";\r\nexports.HTMLmiddle2 = \"class=\\\"rv-body-button rv-button-square md-button md-ink-ripple\\\" type=\\\"button\\\" aria-label=\\\"bookmark\\\" \";\r\nexports.HTMLend = \"<div class=\\\"md-ripple-container\\\" style=\\\"\\\"></div></button></div></li>\";\r\nexports.noPicHTML1 = \"<li class=\\\"rv-basemap-list-item\\\" style=\\\"height: 50px;\\\">\\n                            <div style=\\\"position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; height: 100%\\\">\\n                            <div style=\\\"max-height: 50px; max-width: 350px; text-align: center;\\\"></div>\\n                            <div class=\\\"rv-basemap-footer\\\"><span>\";\r\n\n\n//# sourceURL=webpack:///./areaOfInterest/html-assets.ts?");
  
  /***/ })
  
  /******/ });
