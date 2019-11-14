## GeoSearch

The constructor only takes one parameter, [config](/config) (optional).

### Installation

#### Package manager
Using the npm package manager:

```bash
npm i --save rz-geosearch
```

Then import it:

```js
import 'rz-geosearch';
```

You'll then have access to the `GeoSearch` class namespace.

#### Precompiled

This repo contains a precompiled file located at `src/geosearch.js` which can be included in a `script` tag on your page. A global window object named `GeoSearch` will be created.

### Example

#### IE 11 users [click here](./ie.html)

````html
<script src="geosearch.js"></script>

<script>
    function getResults(query, config = { settings: { categories: ['PROV', 'CITY', 'TOWN', 'TERR', 'LAKE'] } }) {
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
            settings: {
                categories: ['CITY']
            }
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
