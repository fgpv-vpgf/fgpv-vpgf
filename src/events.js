/**
 * Wire up any supplied handlers to the corresponding dojo .on events on layer.
 * Purpose is to keep Dojo .on events contained in geoApi.
 *
 * @param {esriObject} esriObject which contains the dojo events to be wrapped
 * @param {handlers} handlers is an object which contains all handlers needed
 */
function wrapEvents(esriObject, handlers) {
    Object.keys(handlers).forEach(ourEventName => {
        // replace camelCase name to dojo event name format
        const dojoName = ourEventName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

        // TODO: Validity checking on inputs for dojoName
        // make dojo call
        esriObject.on(dojoName, (e) => {

            // check if needs special handling to point at layer calling event
            const layerEvents = ['update-start', 'update-end', 'error'];
            if (layerEvents.indexOf(dojoName) >= 0) {
                e.layer = e.target;
            }
            handlers[ourEventName](e);
        });
    });
}

module.exports = () => {
    return {
        wrapEvents
    };
};
