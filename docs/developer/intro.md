---
nav: dev
---

# A guide for developers

This guide is intended for developers who are looking to modify RAMP for their own projects and purposes. Outlines the API and plugin system. Assumes reader is comfortable with HTML, CSS, and JavaScript.

## About the API

Intro to API here. Describe 
- what it is used for
- use cases, 
- link to sample page api.md 
- where to find more detailed API docs

## Plugins

A plugin is like a "container" for your custom JavaScript and RAMP API calls that when executed either modify, replace, or add a feature to RAMP. When a plugin is loaded by RAMP, the plugin is given a copy of the RAMP API, the plugin config (if defined in the main RAMP config), as well as the complete RAMP config. It also takes care of the timing between when a plugin script has loaded on a page to when the RAMP API is actually ready to be called. 

A plugin is simply a JavaScript object assigned to a variable on the browsers `window`. 

```js
// myPlugin.js
window.myPlugin = {
    init: function(api) {
        // do stuff with the RAMP API
    }
};
```

Typically a plugin resides in a JavaScript file. In our example above the code is in a file named `myPlugin.js`. The file name isn't important, just make sure to include the script on the host page in the **head** section of the html:

```html
...
<head>
  <script src="myPlugin.js" />
</head>
...
```

You could also place the plugin code directly in a script tag on the host page. 

You then tell RAMP about your plugin on a property of the map element named `rv-plugins`.

```html
<div is="rv-map" rv-plugins="myPlugin"></div>
```

This tells RAMP to look for an object `window.myPlugin`. `rv-plugins` can be a comma separated list of multiple plugins.

Let's take another look at the above plugin example, this time with an additional method:

```js
// myPlugin.js
window.myPlugin = {
    preInit: function(pluginConfig, rampConfig) {
        // this is called by RAMP when it has started to load but is not yet ready
    },

    init: function(rampAPI) {
        // this is called by RAMP when it has finished loading and the RAMP api is ready
    }
};
```

Our plugin receives its config (if defined in the ramp config) and the complete RAMP config in the `preInit` method. The plugin then receives the RAMP API in a subsequent call to its `init` method. Once RAMP has called our plugins `init` method and provided the RAMP API the rest is up to you!

Plugins provide a simply way to customize your RAMP experience. Unlike submitting code to the core RAMP project, you are in control of your plugins code and do not need any knowledge of the inner working of RAMP. Along with jQuery and an Angular compiler available through the RAMP API there are endless possibilities for creating unique user experiences.