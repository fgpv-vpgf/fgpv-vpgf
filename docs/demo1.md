## Built in UI functionality

`GeoSearch` has a special method `ui` with the following constructor signature:

`(input?: HTMLInputElement, resultContainer?: HTMLElement, rIterator?: Function)`

- input (optional): An HTML `<input>` element 
- resultContainer (optional): Any HTML element that will contain the query results
- rIterator (optional): A function which receives a result object and is expected to return an HTML element

#### Result object passed to rIterator

```js
{
    name: string, // Toronto
    location: string, // York
    province: string, // Ontario
    type: string, // CITY
    pointCoords: Array<number> // [-79.3733,43.7417]
    bbox: Array<number> //[-79.6506726,43.3399715,-78.9970696,43.9292617]
}
```

<p class="warning">
    `resultContainer` is a `ul` element by default, and `rIterator` returns `li` elements by default. You should provide both of these parameters to maintain valid HTML. Any HTML elements omitted will be auto generated. The `input` element is always watched for changes regardless of who provides it.
</p>

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
You do not need to provide any parameters to `GeoSearch`. You can simply instantiate an instance of the class and append its html output on your page. 

#### Auto Generated
````html
<script src="dist/geosearch.js"></script>
<div id="autoSearch"></div>

<script>    
    var geoSearchAuto = new GeoSearch();
    document.getElementById('autoSearch').append(geoSearchAuto.ui().htmlElem);
</script>
````

#### Custom Elements
````html
<script src="dist/geosearch.js"></script>

<input id="searchField" name="searchField" type="text">
<ul id="resultElem"></ul>

<script>    
    var geoSearch = new GeoSearch();
    geoSearch.ui(document.getElementById('searchField'), document.getElementById('resultElem'));
</script>
````

#### Format Custom Elements

````html
<script src="dist/geosearch.js"></script>

<input id="searchField" name="searchField" type="text">
<ul id="resultElem"></ul>

<script>    
    function customIterator(result) {
        var li = document.createElement('li');
        li.innerHTML = result.name + ' (' + result.location + ', ' + result.province + ') @ ' + result.pointCoords;
        return li;
    }
    var geoSearch = new GeoSearch();
    geoSearch.ui(document.getElementById('searchField'), document.getElementById('resultElem'), customIterator);
</script>
````