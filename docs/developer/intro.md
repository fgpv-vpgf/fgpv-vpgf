---
nav: dev
---

# A guide for developers

This guide is intended for web developers who are interested in using the RAMP API to modify or develop new functionality for the RAMP viewer and for map authors who want to customize RAMP or the host page for their own needs.

This guide will first outline any required or optional knowledge you should have before getting started. After that we'll cover some **basic RAMP concepts** you should know, introduce the **RAMP API** and the concept of **Plugins**. We'll finish this introduction with a look at the various UI components and their names. We recommend you read this entire page so that you'll have a basic understanding of the major parts of RAMP and how to continue reading these docs on more advanced topics that pertain to your interests and project requirements.

## Knowledge needed

This guide assumes you have a moderate to advanced level of **JavaScript** experience and have worked with **HTML** and **CSS**.

You'll also benefit with basic knowledge of **jQuery** and **RxJS**.

> It's ok if you've never heard of RxJS - it's a type of event system the RAMP API uses. The only RxJS concept you need to know is **subscribing to observables** (see link below).

Finally, the RAMP API, plugins, and the technical documentation are all written in **TypeScript** - a superset of typed JavaScript that compiles to plain JavaScript. While you don't have to use TypeScript yourself, it helps to be able to read TypeScript code when looking at examples and referencing our plugin repo code.

Resources:

- jQuery: https://api.jquery.com/
- TypeScript in 5 minutes: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- RxJS Subscription: http://reactivex.io/rxjs/manual/overview.html#subscription

## Basic RAMP concepts

### Host page

A host page is an HTML webpage which displays one or more RAMP viewers. At a minimum it must:
- include the jQuery v3+ library (https://jquery.com/download/)
- include the **rv-main.js** and **rv-styles.css** RAMP files (available for download on our releases: https://github.com/fgpv-vpgf/fgpv-vpgf/releases)
- contains all necessary browser polyfills for whichever browsers you wish to support
- contain one or more ramp map elements with a property `is="rv-map"` which RAMP uses as an element locator to initialize a viewer instance


### Config file and schema

The host pages RAMP element(s) can define an `rv-config` property which contains a source url to the maps config file. This source url can contain `[lang]` which RAMP replaces with the currently active language identifier, usually **en-CA** or **fr-CA**. So `rv-config="config.[lang].json"` would cause RAMP to fetch a **config.en-CA.json** file for an english version of the map and **config.fr-CA.json** for french in the same directory as the host page.

A schema file is available in our GitHub repo (https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/schema.json). Be sure to select the correct branch/tag in GitHub for the version of RAMP you'll be using. You can use this file as a general reference for all available options or to be fed into an automated schema validator tool.


## API

The RAMP API can be used to retrieve data from and interact with RAMP. It can be used on the host page for simple interations such as toggling a layer's visibility.
It can also be used within a plugin to group together more complicated interactions if what you are implementing is similar to a feature.

The API can be accessed using `window.RZ`.

There are four main sections to the API:

1. Basic Map Operations<br/>
Set extent, bounds, fullscreen, etc.

2. Legend<br/>
Watch and control the RAMP instance's legend.

3. Layers & Geometry<br/>
Watch, and control layers and geometry within RAMP.

4. Panels<br/>
Watch, control, and create panels within RAMP.

As an example let's hide all the layers on the map using the legend API.
```js
// Get the map instance; We're assuming we want to effect the first map on the page
const mapInstance = RZ.mapInstance[0];
mapInstance.ui.configLegend.hideAll();
```

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


## Terminology and UI component diagram

TODO: [Need to have a UI component breakdown with terminology #972](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/972)

## Legacy API

**The legacy API is deprecated. It will be removed in the next major release.**

The legacy API is now included via a js file, `legacy-api.js` included in new RAMP builds. The API is still accessible through `window.RV`.

Plugins can use the legacy API through the reference `this._RZ`. This is available on the plugin instance after `init` is called.

To see what is available for use and what has alternatives on the new API please see the [legacy API documentation](/developer/legacy_api)