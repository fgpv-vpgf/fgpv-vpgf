This section will show you how to load a viewer on your own host page. 

### Getting the source

The first thing we'll need to do is to download a copy of the viewer's code. Visit https://github.com/fgpv-vpgf/fgpv-vpgf/releases/ and download a zip or tgz copy of the code from the latest release. Unpack this file to a location so that the files within are accessible to your host page.


### Placing the DOM node

Now that we have the source code available, we'll need to add an HTML snippet to our host page. This is where the map will be placed on the page. Here is an example of a DOM node:

```html
<div class="fgpv" is="rv-map" data-rv-config="config.${lang}.json" data-rv-langs='["en-CA", "fr-CA"]'
        data-rv-service-endpoint="http://section917.cloudapp.net:8000/" data-rv-keys='["Airports"]'
        data-rv-restore-bookmark="bookmark" data-rv-fullpage-app="true" >
        <noscript>
        <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

        <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
    </noscript>
</div>
```

You'll notice that the `is="rv-map"` lets the viewer know this is the element to use for a viewer instance. We can certainly have multiple nodes with `is="rv-map"` if we'd like to have multiple viewers active on the page. For more information on the other attributes present in the DOM node, refer to {@tutorial custom_attributes}.

Note that we have full control over where we can place this DOM node (anywhere within the `body` tags). We can also assign a CSS style to `.fgpv` to change the width or height of the map. For the above example, we want to create a viewer that takes up the entire page, so our CSS style would look something like:

```css 
 .fgpv {
    height: 100%;
}
```

We could also make a viewer a specific width or height with:

```css 
 .fgpv {
    height: 600px;
    width: 600px;
}
```


### Loading Polyfills

Polyfills are bundled in the viewers source code under `./lib/ie-polyfills.js`, but you must explicitly load it **before you load `bootstrap.js`**. We first define what polyfills we want to include, then load the file. Below is the correct way to initialize polyfills:

```js
<script>
    var needIePolyfills = [
        'Promise' in window,
        'TextDecoder' in window,
        'findIndex' in Array.prototype,
        'find' in Array.prototype,
        'from' in Array,
        'startsWith' in String.prototype,
        'endsWith' in String.prototype,
        'outerHTML' in SVGElement.prototype
    ].some(function(x) { return !x; });

    if (needIePolyfills) {
        document.write('<script src="../lib/ie-polyfills.js"><\/script>');
    }
</script>
```

### Including bootstrap.js
Lastly we want to include `bootstrap.js` at the end of our file (right before the closing `body` tag). Refer to {@tutorial app_startup} for more information about the bootstrapping process. 

`<script src="../lib/bootstrap.js"><\/script>`
