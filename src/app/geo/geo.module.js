/**
 * @namespace app.geo
 *
 * @description
 *
 * The `app.geo` module interfaces with the geoApi library to perform map related activities.
 * It is responsible for stateful mapping components (e.g. map, layers, attribute tables), it should
 * hold references to those objects and abstract functionality away from the rest of the API.
 *
 * This module will be ESRI specific as it will be interacting with ESRI objects.  As part of decoupling
 * it should be built so it does not leak any ESRI specific concepts through the rest of the application.
 * And, as far as possible, it should minimize the amount of GIS specific functionality needs to be built
 * outside the module.
 */
angular.module('app.geo', []);
