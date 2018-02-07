# Geosearch

Provides name, postal code, and NTS location based searching within Canada, using [GeoGratis](http://geogratis.gc.ca/) as the backend provider.

It can be configured to return only certain types of results like provinces or cities, and can be used in English or French.

<p class="tip">
    See the [configuration](/config) page for additional information. 
</p>

## Variants

[GeoSearch](/demo2) is the base implementation of the search queries and filtering. It can be used on its own or you can chose [GeoSearchUI](/demo1) which extends `GeoSearch` to simplify deployment on a webpage. Both of these types have precompiled javascript versions that can be found in the `dist` folder, as well as being able to import/require them with a package manager.



