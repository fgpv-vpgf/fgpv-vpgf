# Areas of Interest

## What it does

This plugin displays a collection of areas to visit on the map.

## Scripts

The only extra script you need is `areasOfInterest.js`. Load them in the order: `areasOfInterest.js` -> `rv-main.js`. After both of those are loaded you can set the catalogue URL as detailed below. As with `rv-main.js`, the plugin script should come after you polyfill your page.

## Migrating from RAMP v2.X

1. Add the extra script as detailed above

2. Remove the `RV.getMap(<map>).registerPlugin(...)` call

3. Put `areasOfInterest` in the `rv-plugins` attribute on the map element.

4. In your RAMP configuration file, move the areasOfInterest configuration under

```
plugins: {
    areasOfInterest: {
        <old plugin configuration>
    }
}
```

5. Change the titles of the areas to be under `title-en-CA` and `title-fr-CA` so:

```
{
    "title": hello,
    "xmin": ...
}
```

becomes:

```
{
    "title-en-CA": hello,
    "title-fr-CA": bonjour,
    "xmin": ...
}
```
