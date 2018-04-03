# Intentions

Intentions are internal extensions that reside in a sub-folder of [fpgv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf). They are developed and fully supported by the core RAMP team. Intentions allows an easy way to develop and activate RAMP functionality that is not normally bundled with RAMP's library.

## Getting Started

In order to load and activate intentions. First, you will need to open your **configuration file** and add the following JSON object with property `intentions`.

```json
    "intentions": {}
```

## Loading Intentions

Each property inside `intentions` is an intention that will be loaded into RAMP. There are many different intentions that are available to choose from.

```json
    "intentions": {
        "epsg": "default",
        "dataTable": "none"
    }
```

The value of an intention indicates the way how RAMP will be loading the intention. Default is set to `"none"` if the intention is not specified in `intention` thus it will not be loaded. There are 3 settings available:

- `"default"`: This will load the default intention.

- `"none"`: This is the default setting.  As the suggested, the intention will be excluded.

- **Name of the extension**: The name of the extension you would like the default intention to be replaced by.

<p class="danger">
    When setting the value for an intention. Please ensure the name matches the intention you are intended to add for the intention to be applied. However, having none-existence intentions will not affect RAMP nor causes errors.
<p>

## Writting an Extension to repleace an Intention

First you will need to load the extension file before the main viewers JavaScript file `rv-main.js`. We will call it `my-extention.js` in our example.

```html
<script src="my-extention.js"></script>
```

When writing an extension. You will need to create a variable and the name of the variable will be the name of the extension. The variable should execute a function returning an object containing methods`preInit` and `init`. RAMP will automatically call the two methods. `preInit` will be called before API is ready. `init` will be called after the API is ready.

Here is an example of what an extension would look like

```js
var intentionExt = (() => {
    return {
        preInit: () => {
            // ...
        },
        init: () => {
            // ...
        }
    }
})();
```

Finally, You will also need to specify what the intention you are intended to replace and the name of the extensions.

```json
    "intentions": {
        "myIntention": "intentionExt",
    }
```
