## Built in UI functionality

`GeoSearch` has a special method `ui` with the following constructor signature:

`(resultHandler?: Function, featureHandler?: Function, input?: HTMLInputElement, resultContainer?: HTMLElement, featureContainer?: HTMLElement)`

- resultHandler: A function which receives an array of `resultObject` (see below) and is expected to return an HTML element with all results rendered
- featureHandler: A function which receives either an `FSAResult` or `NTSResult` object (see below) and is expected to return an HTML element with the rendered result
- input (optional): An HTML `<input>` element 
- resultContainer (optional): Any HTML element that will contain the query results
- featureContainer (optional): Any HTML element that will contain a special query feature result

#### resultObject

```js
{
    name: string, // "Toronto"
    location: string, // "York"
    province: string, // "Ontario"
    type: string, // "CITY"
    latLon: latLon, // [-79.3733,43.7417]
    bbox: Array<number> //[-79.6506726,43.3399715,-78.9970696,43.9292617]
}
```

#### FSAResult

```js
{
    fsa: string, // "H0H"
    code: string, // "FSA"
    desc: string, // "Forward Sortation Area"
    province: string, // Ontario
    latLon: latLon
}
```


#### NTSResult

```js
{
    nts: string, // 064D or 064D06
    location: string, // "NUMABIN BAY"
    code: string, // "NTS"
    desc: string, // "National Topographic System"
    latLon: latLon, // [-79.3733,43.7417]
    bbox: Array<number> //[-79.6506726,43.3399715,-78.9970696,43.9292617]
}
```

### Installation

#### Package manager
Using a package manager such as npm or yarn:

```bash
npm i --save github:RAMP-PCAR/geosearch

or

yarn add github:RAMP-PCAR/geosearch
```

Then import or require `GeoSearch` from `src/index.ts`.

#### Precompiled

This repo contains a `dist` folder where you'll find various precomiled library versions ready to be included in a `script` tag on your page. Chose one of:
- `geosearch-polyd.js`
- `geosearch.js`

<p class="danger">
    A global window object will be created on `window.GeoSearch`. The file size of `geosearch-polyd.js` is much larger than `geosearch.js` because it contains polyfills for IE support. Use `geosearch.js` if your webpage already has polyfills or you don't care to support IE. You should only include one of the scripts in the `dist` folder, you don't need to include all of them.
</p>

### Examples
You can pass an optional configuration object to `GeoSearch`. After instantiating an instance, you append its HTML output on your page. 

#### Auto Generated
````html
<script src="dist/geosearch.js"></script>
<div id="autoSearch"></div>

<script>    
    var geoSearchAuto = new GeoSearch({includeTypes: ['CITY', 'FSA', 'NTS', 'PROV', 'TERR', 'TOWN']});
    document.getElementById('autoSearch').append(geoSearchAuto.ui().htmlElem);
</script>
````

#### Custom Elements
````html
<script src="dist/geosearch.js"></script>

<input id="searchField" name="searchField" type="text">
<div id="feature"></div>
<ul id="resultElem"></ul>

<script>    
    var geoSearch = new GeoSearch();
    geoSearch.ui(null, null, document.getElementById('searchField'), document.getElementById('resultElem'), document.getElementById('feature'));
</script>
````