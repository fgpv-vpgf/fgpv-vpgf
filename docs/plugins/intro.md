# Intentions

Intentions are internal extensions that reside in a sub-folder of [fpgv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf). They are developed and fully supported by the core RAMP team. Intentions are default RAMP features that can be easily disabled or replaced. They come bundled with RAMP and no additional setup is needed to use them.

## Getting Started

Default Intentions are loaded automatically when starting RAMP.  If you want to remove or replace individual intentions, you will need to open your **configuration file** and add the following JSON object with property `intentions`.  This is not strictly needed however.

```json
    "intentions": {}
```

<p class="tip">
    By omitting the `intentions` property, RAMP will simply load all the default intentions.
</p>

## Ways of Loading Intentions

Each property inside `intentions` is an intention that will be loaded into RAMP.

```json
    "intentions": {
        "epsg": "default"
    }
```

The value of an intention indicates the way RAMP will be loading the intention. Default is set to `"none"` if the intention is not specified in `intention` thus it will not be loaded. There are 3 settings available:

- `"default"`: This will load the default intention.

- `"none"`: This is the default setting.  As suggested, the intention will be excluded.

- **Name of the extension**: The name of the extension you would like the default intention to be replaced by.

<p class="danger">
    When setting the value for an intention. Please ensure the name matches the intention you are intended to add for the intention to be applied. However, having non-existing intentions will not affect RAMP nor causes errors.
<p>

## Replacing an Intention

First you will need to load the extension file before the main viewers JavaScript file `rv-main.js`. We will call it `my-extention.js` in our example.

```html
<script src="my-extention.js"></script>
```

When writing an extension. You will need to create a variable and the name of that variable will be the name of the extension. It needs to contain methods either `preInit` or `init` or both depending on the intention you want to replace.

Here is an example of the general structure.

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

RAMP will call methods `preInit` and `init` automatically once the extension is loaded.  `preInit` will be called before the map object of RAMP and API are ready.  Instructions here should be intended to use for creating the map object.  Inversely `init` will be called when both map object and API are ready.  It should be used for actions that depend on the completion of map object.

<p class="danger">
    Be sure to read the documentation for the intention you intend to replace. It may require both `preInit` and `init` to be defined, with specific return types from `preInit`.
<p>

Finally, You will also need to specify what the intention you are intended to replace and the name of the extensions.

```json
    "intentions": {
        "myIntention": "intentionExt",
    }
```
