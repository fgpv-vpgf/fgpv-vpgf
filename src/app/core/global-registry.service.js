/**
 * @name globalRegistry
 * @memberof app.core
 * @description
 *
 * The `globalRegistry` constant wraps around RV global registry for a single point of reference. Use this to access `RV` global.
 * It's useful if we need to change the name of the global registry.
 *
 */
angular
    .module('app.core')
    .constant('api', window.RAMP)
    .constant('LEGACY_API', {});
