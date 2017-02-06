Contains the basic code for all plugins. This includes defining properties for the plugin id, setting the viewers API, and handling translations. This plugin should **not** be extended directly. 

There are two important takeaways you should know:

The `translations` property can be used to provide a reference to a translation object. Inside a plugin class we can write:

```js
this.translations = {
  'en-CA': {
    myTranslationKey: 'My english string'
  }
};
```

This translation object will get merged in with the viewer translation service automatically!

The second is the `setTranslatableProp(string: propertyName, string: translationKey)` method. This method must be called for any class property that needs translation support. 

For example, say `MyPlugin.myField` needs translations applied, inside the `MyPlugin` class we would do something like this:

```js
set myField (myFieldValue) {
  this.setTranslatableProp('_myField', myFieldValue);
}

get myField () { return this._myField; }
```

It should be noted that **the viewer must also support translations for this property**. 