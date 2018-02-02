# Geosearch

Provides name, postal code, and NTS location based searching within Canada, using [GeoGratis](http://geogratis.gc.ca/) as the backend provider.

It can be configured to return only certain types of results like provinces or cities, and can be used in English or French.

<p class="tip">
    Take a look at a working [demo](/demo)
</p>

## Usage

There are two ways to use this library; either by including the pre-built javascript file directly in your browser, or via import with a package manager.

### Import
To import `GeoSearch` from this library simply place the following where you normally import libraries:

```js
import GeoSearch from 'node_modules/geosearch';
```

<p class="warning">
    Don't forget to install this library first via npm or yarn!
</p>

### Include directly in HTML page
Include the `geosearch.js` file from the `dist` directory directly in your HTML page. This will create a global window object `GeoSearch` that you can access.

## Configuration

When you create a new instance of `GeoSearch` you can optionally pass it a config object. The following are valid config object properties:

### types: Object

An object with one or more properties, where each property represents a search type. For example:

```js
{
    "CITY": {
        "en": {
            "term": "City",
            "description": "Populated place with legally defined boundaries, usually incorporated under a provincial or territorial Municipal Act and being the highest level of municipal incorporation."
        },
        "fr": {
            "term": "Ville",
            "description": "Lieu habité dont les limites sont définies par la loi, habituellement constitué en vertu de la Loi sur les municipalités de la province ou du territoire et constituant le niveau le plus élevé de constitution municipale."
        }
    }
}
```

The library will use `CITY.en.term` (or `CITY.fr.term` if the language is set to `fr`) to determine what results to include in the final output.


<p class="tip">
    You can see the default search types used in `data/types.json`.
</p>
    
### language: string

Either `en` or `fr`. `en` is default.
    
    
### geogratisUrl : string

The url to the geogratis search service.

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

