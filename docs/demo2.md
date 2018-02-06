---
sidebar: false
---

## GeoSearch

Implements the core functionality of queries and filtering. It can be used as a standalone class, or can be extended as `GeoSearchUI` has done. It has no concept of HTML or webpages, so using this in a webpage is more verbose than `GeoSearchUI`.

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

#### IE 11 users [click here](./ie.html)**

````html
<script src="dist/geosearch.js"></script>

<script>    
    function getResults(q, config = null) {
        // GeoSearch is a global window object since we included the library directly on our page.
        var geoSearch = new GeoSearch(config);
        geoSearch.query(q).then(function(results) {
            if (results.length > 0) {
                // json2html is used to display some of the returned data from our library for simplification. 
                document.getElementById("results").innerHTML = json2html.transform(results, transforms.result);
            } else {
                document.getElementById("results").innerHTML = 'No results were found.';
            }
        });
    }

    function getCityResults(q) {
        const config = {
            language: 'fr',
            types: {
                "CITY": {
                    "fr": {
                        "term": "Ville",
                        "description": "La principale division administrative du Canada. Il s'agit d'un territoire juridiquement défini, établi par des articles de la Confédération ou par des amendements constitutionnels."
                    }
                }
            }
        };

        getResults(q, config);
    }
</script>

<p>This search will return all default result types in English (scroll down for results)</p>
<form onsubmit="getResults(document.getElementById('searchField').value); return false;">
    <input id="searchField" type="text"> <button type="submit">Search</button>
</form>

<p>This search is configured to only return city results in French</p>
<form onsubmit="getCityResults(document.getElementById('searchField1').value); return false;">
    <input id="searchField1" type="text"> <button type="submit">Search</button>
</form>

<p class="tip">
    <ul id="results">No results yet!</ul>
</p>
````