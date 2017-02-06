Plugins allow viewer functionality to be added or modified. On a high level there are three kinds of plugins:

1. {@tutorial core_plugins}
  
  Contain common functionality needed by many users. They are created and maintained by us. It comes bundled with the viewer code - no additional files need to be loaded. 

2. {@tutorial external_plugins}

  Not bundled with the viewer code - needs to be loaded manually before use. Can be created and maintained by us, third party developers, or yourself! 

3. {@tutorial base_plugins}

  Are more 'abstract' in that they don't do anything useful right off the bat. They are an interface between external and core plugins to the viewer and therefore contain all the code needed to make a plugin. In fact, all plugins must extend a base plugin.

## Registering a plugin 

A plugin is registered to a specific viewer instance. If there is more than one viewer on the page with each one needing a specific plugin, you'll need to register a plugin for every viewer instance.

This is how you register a plugin:
```js
RV.ready(function() {
  RV.getMap('fgp').registerPlugin(HelloWorldPlugin, 'The viewer id is {0}');
});
```

We first wait for the viewer to load with `RV.ready` then call `registerPlugin` on the viewer instance. We pass the plugin class reference as the first parameter. Note that we do not instantiate the plugin here, the viewer will do this for us. 

We can also pass zero or more other parameters, these will be passed to our plugins `init` method untouched. For now just ignore the string `'The viewer id is {0}'` in the above example, this will be explained in more detail below.

## HelloWorldPlugin example

In this example we'll create a plugin which adds a link to the left menu of the viewer and displays an alert box when clicked. Our alert box will also contain the viewers id to give you a feel for accessing the API. Don't worry if you don't understand what's happening at first, it will make more sense as you read on. 

```js
>> HelloWorldPlugin.js

class HelloWorldPlugin extends RV.Plugins.MenuItem {
  init (alertText) {
     // replace the {0} in our string with the viewers id
     this.alertText = alertText.format(this.api.appInfo.id);
  }
  // set the link text that will appear in the left side menu
  get name () {
    return 'Hello World Button';
  }
  // show the alert when the link is clicked
  get action () {
    return () => alert(this.alertText);
  }
}
```

`class HelloWorldPlugin extends RV.Plugins.MenuItem`

> We create a class named `HelloWorldPlugin`. Notice that we extend it with `RV.Plugins.MenuItem`. This tells the viewer that our plugin will be creating a link in the left side menu. You can visit the {@tutorial base_plugins} wiki page for a full list of available base plugins and how to use them. The remainder of our plugin simply overrides some default properties of `MenuItem` so that it does what we want - to show an alert box!

`init (alertText) {`

> The `init` method is special to all plugin types in that it is called when the plugin is initialized by the viewer. This is where we can add code that we want executed on plugin startup. We can add any number of parameters here, and as you saw above, we passed a string value when registering this plugin.

`this.alertText = alertText.format(this.api.appInfo.id);`

> Here we're just setting a property of this class, namely `alertText` to whatever we passed in on plugin registration. The only twist - we replaced the occurance of '{0}' in our string with the viewers id. The viewers api is available via `this.api`, and in this case `appInfo.id` contains the viewer id. -- FIXME: Reference API here --

`get name () {`

> This is the text that appears in our link. In this example we return a string 'Hello World Button'. We could have also passed a translation key, see below for an example of this.

`get action () {`

> This function will be executed whenever someone clicks on our link, so it's the perfect place to put our alert box code.

## Translations

Some plugin properties like `name` in the above example can have translations. Let's extend the above example to include this functionality. First we create a translation object:

```js
const translations = {
    'en-CA': {
        helloButtonLabel: 'Hello World'
    },

    'fr-CA': {
        helloButtonLabel: 'Boujour Monde'
    }
};
```

Each property of `translations` is a language key. In this example we will have an english and french translation denoted `en-CA` and `fr-CA` respectively. Within each language object we have keys which we'll use to identify the translation string as the value. Confused? Don't be! Watch and learn:

From the example above lets remove the `get name ()` method entirely, and instead we'll add two additional lines to the `init` method:

```js
this.name = 'helloButtonLabel'; // translation object key
this.translations = translations; // give the plugin our translation object
```

That's all there is to it, your plugin will display the correct link text based on the current language of the map. Here is a full version with translations:

```js
>> HelloWorldPlugin.js

const translations = {
    'en-CA': {
        helloButtonLabel: 'Hello World'
    },

    'fr-CA': {
        helloButtonLabel: 'Boujour Monde'
    }
};

class HelloWorldPlugin extends RV.Plugins.MenuItem {
  init (alertText) {
     // replace the {0} in our string with the viewers id
     this.alertText = alertText.format(this.api.appInfo.id);
     this.name = 'helloButtonLabel';
     this.translations = translations;
  }
  // show the alert when the link is clicked
  get action () {
    return () => alert(this.alertText);
  }
}
```

What about translating the alert text? Unfortunately this is not yet possible :-1: 