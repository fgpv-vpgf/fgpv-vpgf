# Legacy API (deprecated)

**The legacy API is deprecated. It will be removed in the next major release.**

While the new API is accessible through `window.RAMP`, the legacy API continues to be supported until it is fully replaced. Access to the legacy API continues through `window.RV`.

## How to use the legacy API on a page

The legacy API is no longer loaded automatically - to continue using it you'll need to **include a script named legacy-api.js** which is included with all version 3+ ramp builds.

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

## How to use the legacy API in a plugin

After a plugin's init method is called, the plugin gets a reference to the legacy API on `_RV`. This reference calls non-proxied versions of the methods, so they return their actual value and aren't a promise.

```
init(api) {
	this.api = api; // this is the new 'RAMP' api
	var lang = this._RV.getCurrentLang();
}
```



## Removed Methods with Alternatives

`registerPlugin` and `openDialogInfo` have been removed and are no longer available.

See [registering a plugin](http://fgpv-vpgf.github.io/fgpv-vpgf/ghpages-docs/#/developer/plugins?id=register) for help migrating to the new plugin system. Note that you can continue to access the legacy API (`RV`) even when it's loaded through the new plugin system.

See [opening and closing panels](http://fgpv-vpgf.github.io/fgpv-vpgf/ghpages-docs/#/developer/panels?id=open-close) for help with controlling panels.

## Available Methods and Alternatives

```ts
setLanguage: (language: string) => Promise<void>;
```
On the new API:
```ts
loadNewLang: (lang: string) => void;
```
-------------------
```ts
panelVisibility: (panelName: string, isVisible: boolean = true) => Promise<void>;
```
-------------------
```ts
getCurrentLang: () => Promise<string>;
```
-------------------
```ts
loadRcsLayers: (string[]) => Promise<void>;
```
-------------------
```ts
getBookmark: () => Promise<string>;
```
-------------------
```ts
centerAndZoom: (x: number, y: number, spatialReference: Object, zoom: number) => Promise<void>;
```
On the new API:
```ts
mapI.centerAndZoom: (x: number, y: number, spatialReference: Object, zoom: number) => void;
```
-------------------
```ts
setExtent: (extent[]) => Promise<void>;
```
On the new API:
```ts
mapI.setExtent: (extent[]) => void;
```
-------------------
```ts
useBookmark: (bookmark: string) => Promise<void>;
```
-------------------
```ts
getRcsLayerIDs: () => Promise<string[]>;
```
-------------------
```ts
appInfo: () => Promise<Object>;
```
-------------------
```ts
northArrow: () => Promise<Object>;
```
-------------------
```ts
mapCoordinates: (point: Object, outMouseWKID: Object) => Promise<Object[]>;
```
-------------------
```ts
getMapClickInfo: (clickHandler: Function) => Promise<Event>;
```
On the new API this info is accessed through:
```ts
click: Observable<MapClickEvent>;
```
This migration is a little tricky, instead of passing the handler to the function you `subscribe` to the click observable.
```ts
window.RAMP.mapInstances[0].click.subscribe((clickEvent) => { console.log(clickEvent)});
```

-------------------
```ts
convertDDToDMS: (lat: number, long: number) => Promise<Object>;
```
-------------------
```ts
setMapCursor: (cursor: string) => Promise<void>;
```
-------------------
```ts
projectGeometry: (geometry: Object, outSR: number) => Promise<Object>;
```
-------------------
```ts
toggleSideNav: (open: boolean) => Promise<void>;
```
-------------------
```ts
reInitialize: (bookmark: string) => Promise<void>;
```
-------------------
```ts
getConfig: (section: string) => Promise<Object>;
```