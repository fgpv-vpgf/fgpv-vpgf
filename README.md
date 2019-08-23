[![Join the chat at https://gitter.im/fgpv-vpgf/fgpv-vpgf](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/fgpv-vpgf/fgpv-vpgf?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Issue Count](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf/badges/issue_count.svg)](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf)

[![Dependency Status](https://david-dm.org/fgpv-vpgf/fgpv-vpgf.svg?style=flat-square)](https://david-dm.org/fgpv-vpgf/fgpv-vpgf)
[![devDependency Status](https://david-dm.org/fgpv-vpgf/fgpv-vpgf/dev-status.svg?style=flat-square)](https://david-dm.org/fgpv-vpgf/fgpv-vpgf#info=devDependencies)

# RAMP2

The Reusable Accessible Mapping Platform (RAMP), also known as the Federal Geospatial Platform Visualiser (FGPV), is a Javascript based web mapping platform that provides a reusable, WCAG 2.0 AA compliant common viewer platform for the Government of Canada.

For more information on this project, please see one of the sections below:

* [Usage](#usage)
* [Building the Project](#building-the-project)
* [Support](#support)

Also, please visit the [Documentation Site](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/home) for additional content on:

* [Map Author Guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/mapauthor/intro)
* [Contributing to the RAMP Project](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/contribute/getting_started)
* [Interactive Schema Documentation](https://fgpv-vpgf.github.io/schema-to-docs/)
* [Developer Guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/developer/intro)
* [Technical Documentation](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/technical/architecture)

## Usage

### Quick guide

We'll go through the simplest way to use RAMP, for more information see the [map author guide](#map-author-guide)

First, grab the most recent release from the [github releases](https://github.com/fgpv-vpgf/fgpv-vpgf/releases)
Place the files `rv-main.js` and `rv-styles.css` within your webpage's folder structure. We usually put our JavaScript files under a `js` folder and our stylesheets under a `css` folder.

Then you want to include those files on your page, along with jQuery and the needed polyfills (again, more info at the [map author guide](#map-author-guide)):
1. Within `head`
```html
<link rel="stylesheet" href="../../../rv-styles.css" />
```
2. Near the end of the `body`
```html
<script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Object.entries,Object.values,Array.prototype.find,Array.prototype.findIndex,Array.prototype.values,Array.prototype.includes,HTMLCanvasElement.prototype.toBlob,String.prototype.repeat,String.prototype.codePointAt,String.fromCodePoint,NodeList.prototype.@@iterator,Promise,Promise.prototype.finally"></script>
<script src="/js/rv-main.js"></script>
```

Now that you have the required files on your page we should add the map element.

```html
<div is="rv-map" style="height: 100%; display:flex;" rv-langs='["en-CA", "fr-CA"]'></div>
```

A map should now load on your page. Theres much more you can do with RAMP, a good place to start (I'm mentioning it again!) is the [map author guide](#map-author-guide)

### [Some samples](http://fgpv.cloudapp.net/demo/master/dev/samples/index-samples.html)

## Building the project

Requirements:

- [NodeJS](https://nodejs.org/)

Running a local build:

1. Checkout the repo
2. Switch to the develop branch (master is for stable, released code)
3. Run `npm install` to install dependencies
4. Run `npm run serve` to build and launch a dev server

We use a fork and pull model for contributions, see our [contributing guidelines](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/contribute/getting_started) for more details.

### Generating Local Builds

- `npm run build`

    Builds development code and places it in the `build` directory. Performs eslint, SASS -> CSS, and babel compilation

- `npm run build -- --env.prod`

    Builds production code and places it in the `build` directory. Performs same steps as development builds, but also places a zipped file of the build in the `dist` directory.


### Serving Development Code

- `npm run serve`

    Serves the development code. Reloads on file change.

- `npm run serve -- --env.prod`

    Serves the production code. Reloads on file change.

### Inspecting Bundle Dependencies

Run `npm run build -- --env.inspect`

When complete, navigate to http://127.0.0.1:8888 in chrome.

You can also use two external tools with the `build/stats.json` file
    - http://webpack.github.io/analyse
    - https://chrisbateman.github.io/webpack-visualizer/

### Optional Flags

To run these flags, prefix with `--` then `--env.` as in `npm run serve -- --env.prod` where `prod` is a flag.

- `geoLocal`
    Replaces geoApi from npm node_module with a local geoApi repo folder located by ../geoApi

- `geoLocal="path/to/geoApi"`
    Same as no argument `geoLocal` but uses the provided path to local folder

- `useMap`
    Creates full independent source maps files for `development` code only. Build time will increase.

### Troubleshooting

If the build process is failing, the following things can sometimes resolve the issue

- If you are running a version of Node.js greater than 10, try downgrading to version 10 (e.g. `v10.14.1` has proved to be a go-to version in this scenario)
- Attempt deleting the `node_modules` folder and/or the `package-lock.json` file

## Support

### How we provide support
- **Bugs:** If you have a bug to report you can open up an issue at https://github.com/fgpv-vpgf/fgpv-vpgf/issues by clicking the green button above the issue list
- **Questions:** You can ask questions through github team discussions at https://github.com/orgs/fgpv-vpgf/teams

### Repos
RAMP (FGPV): https://github.com/fgpv-vpgf/fgpv-vpgf

GeoAPI: https://github.com/fgpv-vpgf/geoApi

Plugins: https://github.com/fgpv-vpgf/plugins

GeoSearch: https://github.com/ramp-pcar/geosearch

If you need help contributing, make sure to give the [contribution docs](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/contribute/getting_started) a read. If you still have questions let us know.