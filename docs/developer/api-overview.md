# Overview

This guide is intended for users comfortable with JavaScript and geo mapping. It covers the top level API structure and provides sample code throughout.

You should also have a basic understanding of **observables** which are used to handle asynchronous events. For this, we use [RxJS](https://rxjs-dev.firebaseapp.com/). Feel free to check out the [RxJS documentation](https://rxjs-dev.firebaseapp.com/) for more detailed information on how they work. For this guide, understanding `subscribe` is sufficient.

<p class="tip">
  Use this guide as an introduction to the [technical documentation](api/developer/). It will give you a basic understanding of how the API is structured and some of what it can do but you should refer to the technical documentation after reading this guide for complete information.
</p>

## How to access the API

The API can be accessed via the global variable `window.RAMP`.
```js
let myMap = RAMP.mapById('myMap');
```

This variable is available as soon as the ramp viewer library (.js file) has loaded on the host page. The easiest way to know `window.RAMP` is ready is to write your code in the form of a [plugin](developer/plugins). For this guide however we'll assume the ramp viewer library has finished loading before our sample code gets executed.

## Accessing a map instance

You can't do anything exciting without first finding the map instance you'd like to interact with. Since there can be multiple ramp viewers on the same page most API functionality is on a **map instance**. `RAMP.mapInstances` is an array of such API map instances, one instance per ramp viewer you have on the page (typically just one). If your host page only has one ramp viewer then it's easy - `RAMP.mapInstances[0]`. If there are multiple ramp instances on a page you can use the `RAMP.mapById` function to find a particular one.

```js
// get the first map instance on the page
const firstMap = RAMP.mapInstances[0];

// get the nth map named 'myMap'
const myMap = RAMP.mapById('myMap');
```

You can subscribe to the `RAMP.mapAdded` observable which will emit an API map instance as soon as its created.

## Map instances
As mentioned above each RAMP instance will have a `mapInstance` on the API. Let's take the first instance and store it for our examples.
```js
const mapInstance = RAMP.mapInstances[0];
```
Map instances have the following features:

### Observables

Have observables including (but not limited to):
- [click](developer/api_tech_docs/classes/_api_src_map_.map.html#click)
- [doubleClick](developer/api_tech_docs/classes/_api_src_map_.map.html#doubleclick)
- [mouseUp](developer/api_tech_docs/classes/_api_src_map_.map.html#mouseup)
- [mouseDown](developer/api_tech_docs/classes/_api_src_map_.map.html#mousedown)
- [zoomChanged](developer/api_tech_docs/classes/_api_src_map_.map.html#zoomchanged)
- [centerChanged](developer/api_tech_docs/classes/_api_src_map_.map.html#centerchanged)

You can subscribe to any of these Observables to react to map changes made by the user, another plugin, or to actions you made through the API.

For an example, let's subscribe to the `click` observable.
```js
// create a subscriber function to fire on click
function clickSubscriber () {
  console.log(`Hello World! I've been clicked!`);
}
// attach function to the click observable
mapInstance.click.subscribe(clickSubscriber);
```

### Basic Map Operations
Most basic map operations can be done via the API such as setting extent, setting bounds, toggling fullscreen, exporting the map, and more!

As an example let's toggle fullscreen for our map on then off.
```js
// toggle fullscreen on
mapInstance.fullscreen(true);

// toggle fullscreen off
mapInstance.fullscreen(false);
```

### Legend
The legend api allows programatic control of RAMP's legend and can be accessed through `mapInstance.ui.configLegend`.

There are three main components to the legend api.
- `ConfigLegend`<br/>
  A single instance is created for a map instance and is the root for interaction with the legend through the API.
- `LegendGroup`<br/>
  Contains a number of `LegendItems`. Allows for nesting in the legend.
- `LegendItem`<br/>
  Element in the legend, either `LegendNode` if it corresponds to a layer or `InfoSection` if it does not.

As an example of what this API can do, let's try hiding all layers then showing only the 2nd.
```js
// store the config legend for convenience
const configLegend = mapInstance.ui.configLegend;
// hide all layers
configLegend.hideAll();

// get the second layer by accessing the children of the config legend
const layer2 = configLegend.children[1];
// set the layer visibility to true
layer2.visibility = true;
```

### Layers and Geometry
`mapInstance.layers` provides access to layer attributes, identify, and layer specific observables.

There are two layer types:
- [ConfigLayer](developer/api_tech_docs/classes/_api_src_layers_.configlayer.html)
  - Created automatically for every layer in the viewers configuration but can also be created outside the config.
  - Cannot have geometries added to it.

  Let's add an example layer to our map. We do this by calling `addLayer` with a json snippet.
  ```js
  const layerJson = {
    "id": "examplelayer",
    "name": "An exemplary Layer",
    "layerType": "esriFeature",
    "controls": [
      "remove"
    ],
    "state": {
      "visibility": false,
      "boundingBox": false
    },
    "url": "http://example.com/MapServer/URL"
  };
  const myConfigLayer = mapInstance.layers.addLayer(layerJSON);
  ```

- [SimpleLayer](developer/api_tech_docs/lasses/_api_src_layers_.simplelayer.html)
  - Created programmatically via the API.
  - Can have geometries added to it.
  - There is a default simple layer in the API

  To create a simple layer we can call the same `addLayer` function but with a string identifier instead of json.
  ```js
  const mySimpleLayer = mapInstance.layers.addLayer('simpleExample');
  ```

As mentioned simple layers can have geometries added to them. There are three main geometry types.
- `Points`<br/>
  Point on the map represented by an image or svg icon.
- `LineStrings`<br/>
  Line stringing together multiple `Points`.
- `Polygons`<br/>
  Linear ring of points.

There are also `multi` versions of each which are, as the name suggests, a single object containing multiple. So a `MultiPoint` contains multiple `Points`.

Let's try adding a point to the map. There is a default simple layer on the map upon initialization that can be accessed at `mapInstance.simpleLayer`. We will use this for our example but it's always a good idea to create your own simple layer if you plan on adding complex geometry.
```js
// create a point, we'll use an svg path for the icon
var examplePoint = new RAMP.GEO.Point(1, [79, 32], {icon: 'M24.0,2.199C11.9595,2.199,2.199,11.9595,2.199,24.0c0.0,12.0405,9.7605,21.801,21.801'});
// add the point to the simple layer
mapInstance.simpleLayer.addGeometry(examplePoint);
```

### Panels
Panels are a core part of the viewer API and will probably be how you'd incorporate your plugin into RAMP. Let's go over the basics of finding existing panels, creating a panel, and adding content to it.

To find a panel, whether default or created through the API, we use the panel registry.
```js
// get an array of all panels
const allPanels = mapInstance.panelRegistry;
```

To create a panel we use the `panels.create` function.
```js
// create a panel through the API
const myPanel = mapInstance.panels.create('myPanel');
```
Now let's add something to it.
```js
myPanel.setBody('<div>Hello World!</div>');
```
We also need to add some CSS so the panel knows where to go.
```js
myPanel.panelContents.css({
    top: '0px',
    left: '410px',
    right: '0px',
    bottom: '0px',
});
```
Finally, we can open our panel!
```js
myPanel.open();
```

## Advanced Use of the Mapping API

Whenever possible, we recommend using the supported API commands listed above and in the [technical documentation](api/developer/). However we realize there will be scenarios where a page script or [plugin](developer/plugins) will need to utililize the underlying map API in a manner that is not currently supported by the RAMP API, and cannot wait for a change request in support of the use-case to go through the official channels. To facilitate this, we have exposed some unofficial properties to allow access to the mapping API (currently, [ESRI Javascript API v3](https://developers.arcgis.com/javascript/3/)).

Please exercise caution when using these properties. For example, directly manipulating the map could cause the RAMP application to become out-of-synch with the map state. Also, when upgrading to a later version of RAMP, please do adequate testing on any components directly using the ESRI API to ensure compatibililty has not been broken.

### Accessing the Map Object

To access the underlying [ESRI map object](https://developers.arcgis.com/javascript/3/jsapi/map-amd.html) for a given map, use the `esriMap` property on the API Map object.

Example: change the [fade on zoom](https://developers.arcgis.com/javascript/3/jsapi/map-amd.html#fadeonzoom) setting of the map.

```js
let myMap = RAMP.mapById('myMap');
myMap.esriMap.fadeOnZoom = false;
```

### Accessing the Layer Object

To access the underlying [ESRI layer object](https://developers.arcgis.com/javascript/3/jsapi/layer-amd.html) for a given layer, use the `esriLayer` property on the API Layer object.

Example: turn off [mouse events](https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#disablemouseevents) of a Feature Layer.

```js
let myMap = RAMP.mapById('myMap');
let myFeatureLayer = myMap.layers.getLayersById('myFeatureLayer')[0];
myFeatureLayer.esriLayer.disableMouseEvents();
```

### Accessing Map API Classes

To use any of the [DOJO Classes](https://developers.arcgis.com/javascript/3/jsapi/), the following approaches can be used via the `GAPI` reference.

The `esriBundle` property provides access to all the classes that the RAMP core is using. This will save you from having to execute a dedicated module load command. The property returns an object whos properties contiain classes or utility modules.

Example: creating an ESRI API Colour object.

```js
let myColour = new RAMP.GAPI.esriBundle.Colour([25, 240, 70]);
```

The `esriLoadApiClasses()` method will load a class that does not exist in the `esriBundle`. The input parameter is an array of arrays; the inner arrays contain two strings - the name path of the module in the ESRI API, and the name of the property the module should be placed on in the return value. The function returns a promise that resolves with the results object.

Example: loading a class and a utility module.

```js
let myBundlePromise = RAMP.GAPI.esriLoadApiClasses([['esri/tasks/FindTask', 'findTaskClass'],
                                                 ['esri/kernel', 'kernel']]);
myBundlePromise.then(myBundle => {
    let myFind = new myBundle.findTaskClass();
    let myVersion = myBundle.kernel.version;
});
```