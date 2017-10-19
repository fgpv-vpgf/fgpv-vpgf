### Quick Links

|{@link RV}|
|---------|
|{@link RV.Map}|{@link RV.GEOMETRY}|
|{@link RV.LAYER} | {@link RV.LAYER.ConfigLayer} | {@link RV.LAYER.SimpleLayer} |

### What's new October 13
- Completed introduction guide (creating extentions)
- Removed projection support until its needed
- Expanded documentation on creating and registering extentions
- Created 'map_added' event to `RV`
- Added `addListener` and `addListenerOnce` to RV for extension registration`
- Renamed LatLng and similar classes to XY
- Added `Polygon`, `MultiPolygon`, `Annotation`, `MultiAnnotation`, and `LinearRing` geometry types
- Added `fetchData` and `setLayerDefinitions` on `configLayer`
- Added a `Popup` class to `RV.UI` available through `mapInstance.popup`
- Added partial config loading on mapInstance

### Introduction

This guide is intented for developers. It outlines the entire viewers API and provides examples throughout.

In all but some trival cases, you'll want to use the API in something called an `extention`. An `extention` is a file(s) where you can write custom code that uses our API. There is no right or wrong way to write an extention - choose the approach that works best for you.

We'll start by example - building an extention that allows you to toggle layer visibility through an external select box.

### Getting Started

Let's create a new file named `layerSelector.js`. We'll jump right in and write some code, inside `layerSelector.js` type:

```js
(function() {
  var map;
  RV.addListenerOnce('map_added', init);
  function init(mapInstance) {
   map = mapInstance; // save instance for future use
  }
})();
```

You don't want the extention code executing immediatly on load since the API may not be ready. Instead, you wait for a special event `map_added` which invokes your `init` function. For now we can just store the `mapInstance` in a local variable for later use.

It's best practise to use an immediately invoked function expression like we have above so that the global namespace does not get polluted.

@see {@link RV.Map} for more information on `mapInstance`

### Registering extention file

The relative path to the `layerSelector.js` file goes inside the `rv-extentions` property of your map element.

```html
<div is="rv-map" rv-config="config.json" rv-extentions="js/layerSelector.js"></div>
```

Additional extentions can be added, separated by commas:

```html
<div id="map1" is="rv-map" rv-config="config.json" rv-extentions="js/layerSelector.js, http://www.example.com/js/anotherExtention.js"></div>
```

You can also skip using `rv-extentions` entirely and load the `layerSelector.js` directly after the viewers `rv-main.js` file.

```html
<script src="js/rv-main.js"></script>
<script src="js/layerSelector.js"></script>
```

If you go this route you should change the line `RV.addListenerOnce('map_added', init);` in `layerSelector.js` to `RV.addListener('map_added', init);` so that your extention is invoked for all viewer instances on the page, not just the first one.

### Adding the select element

Inside the `init` function in `layerSelector.js` type the following:

```js
var newSelect = document.createElement("select");
newSelect.onchange = "changeVisibility(this)";
map.layers.forEach(function(layer) {
 var option = document.createElement("option");
 option.text = layer.getName();
 option.value = layer.getId();
 newSelect.add(option);
});
document.body.insertBefore(newSelect, map.getDiv());
```

You first create a new select element then iterate over all layers adding them as options to the select element. Lastly, we add the select element before the viewer element.

### Adding changeVisibility function

After the `init` function let's add another function named `changeVisibility`.

```js
function changeVisibility(element) {
 map.layers.forEach(function(layer) {
   layer.setVisibility(false);
 });
 map.layers.getLayerById(element.value).setVisibility(true);
}
```

This function iterates over all layers setting visibility to false. It then gets the selected layer and makes it visible.

### All together now

```js
(function() {
  var map;
  RV.addListenerOnce('map_added', init);
  function init(mapInstance) {
     map = mapInstance; // save instance for future use
     var newSelect = document.createElement("select");
     newSelect.onchange = "changeVisibility(this)";
     map.layers.forEach(function(layer) {
         var option = document.createElement("option");
         option.text = layer.getName();
         option.value = layer.getId();
         newSelect.add(option);
     });
     document.body.insertBefore(newSelect, map.getDiv());
  }
  function changeVisibility(element) {
     map.layers.forEach(function(layer) {
         layer.setVisibility(false);
     });
     map.layers.getLayerById(element.value).setVisibility(true);
}
})();
```
