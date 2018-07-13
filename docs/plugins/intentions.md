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


## Intention List

- [EPSG](#epsg)
    - [Writing Your Own](#writing-your-own)
        - [Example](#example)
        - [Applying to RAMP](#applying-to-ramp)
    - [Intention List](#intention-list)
        - [EPSG](#epsg)
            - [Required methods](#required-methods)
            - [Required properties](#required-properties)
        - [Geosearch](#geosearch)
            - [Required methods](#required-methods)

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
