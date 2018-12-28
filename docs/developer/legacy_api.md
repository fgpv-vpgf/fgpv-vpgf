---
nav: dev
---

While the new API is accessible through `window.RZ`, the legacy API continues to be supported until the next major release (version 4+). Access to the legacy API continues through `window.RV`.

## What's changed

The legacy API is no longer loaded automatically - to continue using it you'll need to **include a script named `legacy-api.js`** which is included with all version 3+ ramp builds.

```html
<script src="../legacy-api.js"></script>
<script src="../rv-main.js"></script>

<script>
RV.getMap('sample-map').getBookmark().then(function(bookmark) {
    console.log('The bookmark: ' + bookmark);
});
</script>
```

You should include the `legacy-api.js` file before `rv-main.js` (the main ramp viewer file) and before trying to access the `RV` global variable for the first time. 

## Removed Methods

`registerPlugin` and `openDialogInfo` have been removed and are no longer available.

See [registering a plugin](/developer/plugins?id=register) for help migrating to the new plugin system. Note that you can continue to access the legacy API (`RV`) even when it's loaded through the new plugin system.

See [opening and closing panels](/developer/panels?id=open-close) for help with controlling panels. 

## Available Methods

```ts
setLanguage: (language: string) => Promise<void>;
```

```ts
panelVisibility: (panelName: string, isVisible: boolean = true) => Promise<void>;
```

```ts
getCurrentLang: () => Promise<string>;
```

```ts
loadRcsLayers: (string[]) => Promise<void>;
```

```ts
getBookmark: () => Promise<string>;
```

```ts
centerAndZoom: (x: number, y: number, spatialReference: Object, zoom: number) => Promise<void>;
```

```ts
setExtent: (extent[]) => Promise<void>;
```

```ts
useBookmark: (bookmark: string) => Promise<void>;
```

```ts
getRcsLayerIDs: () => Promise<string[]>;
```

```ts
appInfo: () => Promise<Object>;
```

```ts
northArrow: () => Promise<Object>;
```

```ts
mapCoordinates: (point: Object, outMouseWKID: Object) => Promise<Object[]>;
```

```ts
getMapClickInfo: (clickHandler: Function) => Promise<Event>;
```

```ts
convertDDToDMS: (lat: number, long: number) => Promise<Object>;
```

```ts
setMapCursor: (cursor: string) => Promise<void>;
```

```ts
projectGeometry: (geometry: Object, outSR: number) => Promise<Object>;
```

```ts
toggleSideNav: (open: boolean) => Promise<void>;
```

```ts
reInitialize: (bookmark: string) => Promise<void>;
```

```ts
getConfig: (section: string) => Promise<Object>;
```