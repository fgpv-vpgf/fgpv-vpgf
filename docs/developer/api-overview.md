---
nav: dev
---

# Overview

This guide is intended for users comfortable with JavaScript and geo mapping. It covers the top level API structure and provides sample code throughout. 

You should also have a basic understanding of **observables** which are used to handle asynchronous events. For this, we use [RxJS](https://rxjs-dev.firebaseapp.com/). Feel free to check out the [RxJS documentation](https://rxjs-dev.firebaseapp.com/) for more detailed information on how they work. For this guide, understanding `subscribe` is sufficient. 

<p class="tip">
  Use this guide as an introduction to the [technical documentation](api/developer/). It will give you a basic understanding of how the API is structured and some of what it can do but you should refer to the technical documentation after reading this guide for complete information.
</p>

## How to access the API

The API can be accessed via the global variable `window.RZ`. 

This variable is available as soon as the ramp viewer library (.js file) has loaded on the host page. The easiest way to know `window.RZ` is ready is to write your code in the form of a [plugin](developer/plugins). For this guide however we'll assume the ramp viewer library has finished loading before our sample code gets executed.

## Accessing a map instance

You can't do anything exciting without first finding the map instance you'd like to interact with. Since there can be multiple ramp viewers on the same page most API functionality is on a **map instance**. `RZ.mapInstances` is an array of such API map instances, one instance per ramp viewer you have on the page (typically just one). If your host page only has one ramp viewer then it's easy - `RZ.mapInstances[0]`. If there are multiple ramp instances on a page you can use the `RZ.mapById` function to find a particular one. 

You can subscribe to the `RZ.mapAdded` observable which will emit an API map instance as soon as its created. 

## Map instances

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

### Layers
`RZ.mapInstances[0].layers` provides access to layer attributes, identify, and layer specific observables.

There are two layer types:
- [ConfigLayer](developer/api_tech_docs/classes/_api_src_layers_.configlayer.html)  
  - Created automatically for every layer in the viewers configuration but can also be created outside the config.
  - Cannot have geometries added to it.
- [SimpleLayer](developer/api_tech_docs/lasses/_api_src_layers_.simplelayer.html)  
  - Created programmatically via the API.
  - Can have geometries added to it.
  - There is a default simple layer in the API 

TODO: Link to layers doc when complete.

### UI
The UI module provides access to manipulate the viewer's UI.

TODO: Link to Panels and Legend UI components when complete.