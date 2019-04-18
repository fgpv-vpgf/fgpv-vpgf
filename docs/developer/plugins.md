# Plugins

Plugins add or modify functionality in RAMP in a variety of ways. The RAMP API is the primary method of interacting with the viewer, but is not the only way. Plugins are free to manipulate the DOM with jQuery, make use of the built-in support for Angular and Angular Materials or import their own libraries for use. Since plugins have few restrictions and a flexible architecture, almost anything is possible.

## High Level Overview

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

## The basics

Let's begin with an example of the RAMP viewer and three imaginary plugins:

1. an enhanced data table which replaces the default RAMP simple data table.
2. a static north compass icon.
3. a box with text, showing the latitude and longitude of the users mouse.

<p align="center">
  ![](assets/images/plugins/plugin-example.png)Figure 1.
</p>

All three plugins share a similar code structure, make use of the RAMP API, and perform custom DOM operations. Next we'll explore how plugin code is structured with a coding example.

## Structure

Plugins can be as simple as a few lines of code to hundreds or thousands. We'll write a basic plugin that displays an alert box with lat/lon coordinates whenever the user clicks on the map.

#### MyPlugin.js
```js
var api;
window.MyPlugin = {
    init(rampApi) {
        api = rampApi;
        listenToAlert();
    },

    listenToAlert() {
        api.click.subscribe(function(pointObject) {
            alert('You clicked on point ' + pointObject.x + ' ' + pointObject.y);
        });
    }
}
```

Inside our `MyPlugin.js` file a JavaScript object is defined on the browsers window object named **MyPlugin**. We'll make use of this later when it's time to register our plugin with RAMP.

Inside our plugin object we define two methods, `init` and `listenToAlert`.

 - `init` gets called by RAMP with a copy of the RAMP API once it has successfully loaded. So when this method gets called we store the RAMP API in a variable named `api` for later use.
 - `listenToAlert` contains the logic for listening to a map click and displaying an alert box. That's all there is to it!

<p class="tip">
    If you use anything other than plain JavaScript (like TypeScript) be sure to compile it into JavaScript before including it on the host page. It's also a good idea to test your plugin in different browsers such as IE11, FireFox, and Chrome.
</p>

 ## Register

Let's bring our example plugin to life in the RAMP viewer in two steps:

1. include `MyPlugin.js` in the same webpage as the RAMP viewer.
2. tell RAMP how to find the plugin by providing the pointer to our plugin object to the RAMP HTML element `rv-plugins`.


```html
<html>
    <head>
        <script src="MyPlugin.js"></script>
    </head>

    <body>
        <div class="myMap" id="my-map" is="rv-map"
            rv-config="myConfig.json"
            rv-langs='["en-CA", "fr-CA"]'
            rv-plugins="MyPlugin">
        </div>
    </body>
</html>
```

<p align="center">
  ![](assets/images/plugins/basic-plugin.png)
</p>

Our plugin will now load and work when the viewer is opened in a browser!

## Advanced Topics

### Legacy API

You have access to the legacy API from within a plugin as soon as the `init` method is called. You can access the legacy api in a plugin with `this._RV`. Be sure to read the [legacy api docs](/developer/legacy_api) for more information, limitations, and best practices.

### Configuration

If your plugin is configurable by a user they can do so by defining a section under the **plugins** property of the ramp configuration file with the name of your plugin as the key and an object as the value. For example, in the ramp config:

```json
{
...
  "plugins": {
    "yourPlugin": {
      "aConfigProperty": true,
      "bConfigProperty": "sure"
    }
  }
...
}
```

The plugin config object is then passed to your plugins preInit method.

###  preInit(pluginConfig, rampConfig) : Promise(any) | void;

`preInit` is an optional method for the plugin object which is called before the `init` method and before the RAMP API is ready. This method accepts your plugin config object that the user defined in their config (or null if not defined), and the entire RAMP configuration as a read-only object.

There may be cases where you'd like to perform some asynchronous operations before the viewer loads. If you return a promise from this method RAMP will pause loading until it resolves into a value that evaluates to `true`.

Let's see this in action with an example:

```js
var config;
window.MyPlugin = {
    preInit(pluginConfig, rampConfig) {
        return new Promise(function(resolve) {
            if (pluginConfig.asyncWork) {
                // do some async operations and resolve . . .
            } else {
                resolve(true); // resolve immediatly
            }
        });
    },
    . . .
}
```

### Plugins replacing RAMP features

Plugins usually add features to the RAMP viewer. They can however also **replace** select features entirely. In Figure 1 above, the first plugin (denoted with a red border) is such a plugin. A plugin can only replace one ramp feature, and it must declare which feature it is replacing by defining a property on itself named `feature`. Plugins which replace a feature may have zero or more:

1. additional API methods and/or properies available through the ramp api
2. optional or required special properties and methods which are invoked by ramp when certain conditions are met

A list of replaceable features and any special requirements can be found further on in this guide.

Here we have a plugin which replaces how ramp handles projection definition lookups:

```js
window.MyPlugin = {
    feature: 'epsg',

    lookup(epsgCode) {
        return new Promise(function(resolve){
            // perform proj4 style definition lookup
            resolve(proj4);
        });
    }
}
```

The `feature: 'epsg'` property tells ramp that this plugin will be replacing a specific feature within ramp which handles projection definition lookups. Ramp then invokes the method `lookup` (a special required method) whenever it needs a lookup performed. The required method parameters and return value are document further on in the guide.

### Translations

It's a good idea to translate any text displayed to the user so the plugin text always matches the rest of the text in the ramp viewer. Luckily this process is simplified into two steps:

1. provide a `translations` property on the plugin object
2. replace the text in your HTML into translation references

The follow example shows an English/French translation object:

```js
window.MyPlugin = {
    translations: {
        'en-CA': {
            search: {
                placeholder: 'Search table'
            },
            menu: {
                split: 'Split View',
                max: 'Maximize'
            }

        'fr-CA': {
            search: {
                placeholder: 'Texte à rechercher'
            },
            menu: {
                split: 'Diviser la vue',
                max: 'Agrandir'
            }
        }
    }
}
```

Note that the language qualifiers `en-CA` and `fr-CA` should match the `rv-langs` property on the RAMP viewer HTML element.

Now in the plugin HTML we can replace all text with our translations:

```html
<h2>{{ 'plugins.MyPlugin.search.placeholder' | translate }}</h2>
<div>
    {{ 'plugins.MyPlugin.menu.split' | translate }}
</div>
```

The double curly braces are part of AngularJS, though you don't need to know it to use translations. Just replace the parts after `plugins.MyPlugin.` to match what's inside your translation object.

### angular

The RAMP viewer uses the <a href="https://angularjs.org/">v1.x AngularJS</a> framework along with <a href="https://material.angularjs.org/latest/">Angular Material</a> for UI components. This means you are free to use Angular Material components and as well as define your own custom Angular controllers.

#### register a custom controller
The `rampAPI.agControllerRegister(controllerName, controllerFunction)` method allows you to define a custom angular controller. You call this method with the two required parameters:

1. the name of your controller
2. your controller function

```js
rampAPI.agControllerRegister('MySearchCtrl', function() {
    this.searchValue = '';
    . . .
}
```

```html
<div ng-controller="MySearchCtrl as ctrl">
    <input ng-model="ctrl.searchText">
    <md-button>An angular Material Button!</md-button>
</div>
```

Now `this.searchValue` in the `MySearchCtrl` function will always have the same value as the input field! Also notice we used `md-button` in our html to match the look and feel of the rest of the viewer.

#### compiling HTML

AngularJS needs to be aware of your HTML in order to compile it. In most cases this is taken care of automatically when you place your HTML inside a panel using the RAMP API `Panel` functionality. You can also compile HTML manually by passing an `HTMLElement` to the `$compile` function on the RAMP API, such as:

``` js
var jQueryElem = rampAPI.$(htmlElem);
var scope = rampAPI.$compile(jQueryElem[0]);
```

The contents of `htmlElem` will be compiled and returned as a jQuery object.


### configuring your plugin

You can choose how map authors can configure your plugin. Generally a simple javascript object can be defined with configuration information for most types of applications. You should avoid the use of the RAMP configuration file as a source for plugin configuration since the RAMP configuration file has a defined schema which would be broken if plugin configuration objects are added.

## List of replaceable features

### epsg

This feature is used when an unknown projection is encountered.

#### Required Methods

```ts
// given a projection code, returns a promise that resolves to a proj4 string definition
lookup: (code: string | number) => Promise<"proj4 string definition">
```

### geoSearch

#### Required methods

```ts
GeoSearchUI(config: geoSearchConfig): geoSearchObject

interface geoSearchConfig {
    includeTypes: string | Array<string>,
    excludeTypes: string | Array<string>,
    language: string,
    maxResults: number,
    geoLocateUrl: string,
    geoNameUrl: string
}

interface geoSearchObject {
    query: (query: string) => Promise<Array<LocationObject>>,
    fetchProvinces: () => Array<Provinces>,
    fetchTypes: () => Array<Types>
}

interface LocationObject {
    name: string,
    bbox: Array<number>, // exactly 4 entries. Longitudes and latitudes respectively twice
    type: {
        name: string
    },
    position: Array<number>, // exactly 2 entries. Longitude and latitude respectively
    location: {
        city: string,
        latitude: number,
        longitude: number,
        province: string
    }
}

interface Provinces {
    code: string,
    abbr: string,
    name: string
}

interface Types {
    code: string,
    name: string
}
```
