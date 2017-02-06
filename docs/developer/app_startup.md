This page describes the general startup procedure of the viewer, including a basic introduction to the startup files and their order of execution. 

To load the viewer on a webpage, two things must be present on the host page:
- A script tag which loads `bootstrap.js`
- One or more HTML elements having the class `fgpv`

### bootstrap.js

The goal of `bootstrap.js` is to make including the viewer on a host page simple. It takes care of several important steps including:
- Initializing the external API as `RV`
- Proxying the map API until it is loaded
- Injecting the `jQuery` and `datatables` libraries
- Injecting our compressed and minified `core.js` script and `main.css` stylesheet
- Browser detection (for IE polyfills, and touch support for some mobile browsers)
- Store all elements having class `fgpv` in an array `RV._nodes`

There are two other important startup files worth mentioning; `global-registry.js` and `app-seed.js`. These two files are merged inside the `core.js` file during the build process.

### global-registry.js

This file serves two purposes:
- Initialize geoapi and store it on `RV.gapi`
- Define {@tutorial base_plugins}

### app-seed.js

This file is the last to be run inside `core.js`, it bootstraps an angular instance for each viewer on the page. We saw `bootstrap.js` store these viewers on `RV._nodes`, so now we simply inject the `<rv-shell>` element in each node which starts up the application. 

Note that `<rv-shell>` is an angular element directive. To see what code is initially loaded inside the viewer have a look inside `scr/app/layout/shell.directive.js`.