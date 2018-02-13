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
/******/ 	return __webpack_require__(__webpack_require__.s = 90);
/******/ })
/************************************************************************/
/******/ ({

/***/ 90:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GeoSearch = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = __webpack_require__(91);

var types = _interopRequireWildcard(_types);

var _provinces = __webpack_require__(92);

var provinces = _interopRequireWildcard(_provinces);

var _query2 = __webpack_require__(93);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var searchTypes = types;
var provinceTypes = provinces;

var GeoSearch = function () {
    function GeoSearch(config) {
        _classCallCheck(this, GeoSearch);

        this.maxResults = 100;
        var language = config && config.language ? config.language : 'en';
        this.types = searchTypes[language];
        this.provinces = provinceTypes[language];
        this.geoLocateUrl = this.geoLocateUrl ? this.geoLocateUrl : 'https://geogratis.gc.ca/services/geolocation/' + language + '/locate';
        this.geoNameUrl = this.geoNameUrl ? this.geoNameUrl : 'https://geogratis.gc.ca/services/geoname/' + language + '/geonames.json';
        if (config) {
            this.maxResults = config.maxResults ? config.maxResults : this.maxResults;
            if (config.includeTypes) {
                this.findReplaceTypes(typeof config.includeTypes === 'string' ? [config.includeTypes] : config.includeTypes);
            } else if (config.excludeTypes) {
                this.findReplaceTypes(typeof config.excludeTypes === 'string' ? [config.excludeTypes] : config.excludeTypes, true);
            }
        }
    }

    _createClass(GeoSearch, [{
        key: 'findReplaceTypes',
        value: function findReplaceTypes(keys, exclude) {
            var typeSet = new Set(Object.keys(this.types));
            var keySet = new Set(keys);
            var invalidKeys = new Set([].concat(_toConsumableArray(typeSet)).filter(function (x) {
                return !!exclude === keySet.has(x);
            }));
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = invalidKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    delete this.types[key];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'ui',
        value: function ui(input, resultContainer, rIterator) {
            this.docFrag = document.createDocumentFragment();
            if (!input) {
                input = document.createElement('input');
                this.docFrag.appendChild(input);
            }
            input.onkeyup = this.inputChanged.bind(this);
            if (!resultContainer) {
                this.rContainer = document.createElement('ul');
                this.docFrag.appendChild(this.rContainer);
            } else {
                this.rContainer = resultContainer;
            }
            this.rContainer.classList.add('geosearch-ui');
            this.rIterator = rIterator ? rIterator.bind(this) : this.resultIterator;
            return this;
        }
    }, {
        key: 'resultIterator',
        value: function resultIterator(result) {
            var li = document.createElement('li');
            li.innerHTML = result.name;
            return li;
        }
    }, {
        key: 'inputChanged',
        value: function inputChanged(evt) {
            var _this = this;

            var qValue = evt.target.value;
            this.rContainer.innerHTML = '';
            this.query(qValue).then(function (results) {
                results.forEach(function (r) {
                    _this.rContainer.appendChild(_this.rIterator(r));
                });
            }).catch(function (error) {}); // don't care for error
        }
    }, {
        key: 'query',
        value: function query(_query) {
            var _this2 = this;

            var Q = new _query2.Query({
                query: _query,
                urls: { name: this.geoNameUrl, locate: this.geoLocateUrl },
                maxResults: this.maxResults,
                types: this.types
            });
            return Q.search().then(function (geoName) {
                return geoName.map(function (gn) {
                    return {
                        name: gn.name,
                        location: gn.location,
                        province: _this2.provinces[gn.province.code],
                        type: _this2.types[gn.concise.code],
                        pointCoords: gn.position.coordinates,
                        bbox: gn.bbox
                    };
                }).filter(function (r) {
                    return Object.keys(_this2.types).find(function (t) {
                        return _this2.types[t] === r.type;
                    });
                });
            });
        }
    }, {
        key: 'htmlElem',
        get: function get() {
            return this.docFrag;
        }
    }]);

    return GeoSearch;
}();

exports.GeoSearch = GeoSearch;

if (window) {
    window.GeoSearch = GeoSearch;
}

/***/ }),

/***/ 91:
/***/ (function(module, exports) {

module.exports = {"en":{"PROV":"Province","TERR":"Territory","CITY":"City","TOWN":"Town","VILG":"Village","HAM":"Hamlet","UTM":"Upper Tier Municipality","LTM":"Lower Tier Municipality","STM":"Single Tier Municipality","MUN1":"Other Municipal-District Area-Major Agglom.","MUN2":"Other Municipal-District Area-Miscellaneous","UNP":"Unincorporated place","IR":"Indian Reserve","GEOG":"Geographical Area","PARK":"Conservation Area","MIL":"Military Area","RIV":"River","RIVF":"River Feature","FALL":"Falls","LAKE":"Lake","SPRG":"Spring","SEA":"Sea","SEAF":"Sea Feature","SEAU":"Undersea Feature","CHAN":"Channel","RAP":"Rapids","BAY":"Bay","CAPE":"Cape","BCH":"Beach","SHL":"Shoal","ISL":"Island","CLF":"Cliff","MTN":"Mountain","VALL":"Valley","PLN":"Plain","CAVE":"Cave","CRAT":"Crater","GLAC":"Glacier","FOR":"Forest","VEGL":"Low Vegetation","MISC":"Miscellaneous","RAIL":"Railway Feature","ROAD":"Road Feature","AIR":"Air Navigation Feature","MAR":"Marine Navigation Feature","HYDR":"Hydraulic Construction","RECR":"Recreational Site","RES":"Natural Resources Site","CAMP":"Miscellaneous Campsite","SITE":"Miscellaneous Site"},"fr":{"PROV":"Province","TERR":"Territoire","CITY":"Ville","TOWN":"Ville","VILG":"Village","HAM":"Hameau","UTM":"Municipalité de palier supérieure","LTM":"Municipalité de palier inférieur","STM":"Municipalité de palier simple","MUN1":"Autre zone municip.-District-Agglom. majeure","MUN2":"Autre zone municipale-District-Divers","UNP":"Lieu non organisé","IR":"Réserve indienne","GEOG":"Zone géographique","PARK":"Zone de préservation","MIL":"Réserve militaire","RIV":"Cours d'eau","RIVF":"Entité fluviale","FALL":"Chute","LAKE":"Lac","SPRG":"Source","SEA":"Mer","SEAF":"Entité maritime","SEAU":"Entité sous-marine","CHAN":"Chenal","RAP":"Rapide","BAY":"Baie","CAPE":"Cap","BCH":"Plage","SHL":"Haut-fond","ISL":"Île","CLF":"Escarpement","MTN":"Montagne","VALL":"Vallée","PLN":"Plaine","CAVE":"Caverne","CRAT":"Cratère","GLAC":"Glacier","FOR":"Forêt","VEGL":"Végétation basse","MISC":"Divers","RAIL":"Entité ferroviaire","ROAD":"Entité routière","AIR":"Entité de navigation aérienne","MAR":"Entité de navigation maritime","HYDR":"Construction hydraulique","RECR":"Site récréationnel","RES":"Site de ressources naturelles","CAMP":"Camp-Divers","SITE":"Site-Divers"}}

/***/ }),

/***/ 92:
/***/ (function(module, exports) {

module.exports = {"en":{"10":"Newfoundland and Labrador","11":"Prince Edward Island","12":"Nova Scotia","13":"New Brunswick","24":"Quebec","35":"Ontario","46":"Manitoba","47":"Saskatchewan","48":"Alberta","59":"British Columbia","60":"Yukon","61":"Northwest Territories","62":"Nunavut","72":"Undersea Feature","73":"International Waters"},"fr":{"10":"Terre-Neuve-et-Labrador","11":"Île-du-Prince-Édouard","12":"Nouvelle-Écosse","13":"Nouveau-Brunswick","24":"Québec","35":"Ontario","46":"Manitoba","47":"Saskatchewan","48":"Alberta","59":"Colombie-Britannique","60":"Yukon","61":"Territoires du Nord-Ouest","62":"Nunavut","72":"Entité sous-marine","73":"Eaux internationales"}}

/***/ }),

/***/ 93:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Query = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _interfaces = __webpack_require__(94);

var i = _interopRequireWildcard(_interfaces);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = exports.Query = function () {
    function Query(config) {
        _classCallCheck(this, Query);

        this.query = config.query;
        this.types = config.types;
        this.maxResults = config.maxResults;
        this.geoNamesUrl = config.urls.name;
        this.geoLocateUrl = config.urls.locate;
    }

    _createClass(Query, [{
        key: 'search',
        value: function search() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                if (_this.isFSA() || _this.isNTS()) {
                    _this.httpLocateRequest(_this.query).then(function (gl) {
                        _this.httpLatLonRequest(gl).then(function (x) {
                            return i.isReturnedGeoNamesType(x) ? resolve(x.items) : reject(x);
                        });
                    });
                } else {
                    _this.httpRequest(_this.geoNamesUrl + '?q=' + _this.query + '&category=O&concise=' + Object.keys(_this.types).join(',')).then(function (r) {
                        i.isReturnedGeoNamesType(r) ? resolve(r.items) : reject(r);
                    });
                }
            });
        }
    }, {
        key: 'isFSA',
        value: function isFSA() {
            var normalizeQuery = this.query.substring(0, 3).toUpperCase();
            if (/^\w\d\w/.test(normalizeQuery)) {
                this.query = normalizeQuery;
                return true;
            }
            return false;
        }
    }, {
        key: 'isNTS',
        value: function isNTS() {
            var normalizeQuery = this.query.substring(0, 6).toUpperCase();
            if (/^\d{3}\w\d{2}/.test(normalizeQuery)) {
                this.query = normalizeQuery;
                return true;
            }
            return false;
        }
    }, {
        key: 'httpLatLonRequest',
        value: function httpLatLonRequest(x) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.httpRequest(_this2.geoNamesUrl + '?lat=' + x.geometry.coordinates[1] + '&lon=' + x.geometry.coordinates[0] + '&num=' + _this2.maxResults).then(function (r) {
                    return i.isReturnedGeoNamesType(r) ? resolve(r) : reject('Results are not in geoname format.');
                }).catch(reject);
            });
        }
    }, {
        key: 'httpLocateRequest',
        value: function httpLocateRequest(ntsOrFsa) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _this3.httpRequest(_this3.geoLocateUrl + '?q=' + ntsOrFsa).then(function (r) {
                    return i.isReturnedGeoLocationType(r) ? resolve(r[0]) : reject('No valid locate results could be determined.');
                }).catch(reject);
            });
        }
    }, {
        key: 'httpRequest',
        value: function httpRequest(url) {
            return new Promise(function (resolve, reject) {
                var xobj = new XMLHttpRequest();
                xobj.open('GET', url, true);
                xobj.responseType = 'json';
                xobj.onload = function () {
                    if (xobj.status === 200) {
                        resolve(typeof xobj.response === 'string' ? JSON.parse(xobj.response) : xobj.response);
                    } else {
                        reject('Could not load results from remote service.');
                    }
                };
                xobj.send();
            });
        }
    }]);

    return Query;
}();

/***/ }),

/***/ 94:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isReturnedGeoNamesType = isReturnedGeoNamesType;
exports.isReturnedGeoLocationType = isReturnedGeoLocationType;
function isReturnedGeoNamesType(result) {
    return result.hasOwnProperty('items');
}
function isReturnedGeoLocationType(result) {
    return result.hasOwnProperty(0);
}

/***/ })

/******/ });