Provides name, postal code, and NTS location based searching within Canada, using GeoGratis as the backend provider.

It can be configured to return only certain types of results like provinces or cities, and can be used in English or French.

## See our [documentation](https://ramp-pcar.github.io/geosearch/#/) for all the details

### Installation

#### Package manager
Using a package manager such as npm or yarn:

```bash
npm i --save github:RAMP-PCAR/geosearch

or

yarn add github:RAMP-PCAR/geosearch
```

Then import or require `GeoSearch` from `src/index.ts`.

#### Precompiled

This repo contains a `dist` folder where you'll find various precomiled library versions ready to be included in a `script` tag on your page. Chose one of:
- `geosearch-polyd.js`
- `geosearch.js`

A global window object will be created to access the library. The file size of `geosearch-polyd.js` is much larger in size since it contains polyfills for IE support. Use the non-polyfilled script if your webpage already has polyfills or you don't care to support IE. You should only include one of the scripts in the `dist` folder, you don't need to include all of them.