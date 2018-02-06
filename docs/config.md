## Configuration Object

When you create a new instance of `GeoSearch` or `GeoSearchUI` you can optionally pass it a config object. The following are valid config object properties:

```js
{
    types: Object,
    language: string,
    geogratisUrl: string
}
```

### types: Object

An object with one or more properties, where each property represents a search type. For example:

```json
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
