---
nav: author
---

This section will show you how to load a viewer on your own host page.

### Getting the source

The first thing we'll need to do is to download a copy of the viewer's code. Visit https://github.com/fgpv-vpgf/fgpv-vpgf/releases/ and download a zip or tgz copy of the code from the latest release. Unpack this file to a location so that the files within are accessible to your host page.


### Placing the DOM node

Now that we have the source code available, we'll need to add an HTML snippet to our host page. This is where the map will be placed on the page. Here is an example of a DOM node:

```html
<div class="myMap" is="rv-map" data-rv-config="config.${lang}.json" data-rv-langs='["en-CA", "fr-CA"]'
        data-rv-service-endpoint="http://section917.cloudapp.net:8000/" data-rv-keys='["Airports"]'
        data-rv-restore-bookmark="bookmark">
        <noscript>
        <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

        <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
    </noscript>
</div>
```

You'll notice that the `is="rv-map"` lets the viewer know this is the element to use for a viewer instance. We can certainly have multiple nodes with `is="rv-map"` if we'd like to have multiple viewers active on the page. For more information on the other attributes present in the DOM node, refer to {@tutorial custom_attributes}.

Note that we have full control over where we can place this DOM node (anywhere within the `body` tags). We can also assign a CSS style to `.myMap` to change the width or height of the map. For the above example, we want to create a viewer that takes up the entire page, so our CSS style would look something like:

```css
 .myMap {
    height: 100%;
}
```

We could also make a viewer a specific width or height with:

```css
 .myMap {
    height: 600px;
    width: 600px;
}
```

### Using an iframe

Our sample page `index-iframe.html` loads the viewer through an iframe.

```html
<iframe src="./iframe-map.html" allowfullscreen></iframe>
```

Note to include the `allowfullscreen` option on the iframe if you want users to be able to full screen the viewer (option is available in the side menu).


### Loading Polyfills

You are responsible for loading the required polyfills on the host page. 

The easiest way is to include the following script **before** `rv-main.js`:

```js
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Object.entries,Object.values,Array.prototype.find,Array.prototype.findIndex,Array.prototype.values,Array.prototype.includes,HTMLCanvasElement.prototype.toBlob,String.prototype.repeat,String.prototype.codePointAt,String.fromCodePoint,NodeList.prototype.@@iterator"></script>
```

If you'd prefer to load polyfills from an alternate source then the following is a list of all required polyfills:

Array.isArray, Array.prototype.every, Array.prototype.filter, Array.prototype.forEach, Array.prototype.indexOf, Array.prototype.lastIndexOf, Array.prototype.map, Array.prototype.reduce, Array.prototype.reduceRight, Array.prototype.some, atob, CustomEvent, Date.now, Date.prototype.toISOString, Document, document.querySelector, document.visibilityState, DOMTokenList, Element, Element.prototype.classList, Element.prototype.cloneNode, Element.prototype.closest, Element.prototype.matches, Event, Event.DOMContentLoaded, Event.focusin, Event.hashchange, Function.prototype.bind, JSON, Object.assign, Object.create, Object.defineProperties, Object.defineProperty, Object.getOwnPropertyNames, Object.getPrototypeOf, Object.keys, requestAnimationFrame, String.prototype.includes, String.prototype.trim, Window, XMLHttpRequest, ~html5-elements, Object.entries, Object.values, Array.prototype.find, Array.prototype.findIndex, Array.prototype.values, Array.prototype.includes, HTMLCanvasElement.prototype.toBlob, String.prototype.repeat, String.prototype.codePointAt, String.fromCodePoint, NodeList.prototype.@@iterator, Promise, Promise.prototype.finally


### Including rv-main.js
Lastly we want to include `rv-main.js` at the end of our file (right before the closing `body` tag). Refer to {@tutorial app_startup} for more information about the bootstrapping process.

`<script src="rv-main.js"><\/script>`
