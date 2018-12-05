Plugins add or modify functionality in RAMP in a variety of ways. The RAMP API is the primary method of interacting with the viewer, but is not the only way. Plugins are free to manipulate the DOM with jQuery, make use of the built-in support for Angular and Angular Materials or import their own libraries for use. Since plugins have few restrictions and a flexible architecture, almost anything is possible.

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

###  preInit(rampConfig) : Promise(any) | void;

`preInit` is an optional method for the plugin object which is called before the `init` method and before the RAMP API is ready. This method accepts the RAMP configuration as a read-only object.

There may be cases where you'd like to perform some asynchronous operations before the viewer loads. If you return a promise from this method RAMP will pause loading until it resolves into a value that evaluates to `true`.

Let's see this in action with an example:

```js
var config;
window.MyPlugin = {
    preInit(rampConfig) {
        config = rampConfig; // store the config for later use
        return new Promise(function(resolve) {
            // do some async operations . . .
            resolve(true);
        });
    },

    . . .
}
```

### intentions

In Figure 1 above, the first plugin (denoted with a red border) is a special type of plugin called an **intention plugin**. These types of plugins are similar to regular plugins except:

1. it can only be used to replace certain features of the ramp viewer
2. there may be specific properties or methods (required or optional) that are unique to the feature of ramp you will be replacing

The only required property for any type of intention plugin is `intention`. This tells RAMP that the plugin is an intention and which specific feature it will replace. Let's see what an intention plugin looks like with the following example that replaces the default way the RAMP viewer performs projection definition lookups:

```js
window.MyPlugin = {
    intention: 'epsg',

    lookup(epsgCode) {
        return new Promise(function(resolve){
            // perform proj4 style definition lookup
            resolve(proj4);
        });
    }
}
```

It is very similar in structure to a regular plugin. But how did we know to set the `intention` property to `epsg` and where did this `lookup` method come from? Recall that intention plugins can only replace certain features in the viewer. All replaceable features are documented with a name (in this case `epsg`) and any optional or required methods and properties (in this case `lookup`).

<p class="tip">
    Read through [the list of intentions](#list-of-intentions) at the bottom of this documentation to get familiar with the various types of features that can be replaced.
</p>

### translations

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
<h2>{{ 't.search.placeholder' | translate }}</h2>
<div>
    {{ 't.menu.split' | translate }}
</div>
```

The double curly braces are part of AngularJS, though you don't need to know it to use translations. Just replace the parts after `t.` to match what's inside your translation object.

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

## List of Intentions

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

### table

The default simple data table for displaying layer attribute data.

There are no required or optional methods/properties.