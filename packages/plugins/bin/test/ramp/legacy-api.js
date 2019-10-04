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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/legacy-api.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/legacy-api.ts":
/*!***************************!*\
  !*** ./src/legacy-api.ts ***!
  \***************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar mapInstances = {};\n\nvar MapInstance = function () {\n    function MapInstance(id) {\n        _classCallCheck(this, MapInstance);\n\n        this.deprecatedWarning = false;\n        this.id = id;\n        this.queues = {};\n        this.legacyFunctions = {};\n    }\n    /**\r\n     * Runs all queues - highest priority queues execute first.\r\n     */\n\n\n    _createClass(MapInstance, [{\n        key: 'runQueue',\n        value: function runQueue() {\n            var _this = this;\n\n            Object.keys(this.queues).sort().reverse().forEach(function (key) {\n                var k = parseInt(key);\n                _this.queues[k].forEach(function (qItem) {\n                    return qItem();\n                });\n                delete _this.queues[k];\n            });\n        }\n        /**\r\n         * Adds a legacy api call to a queue which gets executed when ramp is ready to receive them.\r\n         *\r\n         * @param {string} action       legacy api function name to be queued\r\n         * @param {number} priority     the order in which this queued call will be executed, higher numbers go first\r\n         * @param {...any} args         legacy api function parameters\r\n         */\n\n    }, {\n        key: 'queue',\n        value: function queue(action, priority) {\n            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {\n                args[_key - 2] = arguments[_key];\n            }\n\n            var _this2 = this;\n\n            if (!this.deprecatedWarning) {\n                console.error('This api is deprecated and will be removed in a future release. Please use the new api located at window.RAMP');\n                this.deprecatedWarning = true;\n            }\n            // ramp has defined the legacy function, call immediately\n            if (this.legacyFunctions[action]) {\n                return new Promise(function (resolve) {\n                    var _legacyFunctions;\n\n                    return resolve((_legacyFunctions = _this2.legacyFunctions)[action].apply(_legacyFunctions, args));\n                });\n            }\n            // ramp is not yet ready, queue the function call\n            this.queues[priority] = this.queues[priority] || [];\n            return new Promise(function (resolve) {\n                _this2.queues[priority].push(function () {\n                    var _legacyFunctions2;\n\n                    return _this2.legacyFunctions[action] && resolve((_legacyFunctions2 = _this2.legacyFunctions)[action].apply(_legacyFunctions2, args));\n                });\n            });\n        }\n    }, {\n        key: 'setLanguage',\n        value: function setLanguage() {\n            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {\n                args[_key2] = arguments[_key2];\n            }\n\n            return this.queue.apply(this, ['setLanguage', 0].concat(args));\n        }\n    }, {\n        key: 'panelVisibility',\n        value: function panelVisibility() {\n            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {\n                args[_key3] = arguments[_key3];\n            }\n\n            return this.queue.apply(this, ['panelVisibility', 0].concat(args));\n        }\n    }, {\n        key: 'getCurrentLang',\n        value: function getCurrentLang() {\n            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {\n                args[_key4] = arguments[_key4];\n            }\n\n            return this.queue.apply(this, ['getCurrentLang', 0].concat(args));\n        }\n    }, {\n        key: 'loadRcsLayers',\n        value: function loadRcsLayers() {\n            for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {\n                args[_key5] = arguments[_key5];\n            }\n\n            return this.queue.apply(this, ['loadRcsLayers', 0].concat(args));\n        }\n    }, {\n        key: 'getBookmark',\n        value: function getBookmark() {\n            for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {\n                args[_key6] = arguments[_key6];\n            }\n\n            return this.queue.apply(this, ['getBookmark', 0].concat(args));\n        }\n    }, {\n        key: 'centerAndZoom',\n        value: function centerAndZoom() {\n            for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {\n                args[_key7] = arguments[_key7];\n            }\n\n            return this.queue.apply(this, ['centerAndZoom', 0].concat(args));\n        }\n    }, {\n        key: 'setExtent',\n        value: function setExtent() {\n            for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {\n                args[_key8] = arguments[_key8];\n            }\n\n            return this.queue.apply(this, ['setExtent', 0].concat(args));\n        }\n    }, {\n        key: 'useBookmark',\n        value: function useBookmark() {\n            for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {\n                args[_key9] = arguments[_key9];\n            }\n\n            return this.queue.apply(this, ['useBookmark', 0].concat(args));\n        }\n    }, {\n        key: 'getRcsLayerIDs',\n        value: function getRcsLayerIDs() {\n            for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {\n                args[_key10] = arguments[_key10];\n            }\n\n            return this.queue.apply(this, ['getRcsLayerIDs', 0].concat(args));\n        }\n    }, {\n        key: 'appInfo',\n        value: function appInfo() {\n            for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {\n                args[_key11] = arguments[_key11];\n            }\n\n            return this.queue.apply(this, ['appInfo', 0].concat(args));\n        }\n    }, {\n        key: 'northArrow',\n        value: function northArrow() {\n            for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {\n                args[_key12] = arguments[_key12];\n            }\n\n            return this.queue.apply(this, ['northArrow', 0].concat(args));\n        }\n    }, {\n        key: 'mapCoordinates',\n        value: function mapCoordinates() {\n            for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {\n                args[_key13] = arguments[_key13];\n            }\n\n            return this.queue.apply(this, ['mapCoordinates', 0].concat(args));\n        }\n    }, {\n        key: 'getMapClickInfo',\n        value: function getMapClickInfo() {\n            for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {\n                args[_key14] = arguments[_key14];\n            }\n\n            return this.queue.apply(this, ['getMapClickInfo', 0].concat(args));\n        }\n    }, {\n        key: 'convertDDToDMS',\n        value: function convertDDToDMS() {\n            for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {\n                args[_key15] = arguments[_key15];\n            }\n\n            return this.queue.apply(this, ['convertDDToDMS', 0].concat(args));\n        }\n    }, {\n        key: 'setMapCursor',\n        value: function setMapCursor() {\n            for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {\n                args[_key16] = arguments[_key16];\n            }\n\n            return this.queue.apply(this, ['setMapCursor', 0].concat(args));\n        }\n    }, {\n        key: 'projectGeometry',\n        value: function projectGeometry() {\n            for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {\n                args[_key17] = arguments[_key17];\n            }\n\n            return this.queue.apply(this, ['projectGeometry', 0].concat(args));\n        }\n    }, {\n        key: 'toggleSideNav',\n        value: function toggleSideNav() {\n            for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {\n                args[_key18] = arguments[_key18];\n            }\n\n            return this.queue.apply(this, ['toggleSideNav', 0].concat(args));\n        }\n    }, {\n        key: 'reInitialize',\n        value: function reInitialize() {\n            for (var _len19 = arguments.length, args = Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {\n                args[_key19] = arguments[_key19];\n            }\n\n            return this.queue.apply(this, ['reInitialize', 0].concat(args));\n        }\n    }, {\n        key: 'getConfig',\n        value: function getConfig() {\n            for (var _len20 = arguments.length, args = Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {\n                args[_key20] = arguments[_key20];\n            }\n\n            return this.queue.apply(this, ['getConfig', 0].concat(args));\n        }\n    }, {\n        key: 'initialBookmark',\n        value: function initialBookmark() {\n            for (var _len21 = arguments.length, args = Array(_len21), _key21 = 0; _key21 < _len21; _key21++) {\n                args[_key21] = arguments[_key21];\n            }\n\n            return this.queue.apply(this, ['initialBookmark', 1].concat(args));\n        }\n    }, {\n        key: 'restoreSession',\n        value: function restoreSession() {\n            for (var _len22 = arguments.length, args = Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {\n                args[_key22] = arguments[_key22];\n            }\n\n            return this.queue.apply(this, ['restoreSession', 1].concat(args));\n        }\n    }, {\n        key: 'start',\n        value: function start() {\n            for (var _len23 = arguments.length, args = Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {\n                args[_key23] = arguments[_key23];\n            }\n\n            return this.queue.apply(this, ['start', 1].concat(args));\n        }\n    }]);\n\n    return MapInstance;\n}();\n\nwindow.RV = {\n    getMap: function getMap(id) {\n        mapInstances[id] = mapInstances[id] || new MapInstance(id);\n        return mapInstances[id];\n    }\n};\nconsole.warn('The RAMP viewers legacy API is deprecated and will be removed in a future release.');\n\n//# sourceURL=webpack:///./src/legacy-api.ts?");

/***/ })

/******/ });