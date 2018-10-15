Plugins can add or modify functionality in RAMP. They are only limited by your imagination (and to some degree the RAMP API). Plugin code is external to RAMP so you get to decide how and where to write your code. TypeScript is recommended, but plain ol' JavaScript will do just fine as well. 

<p class="tip">
    If you use anything other than plain JavaScript (like TypeScript) be sure to compile it into JavaScript before including it on the host page. It's also a good idea to test your plugin in different browsers such as IE11, FireFox, and Chrome. 
</p>

## Introduction

A plugin which **replaces** a specific feature in RAMP is called an **intention**. We'll go over this type of plugin in more detail further on in this guide. For now you can assume intentions act the same as any other plugins. 

Here's a sample list of three possible plugins:

1. an enhanced data table which replaces the default RAMP simple data table.
2. a static north compass icon.
3. a box with text, showing the latitude and longitude of the users mouse.

<p align="center">
  ![](assets/images/plugins/plugin-example.png)Figure 1.
</p>

All three plugins share a similar code structure, make use of the RAMP API, and perform custom DOM operations. Now let's look at how plugin code is structured with a sample.

## Structure

Plugins can be as simple as a few lines of code to hundreds or thousands. Let's dive right in and write a basic plugin that displays an alert box with lat/lon coordinates whenever the user clicks on the map.

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

<p align="center">
  ![](assets/images/plugins/basic-plugin.png)
</p>

 ## Registering

Lets bring our example plugin to life in the RAMP viewer in two steps: 

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






```js
var config;
window.MyPlugin = {
    preInit(rampConfig) {
        config = rampConfig;
    },

    . . .
}
```

<p align="center">
  ![](assets/images/plugins/plugin-intention.png)
</p>



There are two types of plugins you can write - **intentions** and **extensions**. It's important you choose the correct type when starting to write your own plugin.

## Intentions

RAMP has a set of default plugins, called __intentions__, which are loaded automatically. **You can only replace existing intentions** - you cannot create a new type of intention. As an example, RAMP loads a simple data table for displaying attribute data for certain types of layers. You could replace this simple table implementation with your own data table implementation.

Intentions can also have special optional or required methods and properties that you should be aware of. Each intention is documented which outlines any special properties/methods unique to that intention. These special properties/methods provide an additional interface between the intention and RAMP that would not otherwise be available through the API. 

<p class="tip">
    You can see a list of current intentions and their [documentation here](http://localhost:8080/#/plugins/intentions?id=intention-list).
</p>

### Overview

- Full access to the RAMP API
- You can only replace an existing default intention with your own implementation.
- Read the intentions documentation you intend to replace for details on any special properties and methods.

## Extensions

asdasd

### Overview

- Full access to the RAMP API
- Can implement or change functionality in a variety of ways 