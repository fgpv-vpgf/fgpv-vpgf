window["BackToCart"] =
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nvar BackToCart = /** @class */ (function () {\r\n    function BackToCart() {\r\n    }\r\n    /**\r\n     * Sets a specific backToCart instance's catalogue url\r\n     *\r\n     * @param {string} mapId         Map ID for the backToCart instance you want to change\r\n     * @param {string} template      The destination URL with '{RV_LAYER_LIST}' marking where the layer keys should go\r\n     */\r\n    BackToCart.setCatalogueUrl = function (mapId, template) {\r\n        BackToCart.instances[mapId].template = template;\r\n    };\r\n    /**\r\n     * Adds a button to RAMP's side menu\r\n     */\r\n    BackToCart.prototype.activateButton = function () {\r\n        this.button = this.api.mapI.addPluginButton(BackToCart.prototype.translations[this._RV.getCurrentLang()], this.onMenuItemClick());\r\n    };\r\n    /**\r\n     * Returns a promise that resolves with the backToCart URL\r\n     */\r\n    BackToCart.prototype.getCatalogueUrl = function () {\r\n        if (!this.template) {\r\n            console.warn('<Back to Cart> Trying to get URL before template is set');\r\n            return;\r\n        }\r\n        return this.template.replace('{RV_LAYER_LIST}', this._RV.getRcsLayerIDs().toString());\r\n    };\r\n    /**\r\n     * Callback for the RAMP button, sets session storage and then redirects the browser to the catalogueUrl\r\n     */\r\n    BackToCart.prototype.onMenuItemClick = function () {\r\n        var _this = this;\r\n        return function () {\r\n            if (!_this.getCatalogueUrl()) {\r\n                return;\r\n            }\r\n            // save bookmark in local storage so it is restored when user returns\r\n            sessionStorage.setItem(_this.api.id, _this._RV.getBookmark());\r\n            window.location.href = _this.getCatalogueUrl();\r\n        };\r\n    };\r\n    /**\r\n     * Auto called by RAMP startup, checks for a catalogueUrl in the config and sets the template if so\r\n     *\r\n     * @param pluginConfig      pluginConfig given by RAMP, contains the catalogue URL\r\n     */\r\n    BackToCart.prototype.preInit = function (pluginConfig) {\r\n        if (pluginConfig && pluginConfig.catalogueUrl) {\r\n            this.template = pluginConfig.catalogueUrl;\r\n        }\r\n    };\r\n    /**\r\n     * Auto called by RAMP startup, stores the map api and puts the instance in BackToCart.instances\r\n     *\r\n     * @param {any} api     map api given by RAMP\r\n     */\r\n    BackToCart.prototype.init = function (api) {\r\n        this.api = api;\r\n        BackToCart.instances[this.api.id] = this;\r\n        this.activateButton();\r\n    };\r\n    // A store of the instances of backToCart, 1 per map\r\n    BackToCart.instances = {};\r\n    return BackToCart;\r\n}());\r\nexports.default = BackToCart;\r\nBackToCart.prototype.translations = {\r\n    'en-CA': 'Back to Cart',\r\n    'fr-CA': 'Retour au panier'\r\n};\r\nwindow.backToCart = BackToCart;\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9CYWNrVG9DYXJ0Ly4vc3JjL2luZGV4LnRzPzYyNzYiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxudmFyIEJhY2tUb0NhcnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBCYWNrVG9DYXJ0KCkge1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIGEgc3BlY2lmaWMgYmFja1RvQ2FydCBpbnN0YW5jZSdzIGNhdGFsb2d1ZSB1cmxcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWFwSWQgICAgICAgICBNYXAgSUQgZm9yIHRoZSBiYWNrVG9DYXJ0IGluc3RhbmNlIHlvdSB3YW50IHRvIGNoYW5nZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlICAgICAgVGhlIGRlc3RpbmF0aW9uIFVSTCB3aXRoICd7UlZfTEFZRVJfTElTVH0nIG1hcmtpbmcgd2hlcmUgdGhlIGxheWVyIGtleXMgc2hvdWxkIGdvXHJcbiAgICAgKi9cclxuICAgIEJhY2tUb0NhcnQuc2V0Q2F0YWxvZ3VlVXJsID0gZnVuY3Rpb24gKG1hcElkLCB0ZW1wbGF0ZSkge1xyXG4gICAgICAgIEJhY2tUb0NhcnQuaW5zdGFuY2VzW21hcElkXS50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGJ1dHRvbiB0byBSQU1QJ3Mgc2lkZSBtZW51XHJcbiAgICAgKi9cclxuICAgIEJhY2tUb0NhcnQucHJvdG90eXBlLmFjdGl2YXRlQnV0dG9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuYnV0dG9uID0gdGhpcy5hcGkubWFwSS5hZGRQbHVnaW5CdXR0b24oQmFja1RvQ2FydC5wcm90b3R5cGUudHJhbnNsYXRpb25zW3RoaXMuX1JWLmdldEN1cnJlbnRMYW5nKCldLCB0aGlzLm9uTWVudUl0ZW1DbGljaygpKTtcclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgYmFja1RvQ2FydCBVUkxcclxuICAgICAqL1xyXG4gICAgQmFja1RvQ2FydC5wcm90b3R5cGUuZ2V0Q2F0YWxvZ3VlVXJsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy50ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJzxCYWNrIHRvIENhcnQ+IFRyeWluZyB0byBnZXQgVVJMIGJlZm9yZSB0ZW1wbGF0ZSBpcyBzZXQnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZS5yZXBsYWNlKCd7UlZfTEFZRVJfTElTVH0nLCB0aGlzLl9SVi5nZXRSY3NMYXllcklEcygpLnRvU3RyaW5nKCkpO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgZm9yIHRoZSBSQU1QIGJ1dHRvbiwgc2V0cyBzZXNzaW9uIHN0b3JhZ2UgYW5kIHRoZW4gcmVkaXJlY3RzIHRoZSBicm93c2VyIHRvIHRoZSBjYXRhbG9ndWVVcmxcclxuICAgICAqL1xyXG4gICAgQmFja1RvQ2FydC5wcm90b3R5cGUub25NZW51SXRlbUNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy5nZXRDYXRhbG9ndWVVcmwoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNhdmUgYm9va21hcmsgaW4gbG9jYWwgc3RvcmFnZSBzbyBpdCBpcyByZXN0b3JlZCB3aGVuIHVzZXIgcmV0dXJuc1xyXG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKF90aGlzLmFwaS5pZCwgX3RoaXMuX1JWLmdldEJvb2ttYXJrKCkpO1xyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IF90aGlzLmdldENhdGFsb2d1ZVVybCgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBBdXRvIGNhbGxlZCBieSBSQU1QIHN0YXJ0dXAsIGNoZWNrcyBmb3IgYSBjYXRhbG9ndWVVcmwgaW4gdGhlIGNvbmZpZyBhbmQgc2V0cyB0aGUgdGVtcGxhdGUgaWYgc29cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcGx1Z2luQ29uZmlnICAgICAgcGx1Z2luQ29uZmlnIGdpdmVuIGJ5IFJBTVAsIGNvbnRhaW5zIHRoZSBjYXRhbG9ndWUgVVJMXHJcbiAgICAgKi9cclxuICAgIEJhY2tUb0NhcnQucHJvdG90eXBlLnByZUluaXQgPSBmdW5jdGlvbiAocGx1Z2luQ29uZmlnKSB7XHJcbiAgICAgICAgaWYgKHBsdWdpbkNvbmZpZyAmJiBwbHVnaW5Db25maWcuY2F0YWxvZ3VlVXJsKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGUgPSBwbHVnaW5Db25maWcuY2F0YWxvZ3VlVXJsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIEF1dG8gY2FsbGVkIGJ5IFJBTVAgc3RhcnR1cCwgc3RvcmVzIHRoZSBtYXAgYXBpIGFuZCBwdXRzIHRoZSBpbnN0YW5jZSBpbiBCYWNrVG9DYXJ0Lmluc3RhbmNlc1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7YW55fSBhcGkgICAgIG1hcCBhcGkgZ2l2ZW4gYnkgUkFNUFxyXG4gICAgICovXHJcbiAgICBCYWNrVG9DYXJ0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGFwaSkge1xyXG4gICAgICAgIHRoaXMuYXBpID0gYXBpO1xyXG4gICAgICAgIEJhY2tUb0NhcnQuaW5zdGFuY2VzW3RoaXMuYXBpLmlkXSA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZUJ1dHRvbigpO1xyXG4gICAgfTtcclxuICAgIC8vIEEgc3RvcmUgb2YgdGhlIGluc3RhbmNlcyBvZiBiYWNrVG9DYXJ0LCAxIHBlciBtYXBcclxuICAgIEJhY2tUb0NhcnQuaW5zdGFuY2VzID0ge307XHJcbiAgICByZXR1cm4gQmFja1RvQ2FydDtcclxufSgpKTtcclxuZXhwb3J0cy5kZWZhdWx0ID0gQmFja1RvQ2FydDtcclxuQmFja1RvQ2FydC5wcm90b3R5cGUudHJhbnNsYXRpb25zID0ge1xyXG4gICAgJ2VuLUNBJzogJ0JhY2sgdG8gQ2FydCcsXHJcbiAgICAnZnItQ0EnOiAnUmV0b3VyIGF1IHBhbmllcidcclxufTtcclxud2luZG93LmJhY2tUb0NhcnQgPSBCYWNrVG9DYXJ0O1xyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/index.ts\n");

/***/ })

/******/ })["default"];