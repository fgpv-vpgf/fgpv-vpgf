# RAMP2

This is an unsupported product. If you require a supported version please contact applicationsdecartographieweb-webmappingapplications@ec.gc.ca for a cost estimate. The software and code samples available on this website are provided "as is" without warranty of any kind, either express or implied. Use at your own risk. Access to this GitHub repository could become unavailable at any point in time. 

Demo site: http://ramp4-app.azureedge.net/legacy

This project is now a monorepo and contains the following repos under the `packages` folder:

- ramp-core (previously this repo)
- ramp-geoapi (previously https://github.com/fgpv-vpgf/geoApi)
- ramp-geosearch (previously https://github.com/RAMP-PCAR/geosearch)
- ramp-plugin-areas-of-interest (previously at https://github.com/fgpv-vpgf/plugins)
- ramp-plugin-back-to-cart (previously at https://github.com/fgpv-vpgf/plugins)
- ramp-plugin-custom-export (previously at https://github.com/fgpv-vpgf/plugins)
- ramp-plugin-coordinate-info (previously at https://github.com/fgpv-vpgf/plugins)
- ramp-plugin-enhanced-table (previously at https://github.com/fgpv-vpgf/plugins)

## Building the project

Install Python 2 if you don't already have it: [Python 2.7.18 Download](https://www.python.org/downloads/release/python-2718/) (Python 3 is not supported)

Install the required C++ build tools (2 options)

- **OPTION 1 (recommended):** Install Visual Studio and the required additional package
  - [Walkthrough for complete Visual Studio installation and additional packages post-install](https://docs.microsoft.com/en-us/cpp/build/vscpp-step-0-installation?view=msvc-160)
  - [Build Tools for Visual Studio 2019](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2019)
- **OPTION 2:** Directly add [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) package
  ```
  $ npm install --global windows-build-tools
  ```
  - **NOTE:** This may stop giving feedback in the console mid-install and seem to hang. However, it appears the required packages are still installed

Install Rush if you don't already have it:

```
$ npm install -g @microsoft/rush
```

Clone the repo and use Rush to install dependencies

```
$ rush update
```

You might want to run `rush update -p --full` to cleanly re-install all the dependencies (`-p` will purge what is currently there)

Build the project:

```
$ rush build
```

- **NOTE:** `rush build` will need to be run before the `rush serve` statement below any time code is changed in `ramp-geoapi` to avoid an outdated build

Serve the project:

```
$ rush serve -p 10 -v
```

- `-p 10` specifies the maximum number of concurrent processes to run (we need 8 right now to serve all the packages at the same time)
- `-v` provides verbose output for debugging

If you want to work on only a subset of packages instead you have to run their builds/serves seperately:

```
// terminal 0
$ cd packages/ramp-core
$ npm run serve

// terminal 1
$ cd packages/ramp-plugin-enhanced-table
$ npm run serve
```

Lastly open the samples page:

```
http://localhost:6001/samples/index-samples.html
etc.
```

For more rush commands or general reading: https://rushjs.io/pages/intro/welcome/

For more info on individual packages builds/documentation read the READMEs in the respective folder.

## Documentation

The Reusable Accessible Mapping Platform (RAMP), also known as the Federal Geospatial Platform Visualiser (FGPV), is a Javascript based web mapping platform that provides a reusable, responsive and WCAG 2.0 AA compliant common viewer platform for the Government of Canada.

For more information on this project, please see one of the sections below:

- [Usage](#usage)
- [Support](#support)

Also, please visit the [Documentation Site](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/home) for additional content on:

- [Map Author Guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/mapauthor/intro)
- [Contributing to the RAMP Project](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/contribute/getting_started)
- [Interactive Schema Documentation](https://fgpv-vpgf.github.io/schema-to-docs/)
- [Developer Guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/developer/intro)
- [Technical Documentation](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/technical/architecture)

### Usage

#### Quick guide

We'll go through the simplest way to use RAMP, for more information see the [map author guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/mapauthor/intro)

First, grab the most recent release from the [github releases](https://github.com/fgpv-vpgf/fgpv-vpgf/releases)
Place the files `rv-main.js` and `rv-styles.css` within your webpage's folder structure. We usually put our JavaScript files under a `js` folder and our stylesheets under a `css` folder.

Then you want to include those files on your page, along with jQuery and the needed polyfills (again, more info at the [map author guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/mapauthor/intro)):

1. Within `head`

```html
<link rel="stylesheet" href="../../../rv-styles.css" />
```

2. Near the end of the `body`

```html
<script
  src="https://code.jquery.com/jquery-2.2.4.min.js"
  integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="
  crossorigin="anonymous"
></script>
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Object.entries,Object.values,Array.prototype.find,Array.prototype.findIndex,Array.prototype.values,Array.prototype.includes,HTMLCanvasElement.prototype.toBlob,String.prototype.repeat,String.prototype.codePointAt,String.fromCodePoint,NodeList.prototype.@@iterator,Promise,Promise.prototype.finally"></script>
<script src="/js/rv-main.js"></script>
```

Now that you have the required files on your page we should add the map element.

```html
<div
  is="rv-map"
  style="height: 100%; display:flex;"
  rv-langs='["en-CA", "fr-CA"]'
></div>
```

A map should now load on your page. Theres much more you can do with RAMP, a good place to start (I'm mentioning it again!) is the [map author guide](#map-author-guide)

#### [Some samples](http://ramp4-app.azureedge.net/?prefix=legacy/branches/master/samples/)

### Support

#### How we provide support

- **Bugs:** If you have a bug to report you can open up an issue at https://github.com/fgpv-vpgf/fgpv-vpgf/issues by clicking the green button above the issue list
- **Questions:** You can ask questions through github team discussions at https://github.com/orgs/fgpv-vpgf/teams

For more information on contributing read the [Contributing Guide](http://fgpv-vpgf.github.io/fgpv-vpgf/master/#/contribute/getting_started). Note there may be some references to the pre-monorepo setup, pull requests are now only needed in one place (this repo).
