# Back to Cart

## What it does

This plugin retrieves the list of layer keys from RAMP and uses a URL template to redirect the browser to a different page along with the keys.

When a url is registered, a button is added to the side menu in RAMP.

## Scripts

The only extra script you need is `backToCart.js`. Load them in the order: `backToCart.js` -> `rv-main.js`. After both of those are loaded you can set the catalogue URL as detailed below.

## Setting the catalogue URL

To set the catalogue URL, call `backToCart.setCatalogueUrl` with the map's id and the url. Use the placeholder `{RV_LAYER_LIST}` where the layer keys should go.

This should be called within a callback on the `mapAdded` observable:

```
RZ.mapAdded.subscribe(function(api) {
    backToCart.setCatalogueUrl('sample-map', 'www.example.com?keys={RV_LAYER_LIST}');
});
```

## Migrating from RAMP v2.X

Replace the `RV.getMap(<map>).registerPlugin(...)` call with the code featured in `Setting the catalogue URL`.

The catalogue URL is the same format as in v2, and the map id will also be the same.

Example:

```
RV.getMap('myMap').registerPlugin(RV.Plugins.BackToCart, 'backToCart', 'www.google.ca?keys={RV_LAYER_LIST}');
```

becomes

```
RZ.mapAdded.subscribe(function(api) {
    backToCart.setCatalogueUrl('myMap', 'www.google.ca?keys={RV_LAYER_LIST}');
});
```
