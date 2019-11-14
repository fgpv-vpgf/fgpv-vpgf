## Configuration Object

When you create a new instance of `GeoSearch` you can optionally pass it a config object. The following are valid config object properties:

```js
{
    excludeTypes: string | Array<string>,
    language: string,
    settings: Object,
    geoLocateUrl: string,
    geoNameUrl: string
}
```

### excludeTypes: string | Array<string>

A string or an array of strings of the types of results to exclude from being displayed.

### language: string

Either `en` or `fr`. `en` is default.

### settings: Object

Configuration settings available to the user. The following options are available:

        categories: An array of strings to filter the search results based on the type of the geographical names. Allowed values can be found [here](http://geogratis.gc.ca/services/geoname/en/codes/concise) (if using the Canadian GeoNames Search Service API).

        sortOrder: An array of strings specifying the sort order of the defined 'categories'. Any missing categories are appended to the bottom of the sorted list. The results can still be sorted through this option even if there are no categories being filtered.

        maxResults: A number representing the maximum results to return per request. The Canadian GeoNames Search Service API has a 1000 search limit which will be used as an upper limit of results returned unless another service is being used with a higher limit. The default is 100 results.

        officialOnly: A string identifying whether to return only official names for the geographic names. Default is false which will return both official names and formerly official names.

### geoLocateUrl, geoNameUrl : string

The urls to the geogratis search services.
