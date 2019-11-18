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
/******/ 	return __webpack_require__(__webpack_require__.s = "./customExport/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./customExport/index.ts":
/*!*******************************!*\
  !*** ./customExport/index.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("var CustomExport = /** @class */ (function () {\r\n    function CustomExport() {\r\n        this.feature = 'export';\r\n    }\r\n    CustomExport.prototype.preInit = function () {\r\n        console.log('Sample export plugin pre-init check.');\r\n    };\r\n    CustomExport.prototype.init = function (api) {\r\n        this.api = api;\r\n        CustomExport.instances[this.api.id] = this;\r\n    };\r\n    /**\r\n     * Creates a stack of export images and returns them to RAMP.\r\n     *\r\n     * An export plugin should return a collection of promises each resolving with with a graphic and its offset\r\n     * { graphic: <canvas>, offset: [<left>, <top>] }[]\r\n     * - the first graphic is considered to be the base graphic and its offset should be [0,0]\r\n     * - all other graphics will be offset relative to the base graphic\r\n     * - when all promises have resolved, export is considered to be generated\r\n     * - if any of the promises fail, the export is considered to have failed and a standard error message will be displayed\r\n     *\r\n     * The plugin is free to rearrange `legendBlocks` as it sees fit as long as its structure remains valid.\r\n     *\r\n     * @param {ExportPluginOptions} { legendBlocks, mapSize } `legendBlocks` is a hierarchy of legend block representing the current legend; `mapSize` indicates the size of the map image visible on the screen\r\n     * @returns {Promise<HTMLCanvasElement>[]}\r\n     * @memberof CustomExport\r\n     */\r\n    CustomExport.prototype.generateExportStack = function (_a) {\r\n        var legendBlocks = _a.legendBlocks, mapSize = _a.mapSize;\r\n        var promises = [];\r\n        // create a base image and colour it white\r\n        var baseImage = RAMP.utils.createCanvas(mapSize.width, mapSize.height);\r\n        var baseImageCtx = baseImage.getContext('2d');\r\n        baseImageCtx.fillStyle = '#ffffff';\r\n        baseImageCtx.fillRect(0, 0, baseImage.width, baseImage.height);\r\n        // create underlying base canvas\r\n        promises.push(Promise.resolve({\r\n            graphic: baseImage\r\n        }));\r\n        //\r\n        var mapImageSize = {\r\n            width: mapSize.width * 0.8 - 20,\r\n            height: mapSize.height - 20\r\n        };\r\n        var sourceX = (mapSize.width - mapImageSize.width) / 2;\r\n        var sourceY = (mapSize.height - mapImageSize.height) / 2;\r\n        // svg export graphic needs to be generated first because generating a server-side map image hides svg layers (unless using local printing)\r\n        // TODO: prevent map generators from accepting export sizes\r\n        var apiGenerators = this.api.exportGenerators;\r\n        var pointsImage = apiGenerators.mapSVG().then(function (data) {\r\n            var canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);\r\n            // crop the map image returned by the generator to fit into the layout\r\n            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/\r\n            canvas\r\n                .getContext('2d')\r\n                .drawImage(data.graphic, sourceX, sourceY, mapImageSize.width, mapImageSize.height, 0, 0, mapImageSize.width, mapImageSize.height);\r\n            return { graphic: canvas, offset: [10, 10] };\r\n        });\r\n        var mapImage = apiGenerators.mapImage({ backgroundColour: '#bfe8fe' }).then(function (data) {\r\n            var canvas = RAMP.utils.createCanvas(mapImageSize.width, mapImageSize.height);\r\n            // crop the map image returned by the generator to fit into the layout\r\n            // https://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/\r\n            canvas\r\n                .getContext('2d')\r\n                .drawImage(data.graphic, sourceX, sourceY, mapImageSize.width, mapImageSize.height, 0, 0, mapImageSize.width, mapImageSize.height);\r\n            return { graphic: canvas, offset: [10, 10] };\r\n        });\r\n        var northArrowImage = apiGenerators.northArrow().then(function (data) { return ({\r\n            graphic: data.graphic,\r\n            offset: [40, 20]\r\n        }); });\r\n        var scaleBarImage = apiGenerators.scaleBar().then(function (data) { return ({\r\n            graphic: data.graphic,\r\n            offset: [mapImageSize.width - 10 - 120, mapImageSize.height - 50 - 10]\r\n        }); });\r\n        // we can pass in a modified copy of the legendBlocks if needed, in order to include/exclude certain layers from legend generation\r\n        var legendImage = apiGenerators\r\n            .legend({\r\n            columnWidth: mapSize.width * 0.2 - 20 - 10,\r\n            width: mapSize.width * 0.2 - 20 - 10,\r\n            height: mapImageSize.height,\r\n            legendBlocks: legendBlocks\r\n        })\r\n            .then(function (data) { return ({\r\n            graphic: data.graphic,\r\n            offset: [mapImageSize.width + 30, 10]\r\n        }); });\r\n        var titleImage = apiGenerators\r\n            .htmlMarkup(\"<span style=\\\"font-size: 35px; padding: 8px 14px; display: block; text-align: center;\\\"><b>Interesting Fact</b> | <i>Atomic Engineering Lab</i> is out of \\uD83C\\uDF82</span>\")\r\n            .then(function (data) { return ({\r\n            graphic: data.graphic,\r\n            offset: [mapImageSize.width - 10 - data.graphic.width, 10 + 20]\r\n        }); });\r\n        promises.push(mapImage, pointsImage, northArrowImage, scaleBarImage, legendImage, titleImage);\r\n        return promises;\r\n    };\r\n    // A store of the instances of areasOfInterest, 1 per map\r\n    CustomExport.instances = {};\r\n    return CustomExport;\r\n}());\r\nCustomExport.prototype.translations = {\r\n    'en-CA': {\r\n        title: 'Cake Export'\r\n    },\r\n    'fr-CA': {\r\n        title: \"Export la Cake\"\r\n    }\r\n};\r\nwindow.customExport = CustomExport;\r\n\n\n//# sourceURL=webpack:///./customExport/index.ts?");

/***/ })

/******/ });