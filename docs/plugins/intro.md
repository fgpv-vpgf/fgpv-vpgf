# Plugins

A plugin allows you to add, remove, or change the way RAMP works. There are two distinct plugin types, extensions and intentions that share similar conventions but have separate use cases. 

## Hello, World!

Let's start by example:

```js
window.myPlugin = {
    preInit: function(config) {
        // do things before RAMP has started
        // optionally return a promise and RAMP won't start until it resolves. We make the map wait for 2.5 seconds.
        return new Promise(function(resolve) {
            setTimeout(resolve, 2500);
        });
    },

    init: function(api) {
        // do things after RAMP has started
        // call doStuff()
    },

    doStuff: function() {
        // does things
    }
};
```

A plugin is a regular JavaScript object that gets added to the global window object. We defined three functions in our example above, two of which are special: `preInit` and `init`.

### preInit
This optional function is called by RAMP before the map and api have been created. A config object is given based on the maps configuration json file. If a promise is returned RAMP will wait for it to resolve before creating the map and api.

### init
This optional function is called by RAMP after the map and api have been created. The maps api object is given. Anything returned by this function is ignored.


## [Intentions](/plugins/intentions)
Certain features of RAMP can be disabled or replaced by making your own intention plugin. Intentions can have one or more special functions or properties, so it's important to read the documentation for the intention you want to replace.

You can see a list of all intentions [here](/plugins/intentions?id=intention-list). 

## [Extensions](/plugins/extensions)
Everything that's not an intention is an extension :-)

