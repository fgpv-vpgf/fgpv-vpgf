# Back to Cart

## What it does

This plugin retrieves the list of layer keys from RAMP and uses a URL template to redirect the browser to a different page along with the keys.

When a url is registered, a button is added to the side menu in RAMP.

## Scripts

The only extra script you need is `backToCart.js`. Load them in the order: `backToCart.js` -> `rv-main.js`. After both of those are loaded you can set the catalogue URL as detailed below.

## Setting the catalogue URL

There are two options for specifying the URL:

1. In the RAMP config under a top level section `"plugins"` place `"backToCart": { "catalogueUrl": <desired url> }`

2. Call `backToCart.setCatalogueUrl` with the map's id and the url.
   This should be called within a callback on the `mapAdded` observable:

```
RZ.mapAdded.subscribe(function(api) {
    backToCart.setCatalogueUrl('sample-map', 'www.example.com?keys={RV_LAYER_LIST}');
});
```

IMPORTANT: in both cases use the placeholder `{RV_LAYER_LIST}` where the layer keys should go.

## Migrating from RAMP v2.X

1. Remove the `RV.getMap(<map>).registerPlugin(...)` call

2. Choose one option from the `Setting the catalogue URL` section and follow that, use the same URL as before.
