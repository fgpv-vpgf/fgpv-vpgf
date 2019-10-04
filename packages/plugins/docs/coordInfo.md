# Coord Info

## What it does

This plugin retrieves information for map locations the user clicks including lat/long, UTM coordinates, elevation and magnetic declination.

A button is added to the side navigation menu of RAMP, allowing users to toggle the behaviour.

## Scripts

The only extra script you need is `coordInfo.js`. Load them in the order: `coordInfo.js` -> `rv-main.js`. After both of those are loaded you can set the catalogue URL as detailed below. As with `rv-main.js`, the plugin script should come after you polyfill your page.

## Migrating from RAMP v2.X

1. Add the extra script as detailed above

2. Replace the `RV.getMap(<map>).registerPlugin(...)` call by putting `coordInfo` in the `rv-plugins` attribute on the map element.
