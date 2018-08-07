<!-- WARNING: This file makes use of the "two spaces for newline" markdown rule.
     If your editor is set to trim trailing whitespace you may ruin the formatting. -->

# User Documentation
## Overview
<p class="danger">
  The API in this guide is not yet officially supported until RAMP v3 is released. If using, please keep in mind that any part of the api can change without advanced notice.
</p>

This guide is intended for users comfortable with JavaScript and geo mapping. Knowledge of how RAMP works is not required. It provides an overview of the API structure, components, and some coding examples.

<p class="tip">
  Use this guide as an introduction to the [technical documentation](api/developer/). It will give you a basic understanding of how the API is structured and some of what it can do but you should refer to the technical documentation after reading this guide for more detailed information.
</p>

Through this guide you will get an understanding on how to use the API to interact with the map. 

## API Structure & Components
The API can be accessed using `RZ` in a page that contains RAMP. Everything that we will discuss below can be accessed through this. 

Here we'll expand a bit on the components available in the API.

There are 5 modules in the API, `events`, `geometry`, `layers`, `ui`, and `map`. Let's take a look at each component.

### Events
There are 3 types of events that can be accessed through the API.
- [MapClickEvent](api/developer/classes/_api_src_events_.mapclickevent.html)  
  Provides a `features` Observable to map clicks to support the identify functionality
- [MouseEvent](api/developer/classes/_api_src_events_.mouseevent.html)  
  Provides screen and geographic point information for most observable mouse actions.
- [PanelEvent](api/developer/classes/_api_src_events_.panelevent.html)  
  Provides information for observable panel actions

### Geometry
The geometry module contains the different geometries that can be drawn on the map. All of these can be accessed in `RZ.GEO`.

The main geometries are:
- [Points](api/developer/classes/_api_src_geometry_.point.html) and [MultiPoints](api/developer/classes/_api_src_geometry_.multipoint.html)
- [Lines](api/developer/classes/_api_src_geometry_.linestring.html) and [MultiLines](api/developer/classes/_api_src_geometry_.multilinestring.html)
- [Polygons](api/developer/classes/_api_src_geometry_.polygon.html) and [MultiPolygons](api/developer/classes/_api_src_geometry_.multipolygon.html)

The constructors for each of these geometries accepts an options object that allows you to apply styles to it. The available options are specified in the constructor and as the `StyleOptions` classes.

There are a few other components that are not directly geometries but are used by them:
- [Hover](api/developer/classes/_api_src_geometry_.hover.html)  
  Creates a hovertip to be displayed whenever a geometry is moused onto.
- [XY](api/developer/classes/_api_src_geometry_.xy.html)  
  Represents a geographical point in decimal degrees
- [XYBounds](api/developer/classes/_api_src_geometry_.xybounds.html)  
  Represents a rectangular geographical area with north-east and south-west boundary `XY` definitions

### Layers
The layers module provides access to the layer capabilities of the viewer.

There are two layer types:
- [ConfigLayer](api/developer/classes/_api_src_layers_.configlayer.html)  
  - Created automatically for every layer in the viewers configuration but can also be created outside the config.
  - Cannot have geometries added to it.
- [SimpleLayer](api/developer/classes/_api_src_layers_.simplelayer.html)  
  - Created programmatically via the API.
  - Can have geometries added to it.
  - There is a default simple layer in the API 

There's a lot that can be done using `configLayers` and `simpleLayers` so it is recommended that you take a look at the technical documentation for them for the full details. Both can be accessed using `RZ.LAYERS`. Config and simple layers have similar events, properties, accessors, and methods the only difference being that simple layers can have geometries while config layers cannot.

There is also the [LayerGroup](api/developer/classes/_api_src_layers_.layergroup.html).  
This is created for every map instance and consists of all layers on the map. Layers can be added through the viewer configuration, import options, and externally.

### UI
The UI module provides access to manipulate the viewer's UI.

There are three main components:
- [Basemaps](api/developer/classes/_api_src_ui_.basemap.html)  
  Created automatically for every basemap in the viewers configuration. Can also be created outside the config.  
  Used to listen for changes and access basemap properties.
- [Panels](api/developer/classes/_api_src_ui_.panel.html)  
  Represents a top level viewer panel. There are currently 3 panels: `main`, `side`, and `table`.  
  Used to open/close panels and watch for open/close events.
- [ToolTips](api/developer/classes/_api_src_ui_.tooltip.html)  
  Handles the addition of tooltips and the tooltip event streams.  
  Each map instance contains one ToolTip instance.

There are also two other objects to contain the multiplicities of UI components for a map:
- [BasemapGroup](api/developer/classes/_api_src_ui_.basemapgroup.html)  
  Contains all the basemaps on a map instance. Basemaps can be added through the viewer config or externally.
- [PanelRegistry](api/developer/classes/_api_src_ui_.panelregistry.html)  
  Is a collection of panels with helper methods and events to help manage them.

### Map
The map module provides access to the [Map](api/developer/classes/_api_src_map_.map.html) class. This allows you to modify the map, watch for changes, and access layers and UI properties.

To access a map instance we can use `RZ.mapInstances` to retrieve a list of all map instances or `RZ.mapById(<mapId>)` to retrieve a specific map instance if we know the id of the map. 

## Observables
In the API we make extensive use of observables to handle asynchronous events. For this, we use [RxJS](https://rxjs-dev.firebaseapp.com/). Feel free to check out the [RxJS documentation](https://rxjs-dev.firebaseapp.com/) for more detailed information on how they work. 

Let's look at a few key observables. 

### `mapAdded`
We can use this from `RZ.mapAdded`. It emits an instance of the map class whenever a new map is added to the viewer. Use it to trigger an action on a map after it's added.

### `click`
We can use this from `mapInstance.click`. This uses the `MapClickEvent` to emit a features observable for map clicks. Use it to subscribe to a feature list returned when clicking the map.

### `geometryAdded`
We can use this from `mySimpleLayer.geometryAdded` where `mySimpleLayer` is a layer on the map. This emits an array of geometries added whenever a geometry is added to the map.


These are just a few examples of the available observables. For a full listing refer to the [technical documentation](api/developer/).

## Putting it to Use
Now that we have an overview of the API components, let's take a look at an example. In all but some trivial cases, you'll want to use the API in an [`extension`](/plugins/extensions). 

<p class="tip">
For more details about getting started with and using extensions checkout the [extensions documentation](/plugins/extensions).
</p>

In this example we'll walk through adding a simple layer to a map and adding geometry to it. This is a very contrived example but it should help you understand the fundamentals of using the API.

### Getting Started
Since our task is simple we wont be making it an extension. Instead, we'll go over how to get this done using API through the developer console.

If you would like to walk through this example with us all you need to do is go to a page with a RAMP instance and open up the developer console. From here you'll be able to follow along and see the same results we do!

### Getting the Map Instance
Now that we're set up, let's add some functionality to our extension. We'll start by getting the map instance.

In the developer console type
```js
let mapInstance = RZ.mapInstances[0]; 
```
This gives us an easy way to reference the map instance. If you have multiple maps on the page you're using and you would like to use a specific map you would have to know the mapId and use
```js
let mapInstance = RZ.mapById(<mapId>).
```

### Creating a Layer
Now that we have the map instance let's make a new simple layer called `myNewLayer` by adding it to the map. This part is a little tricky because `addLayer` returns a promise so we need to do a little more than just add the layer.
```js
let myNewLayer; 
let myNewLayerPromise = mapInstance.layers.addLayer("myNewLayer");
myNewLayerPromise.then(layers => { myNewLayer = layers[0]; });
```
Here we resolve the promise from `addLayer` and extract the newly created layer form the resolved array.

### Adding Geometry
We have our layer, so we're ready to add some geometry.

First, let's add a default point to our layer.  
To do this we make a point and then add it to the layer using the `addGeometry` function.
```js
var pointA = new RZ.GEO.Point(0, [-79, 43]);
myNewLayer.addGeometry(pointA);
```
This time let's add another point but with a specified icon.
```js
var pointB = new RZ.GEO.Point(0, [79, 32], {icon: 'https://image.flaticon.com/icons/svg/17/17799.svg'});
myNewLayer.addGeometry(pointB);
```
To do this we provide the `icon` option to the point constructor. For the full list of options refer to the [technical documentation](api/developer/classes/_api_src_geometry_.point.html).

Now let's add a hover tooltip to the point we just made.
```js
var hoverB = new RZ.GEO.Hover(0, 'my annotation', { position: 'right' });
pointB.hover = hoverB;
```

Now that you have a general understanding of the API take a look at the [extensions documentation](/plugins/extensions) to make your own extension or dive into the [technical documentation](api/developer/) for the finer details.
