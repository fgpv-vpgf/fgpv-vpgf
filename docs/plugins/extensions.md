# Extensions

An extension uses the API to add or modify some specific functionality within RAMP. 

## Loading

You specify which extensions will be loaded in the `rz-extensions` map element property as a comma separated list:

```html
<div is="rv-map"
  rz-extensions="extension1,extension2, . . ."
  rv-config="config.json">
</div>
```

Each list item, like `extension1` or `extension2`, corresponds to an extension that can be found on the global window object.

## Hello, World!

Let's build a simple extension that console logs whenever the map boundary changes:

```js
// place this in a script tag before RAMP is loaded
window.myExtension = {
    init: function(api) {
        api.boundsChanged.subscribe(console.log);
    }
};
```

`init` is a special function that gets called by RAMP with the maps api when its available. Now, in our map element:

```html
<div is="rv-map"
  rz-extensions="myExtension"
  rv-config="config.json">
</div>
```



