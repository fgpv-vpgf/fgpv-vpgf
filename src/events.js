/**
 * Wire up any supplied handlers to the corresponding dojo .on events on layer.
 * Purpose is to keep Dojo .on events contained in geoApi.
 *
 * @param {esriObject} esriObject which contains the dojo events to be wrapped
 * @param {handlers} handlers is an object which contains all handlers needed
 */
function wrapEvents(esriObject, handlers) {
    Object.keys(handlers).forEach(ourEventName => {
        let ourNameString = ourEventName.toString();

        // replace camelCase name to dojo event name format
        let dojoName = ourNameString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

        // make dojo call
        esriObject.on(dojoName, handlers[ourEventName]);
    });
}

module.exports = function () {
    return {
        wrapEvents: wrapEvents
    };
};
