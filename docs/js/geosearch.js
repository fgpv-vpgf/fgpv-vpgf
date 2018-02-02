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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GeoSearch = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = __webpack_require__(1);

var types = _interopRequireWildcard(_types);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var searchTypes = types;

var GeoSearch = function () {
    function GeoSearch(config) {
        _classCallCheck(this, GeoSearch);

        this.language = config && config.language ? config.language : 'en';
        if (config && config.types) {
            this.types = config.types;
        } else {
            this.types = searchTypes;
            delete this.types.default; // added by TS, remove since it breaks things
        }
        this.url = config && config.geogratisUrl ? config.geogratisUrl : 'https://geogratis.gc.ca/services/geolocation/' + this.language + '/locate?q=';
    }

    _createClass(GeoSearch, [{
        key: 'query',
        value: function query(_query) {
            var _this = this;

            this.userQuery = _query;
            return new Promise(function (resolve) {
                var xobj = new XMLHttpRequest();
                xobj.overrideMimeType("application/json");
                xobj.open('GET', _this.url + encodeURI(_query), true);
                xobj.onreadystatechange = function () {
                    if (xobj.readyState === 4 && xobj.status === 200) {
                        resolve(_this.processResults(JSON.parse(xobj.responseText)));
                    }
                };
                xobj.send(null);
            });
        }
    }, {
        key: 'filterQuery',
        value: function filterQuery(result) {
            switch (result.type) {
                case 'ca.gc.nrcan.geoloc.data.model.PostalCode':
                    return this.filterPostal(result);
                case 'ca.gc.nrcan.geoloc.data.model.NTS':
                    return this.filterNTS(result);
                /**
                 * ca.gc.nrcan.geoloc.data.model.Geoname geoGratis types have comma separated string titles which contain some key information
                 * we require. For example, searching for "quebec" contains a result object with a title property value of"Quebec, , Quebec (Province)".
                 * Since these result objects don't contain location types (province, city, etc. ) in their parameters, we need to deduce it from the
                 * title strings.
                 */
                default:
                    // the title contains additional comma separated values we need for filtering. 
                    // Example result title: Toronto, York, Ontario (City)
                    var titleSplit = result.title.split(',');
                    // we filter on a result type, which is the last part of the comma separated result title.
                    // Example: Ontario (City)
                    var identifier = titleSplit.pop();
                    // we'll store the actual type once extracted from the above string via regex (we want "City")
                    var type = '';
                    var typeRegex = /.*\((\w+)\)/.exec(identifier || '');
                    // return a valid type result or reject if type is not defined.
                    return typeRegex ? this.validateType(typeRegex[1]) : null;
            }
        }
        /**
         * geoGratis NTS results contain the NTS code at the start of the result title. This is not needed, so it is removed.
         */

    }, {
        key: 'filterNTS',
        value: function filterNTS(result) {
            result.title = result.title.replace(/\d{1,3}\w\d{1,3}/, '');
            return this.types.NTS && this.types.NTS[this.language] ? this.validateType(this.types.NTS[this.language].term) : false;
        }
    }, {
        key: 'filterPostal',
        value: function filterPostal(result) {
            return this.types.POSTALCODE && this.types.POSTALCODE[this.language] ? this.validateType(this.types.POSTALCODE[this.language].term) : false;
        }
        /**
         * geoGratis returns duplicate results at times, in particular it provides the english and french versions of locations.
         *
         * For example, using default english geoGratis service, searching for "Quebec" returns results that contain both "Quebec" and "Québec"
         *
         * So duplicate results are those who share the same type (i.e. province) and have identical geometry coordinates.
         */

    }, {
        key: 'removeDuplicateResults',
        value: function removeDuplicateResults(results) {
            for (var i = 0; i < results.length; i++) {
                var currentResult = results[i];
                for (var j = i + 1; j < results.length; j++) {
                    var nextResult = results[j];
                    if (currentResult.type.name === nextResult.type.name && currentResult.geometry.coordinates.join(',') == nextResult.geometry.coordinates.join(',')) {
                        results.splice(j, 1);
                    }
                }
            }
            return results;
        }
        /**
         * Given the geoGratis JSON result object, it calls applies the filter and duplicate reducer functions, and returns the results in a useful structure.
         */

    }, {
        key: 'processResults',
        value: function processResults(results) {
            var _this2 = this;

            var filterResults = results.map(function (r) {
                var filteredResult = _this2.filterQuery(r);
                if (filteredResult && filteredResult.isValid) {
                    return {
                        name: r.title.split(',').shift().trim(),
                        type: {
                            name: filteredResult.type,
                            description: filteredResult.description
                        },
                        bbox: r.bbox,
                        geometry: r.geometry
                    };
                }
            }).filter(function (r) {
                return r;
            });
            return this.removeDuplicateResults(filterResults);
        }
        /**
         * Determines if the provided type is valid based on the default or user provided type list and includes additional type data (description)
         *
         * @param type location type such as City, Province, Town, ...
         */

    }, {
        key: 'validateType',
        value: function validateType(type) {
            var _this3 = this;

            var result = {
                isValid: false,
                type: '',
                description: ''
            };
            var foundKey = Object.keys(this.types).find(function (t) {
                return _this3.types[t][_this3.language].term === type;
            });
            if (foundKey) {
                result.isValid = true;
                result.type = type;
                result.description = this.types[foundKey][this.language].description;
            }
            return result;
        }
    }]);

    return GeoSearch;
}();

exports.GeoSearch = GeoSearch;

if (window) {
    window.GeoSearch = GeoSearch;
}

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = {"PROV":{"en":{"term":"Province","description":"The main administrative division of Canada. It is a legally-defined territory, as established by Articles of Confederation or by constitutional amendments."},"fr":{"term":"Province","description":"La principale division administrative du Canada. Il s'agit d'un territoire juridiquement défini, établi par des articles de la Confédération ou par des amendements constitutionnels."}},"TERR":{"en":{"term":"Territory","description":"Administrative division of Canada, not yet admitted to the full rights of a province."},"fr":{"term":"Territoire","description":"Division administrative du Canada, n'ayant pas encore le statut d'une province."}},"CITY":{"en":{"term":"City","description":"Populated place with legally defined boundaries, usually incorporated under a provincial or territorial Municipal Act and being the highest level of municipal incorporation."},"fr":{"term":"Ville","description":"Lieu habité dont les limites sont définies par la loi, habituellement constitué en vertu de la Loi sur les municipalités de la province ou du territoire et constituant le niveau le plus élevé de constitution municipale."}},"TOWN":{"en":{"term":"Town","description":"Populated place with legally-defined boundaries, usually incorporated under a provincial Municipal Act, of lesser status than a city."},"fr":{"term":"Ville","description":"Lieu habité dont les limites sont définies par la loi, habituellement constitué en vertu de la Loi sur les municipalités de la province ou du territoire, et de statut inférieur à une ville importante."}},"VILG":{"en":{"term":"Village","description":"Populated place with legally-defined boundaries, usually incorporated under the Municipal Act of the province or territory in which it is found, of lesser status than a town."},"fr":{"term":"Village","description":"Lieu habité dont les limites sont définies par la loi, habituellement constitué en vertu de la Loi sur les municipalités de la province ou du territoire, et de statut inférieur à une ville."}},"POSTALCODE":{"en":{"term":"Postal Code","description":"A Canadian postal code is a six-character string that forms part of a postal address in Canada."},"fr":{"term":"Code postal","description":"Au Canada, un code postal est une chaîne de six caractères qui fait partie d'une adresse postale."}},"NTS":{"en":{"term":"National Topographic System","description":""},"fr":{"term":"Système national de référence cartographique","description":""}}}

/***/ })
/******/ ]);