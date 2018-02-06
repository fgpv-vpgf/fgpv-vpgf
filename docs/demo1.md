## GeoSearchUI

This is a UI extension of the base class implementation `GeoSearch` which simplifies the process of adding geosearch into html web pages. 

The class has the following constructor signature:

`(config?: config, input?: HTMLInputElement, resultContainer?: HTMLElement, rIterator?: Function)`

- config (optional): [configuration](/config) object
- input (optional): An HTML `<input>` element 
- resultContainer (optional): Any HTML element that will contain the query results
- rIterator (optional): A function which receives a result object and is expected to return an HTML element

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

Then import or require `GeoSearchUI` from `src/ui.ts`.

#### Precompiled

This repo contains a `dist` folder where you'll find various precomiled library versions ready to be included in a `script` tag on your page. Chose one of:
- `geosearch-ui-polyd.js`
- `geosearch-ui.js`

<p class="danger">
    A global window object will be created on `window.GeoSearchUI`. The file size of `geosearch-ui-polyd.js` is much larger than `geosearch-ui.js` because it contains polyfills for IE support. Use `geosearch-ui.js` if your webpage already has polyfills or you don't care to support IE. You should only include one of the scripts in the `dist` folder, you don't need to include all of them.
</p>

### Examples
You do not need to provide any parameters to `GeoSearchUI`. You can simply instantiate an instance of the class and append its html output on your page. 

#### Auto Generated
````html
<script src="dist/geosearch-ui.js"></script>
<div id="autoSearch"></div>

<script>    
    var geoSearchAuto = new GeoSearchUI();
    document.getElementById('autoSearch').append(geoSearchAuto.htmlElem);
</script>
````


#### Custom Elements
````html
<script src="dist/geosearch-ui.js"></script>

<input id="searchField" name="searchField" type="text">
<ul id="resultElem"></ul>

<script>    
    var geoSearch = new GeoSearchUI(null, document.getElementById('searchField'), document.getElementById('resultElem'));
</script>
````

#### Format Custom Elements

## Getting results

```js
var geoSearch = new GeoSearch();
geoSearch.query('Toronto').then(function(results) {...});
```

`results` will contain the following structure:

```js
{
    name: string, // Toronto
    type: {
        name: string, // i.e. City
        description: string
    },
    bbox?: Array<number>,
    geometry: {
        type: string,
        coordinates: Array<number>
    }
}
```

````html
<script src="dist/geosearch-ui.js"></script>

<input id="searchField" name="searchField" type="text">
<ul id="resultElem"></ul>

<script>    
    function customIterator(result) {
        var li = document.createElement('li');
        li.innerHTML = result.name + ' ( ' + result.type.name + ' ) @ ' + result.geometry.coordinates;
        return li;
    }
    var geoSearch = new GeoSearchUI(null, document.getElementById('searchField'), document.getElementById('resultElem'), customIterator);
</script>
````