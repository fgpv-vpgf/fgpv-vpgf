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
- [Geosearch](#geosearch)

### EPSG

#### Required methods

```ts
// given a projection code, returns a promise that resolves to a proj4 string definition
lookup: (code: string | number) => Promise<"proj4 string definition">
```

#### Required properties

None

### Geosearch

#### Required methods

```js
/**
 * A constructor that consumes an optional config object to
 * create an object/interface that provides geosearch services
 */
GeoSearchUI(config)
```

The fellowing are the valid config object properties:
```js
{
    includeTypes: string | Array<string>,
    excludeTypes: string | Array<string>,
    language: string,
    maxResults: number,
    geoLocateUrl: string,
    geoNameUrl: string
}
```

`GeoSearchUi` is required to have the fellowing methods
```js
/**
 * Given some string query, returns a promise that resolves as a formated location objects
 *
 * Valid location object prototype:
 * {
 *      name: string,
 *      bbox: Array<number>, // exactly 4 entries. Longitudes and latitudes respectively twice
 *      type: {
 *          name: string
 *      },
 *      position: Array<number>, // exactly 2 entries. Longitude and latitude respectively
 *      location: {
 *          city: string,
 *          latitude: number,
 *          longitude: number,
 *          province: string
 *      }
 * }
 *
 * @param {string} q the search string this query is based on
 * @return {Promise} the promise that resolves as a formated location objects
 */
query(q)

/**
 * Retrun a list of formated province objects
 *
 * Valid province object
 * {
 *      code: string,
 *      abbr: string,
 *      name: string
 * }
 *
 * @return {Array} a list of formated province objects
 */
fetchProvinces()

/**
 * Retrun a list of formated type objects
 *
 * Valid type object
 * {
 *      code: string,
 *      name: string
 * }
 *
 * @return {Array} a list of a formated type objects
 */
fetchTypes()
```
