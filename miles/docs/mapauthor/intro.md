# A guide for map authors

This guide is intended for those who are looking to use the RAMP viewer for their webpage or project.

## Key Concepts

Setting up a basic RAMP viewer in a website revolves around the following concepts

* Loading the necessary libraries and scripts
* Providing a configuration file to tailor the viewer to your liking
* Consuming sources of spatial data

![](assets/images/simple_architecture.png)

Also see the [Helpful Links](#helpful-links) for more advanced topics, such as using plugins or the RAMP API.

## Loading Scripts

As a baseline the page must include `rv-styles.css`, `rv-main.js` , jQuery and the polyfills required for RAMP.

### Adding the viewer to a page

The first thing we'll need to do is to download a copy of the viewer's code. Visit https://github.com/fgpv-vpgf/fgpv-vpgf/releases/ and download a zip or tgz copy of the code from the latest release. Unpack this file to a location so that the files within are accessible to your host page.

To load the viewer on a webpage, a few things are required on the host page:

- A script tag which contains the polyfills for the page. This should be placed in the body section of the host page near the end. This must be placed above `rv-main.js`. One option is to use a call to polyfill.io; it is a simple way to get polyfills, but makes your site dependent on the service being functional.

  ```html
  <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Object.entries,Object.values,Array.prototype.find,Array.prototype.findIndex,Array.prototype.values,Array.prototype.includes,HTMLCanvasElement.prototype.toBlob,String.prototype.repeat,String.prototype.codePointAt,String.fromCodePoint,NodeList.prototype.@@iterator,Promise,Promise.prototype.finally"></script>
  ```

    - If you'd prefer to load polyfills from an alternate source then the following is a list of all required polyfills:

     Array.isArray, Array.prototype.every, Array.prototype.filter, Array.prototype.forEach, Array.prototype.indexOf, Array.prototype.lastIndexOf, Array.prototype.map, Array.prototype.reduce, Array.prototype.reduceRight, Array.prototype.some, atob, CustomEvent, Date.now, Date.prototype.toISOString, Document, document.querySelector, document.visibilityState, DOMTokenList, Element, Element.prototype.classList, Element.prototype.cloneNode, Element.prototype.closest, Element.prototype.matches, Event, Event.DOMContentLoaded, Event.focusin, Event.hashchange, Function.prototype.bind, JSON, Object.assign, Object.create, Object.defineProperties, Object.defineProperty, Object.getOwnPropertyNames, Object.getPrototypeOf, Object.keys, requestAnimationFrame, String.prototype.includes, String.prototype.trim, Window, XMLHttpRequest, ~html5-elements, Object.entries, Object.values, Array.prototype.find, Array.prototype.findIndex, Array.prototype.values, Array.prototype.includes, HTMLCanvasElement.prototype.toBlob, String.prototype.repeat, String.prototype.codePointAt, String.fromCodePoint, NodeList.prototype.@@iterator, Promise, Promise.prototype.finally

- A script tag which loads `rv-main.js`. This should be placed in the `body` section of the host page near the end. It should also be placed before any of the host page scripts that interact with the external API.

- A script tag which loads JQuery. This should be placed in the `body` section of the host page, right above `rv-main.js`.

  - Note: This is to avoid conflicts with other software. Its possible something else on the page already loads/requires jQuery. Try loading only one copy of jQuery on the page.

- A css tag that loads `rv-styles.css`, somewhere near the end of the `head`.

- One or more HTML elements having the property `is="rv-map"`. An alternative to this is a call to the RAMP API's `new RAMP.Map()` constructor. More details:

#### 1. Classic element

- On the page, include an element with the property `is="rv-map"`

- If you have written a confuration file then you should add: `rv-config="<path to your config file>"` to the element

- Example

  ```html
  <div id="my-map" is="rv-map" rv-config="rv-config.json"></div>
  ```

- There are also [other attributes](/mapauthor/custom_attributes) you can specify

#### 2. API

- On the page, include an element with an `id` to act as an anchor. e.g. `<div id="app"></div>`

- In a script tag, or JavaScript file, call `new RAMP.Map(<anchor>, <path to your config file>);`

  - If you have no config file call `new RAMP.Map(<anchor>);`
  - The anchor can be found using `document.getElementById(<id of the anchor>)`

- Example

  ```javascript
  new RAMP.Map(document.getElementById('app'), './rv-config.json');
  ```

## Writing a RAMP config file

The easiest way to know how to construct a certain part of the config file is to check the [schema](https://fgpv-vpgf.github.io/schema-to-docs/). For the purposes of this guide, we will go through some simple examples of parts of the config.

Config elements related to loading map data are covered in the [Adding Spatial Data](#adding-spatial-data) section below.

### Legend

There are two options to choose from for legends; `structured` which allows for a customizable themed user experience, and `autopopulate` which lends itself to multipurpose maps or user defined experiences

* Structured legends allow you to specify the order and grouping of layers, as well as add text/images in `infoSections`. This allows for extra information and theming.
* Structured legends are a good choice if you want to give users more description of what they are seeing on the map, or force a certain layer ordering.
* Structured legends are a bad choice if you want to let users add layers or reorder existing layers, as this mode disables those functionalities.
* Autopopulate legends allow for a simpler configuration process. As the name suggests RAMP automatically populates the legend based on the layers you specify. They also enable users to reorder layers.
* Autopopulate legends are a good choice if you have a multipurpose map on a site, or have no need for extra text/images in the legend.
* Autopopulate legends are a bad choice if you don't want users to reorder existing layers, or you want extra descriptions and explanations in the legend.

#### 1. Structured

##### Info Section

Info sections are static content which can between any legend blocks.

```json
{
    "infoType": "text",
    "content": "This is some text you want to display in the layer"
},
{
    "infoType": "title",
    "content": "Like the text section, this is some text... its a bit larger"
},
{
	"infoType": "image",
	"content": "mysupercoolimage.png"
},
{
    "infoType": "unboundLayer",
    "layerName": "How to catch Santa (//www.pusheen.com/)",
    "symbologyStack": [
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step1.gif",
            "text":"1. Set your bait"
        },
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step2.gif",
            "text":"2. Hide"
        },
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step3.gif",
            "text":"3. Don't eat the bait"
        },
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step4.gif",
            "text":"4. Don't do it"
        },
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step5.gif",
            "text":"5. Stop!!"
        },
        {
            "image": "http://fgpv.cloudapp.net/demo/__assets__/step6.gif",
            "text":"6. You ruined it!"
        }
    ],
    "symbologyRenderStyle": "images"
}
```

One of those is slightly different from the others. An unbound layer mimics the look of a regular layer legend block. Its got a name and a symbology stack but, unlike regular layers, it's not tied to any data.

It comes out looking like this:

![](https://i.imgur.com/yiPlbtJ.png)

##### Entry (layer node)

The simplest layer node only designates where in the legend the layer should show up:

```json
{
    "layerId": "powerplant100mw-electric"
}
```

There are many more options you can choose if you want to be fancier, they are all outlined in the [schema](https://fgpv-vpgf.github.io/schema-to-docs/). This includes things like defining a custom symbology stack, or choosing a specific sub layer of a dynamic or WMS layer.

##### Entry group

This is what you'd want to use if you'd like to group multiple things together, these can be info sections, layers, other groups, etc. Anything that can go in a legend normally can go under a group.

```json
{
    "name": "I'm a group",
    "children": [
        {
            "layerId": "powerplant100mw-electric"
        },
        {
            "layerId": "powerplant100mw-naturalGas"
        },
        {
            "layerId": "powerplant100mw-liquids"
        }
    ],
    "expanded": true
}
```

This snippet would generate a group with the title "I'm a group", and the 3 layers under it. `expanded: true`  tells the legend to not collapse the entry by default.

![](https://i.imgur.com/XbWnBhV.png)

##### Visibility Set

A visibility set can only have (at most) one element visible on the map at a time. Lets say you have 3 reference layers, but having 2 or more on at any time would just confuse users; putting these 3 layers under a visibility set will remove this confusion.

```json
{
    "exclusiveVisibility": [
        {
            "layerId": "powerplant100mw-electric"
        },
        {
            "layerId": "powerplant100mw-naturalGas"
        },
        {
            "layerId": "powerplant100mw-liquids"
        }
    ]
}
```


They look something like this;

![](https://i.imgur.com/03LBcC4.png)



##### A full structured legend

```json
"legend": {
    "type": "structured",
    "root": {
       "name": "root",
        "children": [
        	{
                "infoType": "title",
                "content": "This is a title"
        	},
            {
                "layerId": "powerplant100mw-electric"
            },
            {
                "name": "I'm a group",
                "children": [
                    {
                        "layerId": "powerplant100mw-naturalGas"
                    },
                    {
                        "layerId": "powerplant100mw-liquids"
                    }
                ],
                "expanded": true
            }
        ]
    }
}
```

This is an example of a full structured legend which includes a title, a layer on its own, and a group of 2 other layers. This is very simple and you can get much more fancy, check the [schema](https://fgpv-vpgf.github.io/schema-to-docs/) to see all the options available to you.

__Note:__ just because a structured legend passes config validation does not mean there can't be runtime errors. If something seems like it doesn't make much logical sense, its probably going to break the legend.

#### 2. Autopopulate

```json
"legend": {
    "type": "autopopulate"
}
```

Its as simple as that. RAMP will generate a legend for you at run time, which displays the layers in the order they're listed in the config.

```json
"layers": [
    {
        "id": "powerplant100mw-electric",
        "name": "Electric Transmission Line",
        "layerType": "esriFeature",
        "url": "https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/1"
    },
    {
        "id": "powerplant100mw-naturalGas",
        "name": "Natural Gas Pipeline",
        "layerType": "esriFeature",
        "url": "https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/2"
    },
    {
        "id": "powerplant100mw-liquids",
        "name": "Liquids Pipeline",
        "layerType": "esriFeature",
        "url": "https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/3"
    }
]
```

causes ramp to make the legend:

```json
"legend": [
    {
        "layerId": "powerplant100mw-electric"
    },
    {
        "layerId": "powerplant100mw-naturalGas"
    },
    {
        "layerId": "powerplant100mw-liquids"
    }
]
```

## Adding Spatial Data

### Layers

Lets take a look at a simple ESRI feature layer as it would look in the config;

```json
{
    "id": "powerplant100mw-naturalGas",
    "name": "Natural Gas Pipeline",
    "layerType": "esriFeature",
    "url": "https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/2"
},
```

"id": The id is the identifier for the layer within RAMP. If you're using a structured legend, the id is how you reference the layer.

"name": This is the label for the layer, it is displayed in the legend among other places.

"layerType": This tells RAMP what sort of data its supposed to be dealing with, we support many types of layers, each is listed in the [schema](https://fgpv-vpgf.github.io/schema-to-docs/).

"url": The endpoint for the layer. This is where you tell RAMP where to get the data for the layer.



There are other options available, but this is the simplest form of layer you can get. The [config schema](https://fgpv-vpgf.github.io/schema-to-docs/) is the place to look for more detailed info.

### Basemaps

Here is an example of a basemap config snippet;

```json
{
    "id": "baseNrCan",
    "name": "Canada Base Map - Transportation (CBMT)",
    "description": "The Canada Base Map - Transportation (CBMT) web mapping services of the Earth Sciences Sector at Natural Resources Canada, are intended primarily for online mapping application users and developers.",
    "altText": "altText - The Canada Base Map - Transportation (CBMT)",
    "layers": [
        {
        "id": "CBMT",
        "layerType": "esriFeature",
        "url": "https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer"
        }
    ],
    "tileSchemaId": "EXT_NRCAN_Lambert_3978#LOD_NRCAN_Lambert_3978"
}
```

"id": Like with layers, this is how the basemap is referenced

"name": The title/name displayed in the basemap selector

"description": The description displayed in the basemap selector

"altText": What to replace the image with if it doesn't load

"layers": An array of the basemap layers. Usually you will  only have one, but it is possible to use multiple to create a composite basemap. These basemap layers can not have settings altered in any way by the user.

"tileSchemaId": This tells RAMP what projection the basemap is for. These are defined in the tileSchema section:

```json
"tileSchemas": [
	{
    	"id": "EXT_NRCAN_Lambert_3978#LOD_NRCAN_Lambert_3978",
        "name": "Lambert Maps",
        "extentSetId": "EXT_NRCAN_Lambert_3978",
        "lodSetId": "LOD_NRCAN_Lambert_3978",
     	"hasNorthPole": true
    },
    {
    	"id": "EXT_ESRI_World_AuxMerc_3857#LOD_ESRI_World_AuxMerc_3857",
        "name": "Web Mercator Maps",
        "extentSetId": "EXT_ESRI_World_AuxMerc_3857",
        "lodSetId": "LOD_ESRI_World_AuxMerc_3857"
    }
]
```

## Tips, Tricks, Issues & Known Limitations

Legends and layers can be loaded in and out, but full configs are harder to reload RAMP with. Destroying and recreating the RAMP instance using the API can be helpful if you want to swap between different full configuration files.

With 3.0 there are some legacy API (`RV`) features that aren't yet present on the new API (`RAMP`). It should be noted however that the legacy API (`RV`) is deprecated and should only be used if there is no equivalent present on `RAMP` yet.

If your page will be served over HTTPS you should specify all endpoints, and load all scripts from outside sources using HTTPS and not HTTP. For instance the call to polyfill.io in the earlier example is HTTPS.

## Helpful links

[Samples](http://fgpv.cloudapp.net/demo/master/prod/samples/index-samples.html)

[Configs for those samples](http://fgpv.cloudapp.net/demo/master/prod/samples/config/)

[Config Schema](https://fgpv-vpgf.github.io/schema-to-docs/)

[API](/developer/api-overview)

[Legacy API (Deprecated)](/developer/legacy_api)

[Plugins](/developer/plugins)