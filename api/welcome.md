### Introduction

This guide is intented for developers. It outlines the entire viewers API and provides examples throughout.

In all but some trival cases, you'll want to use the API in something called an `extension`. An `extension` is a file(s) where you can write custom code that uses our API. There is no right or wrong way to write an extension - choose the approach that works best for you.

We'll start by example - building an extension that allows you to toggle layer visibility through an external select box.

### Getting Started

Let's create a new file named `layerSelector.js`. The relative path to the `layerSelector.js` file goes inside the `rv-extensions` property of your map element, like so:

```html
<div is="rv-map" rv-config="config.json" rv-extensions="js/layerSelector.js"></div>
```

Additional extensions can be added, separated by commas:

```html
<div id="map1" is="rv-map" rv-config="config.json" rv-extensions="js/layerSelector.js,http://www.example.com/js/anotherextension.js"></div>
```

### Adding the select element

Inside `layerSelector.js` type the following:

```js
var newSelect = document.createElement("select");
newSelect.onchange = "changeVisibility(this)";
mapInstance.layers.forEach(function(layer) {
 var option = document.createElement("option");
 option.text = layer.getName();
 option.value = layer.getId();
 newSelect.add(option);
});
document.body.insertBefore(newSelect, mapInstance.getDiv());
```

You first create a new select element then iterate over all layers adding them as options to the select element. Lastly, we add the select element before the viewer element.

You might be wondering where `mapInstance` comes from - it's a scoped variable that the api adds to our extension file when it gets loaded and executed.

### Adding changeVisibility function

Now you'll add the function `changeVisibility` that we called in the above code.

```js
function changeVisibility(element) {
 mapInstance.layers.forEach(function(layer) {
   layer.setVisibility(false);
 });
 mapInstance.layers.getLayerById(element.value).setVisibility(true);
}
```

This function iterates over all layers setting visibility to false. It then gets the selected layer and makes it visible.

### All together now

```js
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

  function changeVisibility(element) {
     map.layers.forEach(function(layer) {
         layer.setVisibility(false);
     });
     map.layers.getLayerById(element.value).setVisibility(true);
}
```

### Advanced extension loading

This section is for more advanced types of extension loading. It should only be used if setting the `rv-extensions` property is not desirable or you wish to support dynamically added maps.

We'll modify the above example so that it can be loaded directly in the host page without the use of the `rv-extensions` property.

### Loading the file

You **must** load extension files **after** the main viewers javascript file `rv-main.js` so that the global `RV` namespace can be created before your extension uses it.

```html
<script src="rv-main.js"></script>
<script src="js/layerSelector.js"></script>
```

### Get map instances

You no longer have access to the scoped `mapInstance` variable like you did when you used the `rv-extensions` property. Instead you can subscribe to the `RV.map_added` observable like this:

```js
RV.map_added.subscribe(mapInstance => {
  // ...
});
```

Depending on when your extension loaded, some maps may have already loaded. You will only receive mapInstance that are created **after** you subscribe. To handle any previous map instances you can:

```js
RV.mapInstances.forEach(mapInstance => {
  // ..
});
```

### All together

```js
  RV.mapInstances.forEach(onNewMap);
  RV.map_added.subscribe(onNewMap);

  const mapInstanceList = {};

  function onNewMap(mapInstance) {

    mapInstanceList[mapInstance.id] = mapInstance;

    var newSelect = document.createElement("select");
    newSelect.onchange = "changeVisibility(this)";
    mapInstance.layers.forEach(function(layer) {
        var option = document.createElement("option");
        option.text = layer.getName();
        option.value = layer.getId();
        option.mapID = mapInstance.id;
        newSelect.add(option);
    });
    document.body.insertBefore(newSelect, mapInstance.getDiv());
  }

  function changeVisibility(element) {
    const map = mapInstanceList[element.mapID];

     map.layers.forEach(function(layer) {
         layer.setVisibility(false);
     });
     map.layers.getLayerById(element.value).setVisibility(true);
}
```