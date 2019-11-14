# Geosearch

Provides name, postal code, and NTS location based searching within Canada, using [GeoGratis](http://geogratis.gc.ca/) as the backend provider.

It can be configured to return only certain types of results like provinces or cities, filter catagories, sort results, and can be used in English or French.

<p class="tip">
    See the [configuration](/config) page for additional information.
</p>

## Feature vs. regular results

A feature result can be either be an NTS or FSA object type. They each have unique properties about them, and you need to be able to handle each possible feature result if you are implementing custom UI. Regular results always have the same definition.

Also, NTS and FSA queries are handled differently than name based queries.
- NTS results have a defined bounding box, so the results provided are all contained within this box
- A province(s) is derived from an FSA query, so the results provided are all contained within this province(s)

<p class="warning">
    Strict type checking is required for feature results. Feature results can also be an array or an object with different properties in the future. This will not be considered a breaking change unless an existing feature object (like NTS or FSA) properties are changed or removed.
</p>

See [the UI demo page](/demo1) for the possible feature object types and the regular result type.

## Custom vs UI

GeoSearch has functionality to make integrating search easy [in a webpage (demo)](/demo1). GeoSearch can also be implemented [programmatically](/demo2) for more advanced usage and control.

There is a precompiled javascript version located at `src/geosearch.js`, as well as being able to import this library with the npm package manager.
