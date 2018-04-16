# EPSG
An intention provides a proj4 style projection definition for a given ESPG code.

## Writing Your Own
Method `preInit` must be present in EPSG.  `preInit` should return either a `Promise<function>` or `function`.  The returning function must be a lookup function that returns a promise of a projection definition that is type `Promise<string>`.

<p class="tip">
    Method `init` can also be added in EPSG.  It will be run if detected but it is not strictly required.
</p>

### Example
```js
var epsgExt = (() => {
    return {
        preInit: () => {
            function lookup() {
                return new promise('projection');
            }
            return new Promise(lookup);
        }
    }
})();
```

### Applying to RAMP
Add the property `epsg` under `intentions` in the **configuration file** specifying the name of the intention variable.

```json
    "intentions": {
        "epsg": "epsgExt"
    }
```
