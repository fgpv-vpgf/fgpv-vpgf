# Intentions

Intentions are default RAMP features that can be easily disabled or replaced. They are bundled with RAMP and no additional setup is needed to use them. They are similar to extensions and differ only in how they are loaded and what methods and properties are expected of them. 

## Loading

You can specify which intentions should be loaded in the maps configuration file. The top level `intentions` property should list all intentions to be loaded and whether you'd like the default behavior or a custom implementation. For example, in our configuration file:

```json
    "intentions": {
        "epsg": "default"
    }
```

`epsg` is a projection lookup intention that uses http://epsg.io. The value `default` indicates you want to load the `epsg` intention that comes bundled with RAMP. There are two other possible values:

- `none`: indicates that the intention should not be loaded.
-  Any other value indicates a custom implementation is available on the global window object which should be used in place of the default implementation.
  - For example, `"epsg": "customEPSG"` indicates that you'll create a replacement intention that is available to RAMP via `window.customEPSG`.

<p class="danger">The `intentions` configuration property is inclusive - any intention omitted will not be loaded.</p>

## Hello, World!

Let's build a simple intention to replace the default one:

```js
// place in a script tag before loading RAMP
window.customEPSG = {
    lookup: function(code) {
        return new Promise(function(resolve, reject) {
            $.get(`https://epsg.io/${matcher[1]}.proj4`)
                .done(resolve)
                .fail(reject);
        });
    }
}
```

Then in the configuration file:

```json
    "intentions": {
        "epsg": "customEPSG"
    }
```


## Intention List

- [EPSG](#epsg)

### EPSG

#### Required methods

```ts
// given a projection code, returns a promise that resolves to a proj4 string definition
lookup: (code: string | number) => Promise<"proj4 string definition">
```

#### Required properties

None
