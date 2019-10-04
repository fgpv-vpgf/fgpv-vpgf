## Configuration Object

When you create a new instance of `GeoSearch` you can optionally pass it a config object. The following are valid config object properties:

```js
{
    includeTypes: string | Array<string>,
    excludeTypes: string | Array<string>,
    language: string,
    maxResults: number,
    geoLocateUrl: string,
    geoNameUrl: string
}
```

### includeTypes: string | Array<string>

A string or an array of strings for the types of results to display. Any types not included are excluded.

### excludeTypes: string | Array<string>

A string or an array of strings of the types of results to exclude from being displayed. 

<p class="tip">
    You can only set one of `includeTypes` or `excludeTypes`. If both are set, only `includeTypes` will be computed.
</p>
    
### language: string

Either `en` or `fr`. `en` is default.

### maxResults?: number

Only show the first `maxResults` number of results.
    
    
### geoLocateUrl, geoNameUrl : string

The urls to the geogratis search services.
