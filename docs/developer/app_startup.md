This page describes the general startup procedure of the viewer, including a basic introduction to the startup files and their order of execution.

To load the viewer on a webpage, a few things are required on the host page:
- A script tag which loads `rv-main.js`. This should be placed in the `body` section of the host page near the end. It should also be placed before any of the host page scripts that interact with the external API.
- A css tag that loads `rv-styles.css`, somewhere near the end of the `head`.
- One or more HTML elements having the property `is="rv-map"`.

### bootstrap.js

The first file to be executed, its main purposed is to create the API proxy methods. It also performs browser detection and injects fonts into the host page.

### global-registry.js

This file serves two purposes:
- Initialize geoapi
- Define {@tutorial base_plugins}

### app-seed.js

It bootstraps an angular instance for each viewer on the page.

Note that `<rv-shell>` is an angular element directive. To see what code is initially loaded inside the viewer have a look inside `scr/app/layout/shell.directive.js`.
