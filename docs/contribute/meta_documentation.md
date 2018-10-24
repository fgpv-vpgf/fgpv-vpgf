# General Documentation

We are using [jsdoc](http://usejsdoc.org/) for documenting the viewer and the geoapi library.

Documentation blocks for jsdoc should start with `/**` and generally follow the javadoc format and markup style:
```text
/**
 * Main function description.
 * @function functionName
 * @return {Object} random variable
 */
```

The following is a quick reference of useful markup tags.
- [@class](http://usejsdoc.org/tags-class.html)
- [@function](http://usejsdoc.org/tags-function.html)
- [@global](http://usejsdoc.org/tags-global.html)
- [@member](http://usejsdoc.org/tags-member.html)
- [@memberof](http://usejsdoc.org/tags-memberof.html)
- [@module](http://usejsdoc.org/tags-module.html)
- [@namespace](http://usejsdoc.org/tags-namespace.html)
- [@param](http://usejsdoc.org/tags-param.html)
- [@private](http://usejsdoc.org/tags-private.html)
- [@return](http://usejsdoc.org/tags-returns.html)

## Documenting Services

All services in Angular should be linked to modules.  In jsdoc we tag the service as `@module` and the module as `@namespace` (this is confusing, but it seems to work best with the doc output).

### Notes

- `@memberof` should reference the angular module (`@namespace` in jsdoc)
- Markdown can be used within the description section

## Documenting Directives

Ideally angular directives would be listed separately from services.  Unfortunately all angular specific doc tools seem to break and lack documentation.  As such we are using the same structure for modules; however, if it becomes possible to easily separate them in the future we would like to do so.

### Sample

```js
    /**
     * @module rvShell
     * @memberof app.layout
     * @restrict E
     * @description
     *
     * The `ShellController` controller handles the shell which is the visible part of the layout.
     * `self.isLoading` is initially `true` and causes the loading overlay to be displayed; when `configService` resolves, it's set to `false` and the loading overly is removed.
     */
```

### Notes

- `@restrict` is left over from our earlier attempt to document directives, it can remain in place and will be ignored by jsdoc

## Documenting Functions

Javascript allows functions to be defined in a variety of ways.  In the context of a service or directive the function will automatically be linked as long as the `@module` tag is declared on the top level item.

### Sample

```js
        /**
         * Add RCS config layers to configuration after startup has finished
         * @function rcsAddKeys
         * @param {Array}  keys    list of keys marking which layers to retrieve
         * @return {Promise} promise of full config nodes for newly added layers
         */
```

### Notes

- `@function` can be omitted for `@class` contexts, the parser is smart enough to figure that out, `@function` should be used everywhere else
- if documenting a `Promise` describe the type which it will resolve with (simply knowing that you get back a promise is not very helpful)
- `@private` can be used to document functions which are not exposed by the service, directive or class being documented