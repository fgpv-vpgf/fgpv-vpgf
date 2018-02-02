---
sidebar: false
---

# Demo

````html
<script src="js/geosearch.js"></script>

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

<p>This search will return all default result types in English</p>
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