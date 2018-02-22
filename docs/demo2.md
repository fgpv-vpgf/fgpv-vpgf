## GeoSearch

The constructor only takes one parameter, [config](/config) (optional).

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

### Example

#### IE 11 users [click here](./ie.html)

````html
<script src="dist/geosearch.js"></script>

<script>    
    function getResults(query, config = {includeTypes: ['PROV', 'CITY', 'TOWN', 'TERR', 'LAKE']}) {
        // GeoSearch is a global window object since we included the library directly on our page.
        var geoSearch = new GeoSearch(config);
        geoSearch.query(query).onComplete.then(function(q) {
            if (q.results.length > 0) {
                // json2html is used to display some of the returned data from our library for simplification. 
                document.getElementById("results").innerHTML = q.results.map(r => `${r.name} (${r.province})`).join('<br>');
            } else {
                document.getElementById("results").innerHTML = 'No results were found.';
            }
        });
    }

    function getCityResults(q) {
        const config = {
            language: 'fr',
            includeTypes: ['CITY']
        };

        getResults(q, config);
    }
</script>

<p>This search will return all default result types in English (scroll down for results)</p>
<input id="searchField" type="text" onkeyup="getResults(this.value);">


<p>This search is configured to only return city results in French</p>
<input id="searchField1" type="text" onkeyup="getCityResults(this.value);">

<div id="results" rows="10">No results yet!</div>
````