'use strict';

// TODO look at ripping out esriBundle, and passing specific classes as needed

// Classes for handling different types of layers

const dynamicRecord = require('./dynamicRecord.js')();
const featureRecord = require('./featureRecord.js')();
const graphicsRecord = require('./graphicsRecord.js')();
const imageRecord = require('./imageRecord.js')();
const tileRecord = require('./tileRecord.js')();
const wmsRecord = require('./wmsRecord.js')();

/*
Class heirarchy overview:

We have FC, Record, and Interface classes

FC represents a logical layer.  Think of a feature class (gis term, not programming term)
or a raster source. It is one atomic layer.

Record represents a physical layer.  Think of a layer in the ESRI map stack. Think of
something represented by an ESRI API layer object.

Interface is a class that presents information to the UI and facilitates bindings.
It also exposes calls to perform actions on the layer (e.g. the action a UI button
would execute).

FC classes are contained within Record classes.
If a property or function applies to a logical layer (e.g. min and max scale levels),
it should reside in an FC class. If it applies to a physical layer (e.g. loading
state), it should reside in a Record.

E.g.
A feature layer is implemented with one Record and one FC, because by nature,
a feature layer can only contain data from one feature class.
A dynamic layer is implemented with one Record, and a FC for every
leaf child layer.

An interface object should exist for every layer-bound entry in the legend.
Most Records will have one interface, as they just have one legend entry.
Dynamic Records will also have interfaces for children.
*/

// UPDATE: this idea was somewhat implemented. .layerInfo is still a promise, but we don't
// set things to loaded until we've extracted upfront items from it.
// IDEA: instead of having attribute .layerInfo as a promise,
// we pair that promise with the layer's load event.  Essentially, don't
// change our state to loaded until both the layer is loaded AND the .layerInfo
// is loaded.  Then we store the result in a not-promise var, and everything else
// can access it synchronously.
// Risk: need to make sure we never need to use .layerInfo prior to the layer loading.
// Risk: layer needs to wait until it has pulled additional info prior to being active (negligible?)

// TODO full review of use of object id, specificly the type -- is it string or integer
// TODO ditto for featureIdx.

// The FC classes are meant to be internal to this module. They help manage differences between single-type layers
// like feature layers, image layers, and composite layers like dynamic layers.
// Can toy with alternate approaches. E.g. have a convertToPlaceholder function in the interface.

// the Record classes are meant to be public facing and consumed by other modules and the client.

module.exports = () => ({
    DynamicRecord: dynamicRecord.DynamicRecord,
    FeatureRecord: featureRecord.FeatureRecord,
    GraphicsRecord: graphicsRecord.GraphicsRecord,
    ImageRecord: imageRecord.ImageRecord,
    TileRecord: tileRecord.TileRecord,
    WmsRecord: wmsRecord.WmsRecord
});
