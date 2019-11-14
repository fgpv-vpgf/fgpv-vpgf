Provides name, postal code, and NTS location based searching within Canada, using GeoGratis as the backend provider.

It can be configured to return only certain types of results like provinces or cities, filter catagories, sort results, and can be used in English or French.

## See our [documentation](https://ramp-pcar.github.io/geosearch/#/) for all the details

### Installation

#### Package manager
Using the npm package manager:

```bash
npm i --save rz-geosearch
```

Then import it:

```js
import 'rz-geosearch';
```

You'll then have access to the `GeoSearch` class namespace.

#### Precompiled

This repo contains a precompiled file located at `src/geosearch.js` which can be included in a `script` tag on your page. A global window object named `GeoSearch` will be created.
