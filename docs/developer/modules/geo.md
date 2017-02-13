The Geo module contains all map specific functionality, either implemented in this module, or exposed through GeoAPI.

**-- Once refactoring is complete this section will be updated --**
 
## gapi.service.js

Exposes the `geoApi` interface on `geoService.gapi` once it has been loaded (external library)

## geo.service.js

This is the only external interface to the rest of the modules (i.e. if UI needs to do something it should call geo service instead of any specific services). Wraps all calls to GeoAPI and also tracks the state of anything map related (ex: layers, filters, extent history).

## geo-search.service.js

This service implements the geosearch functionality. This includes searching by:
- Lat/Lng coordinates
- Place or Name
- FSA or NTS 
- Zoom to a specific scale

It consumes five external geogratis services; provinces, concise, suggest, locate, and geonames.

## identify.service.js

When clicking on the map an identify panel is opened which shows all features in the click radius. This service generates handlers for feature identification on all layer types.

## init-map.directive.js

This directive creates an ESRI Map object on the DOM node it is attached to. It is a string attribute which will trigger the initialization when set to 'true'. 

This directive also contains keyboard navigation logic. This includes panning the map when the arrow keys are pressed, or zooming in/out when the +/- keys are pressed.

## locate.service.js

Tries to determine a users location through the browser. If this fails and there exists a top level property in the config named 'googleAPIKey', then a request to Google's geolocation API is made.

## map.service.js

TODO: Complete

## metadata.service.js

Parses metadata in the format exposed by the data catalogue.

## overview-toggle.directive.js

Replaces the default ESRI map overview toggle button so that it is accessible (focusable) and improves its aesthetics.