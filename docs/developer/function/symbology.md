A layer's symbology or legend is a collection of image-labels pairs explaining features available in the layer. Internally, it's referred to as a "symbology stack" with the "stack" bit describing its vertical orientation when rendered in the UI.

As of version 2.0, symbology is for information only, and provides no interactivity. However, there are plans to provide layer filtering by symbol, see issue [#1442](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1442) for more details.

### Symbology Stack

Main directive: __rvSymbologyStack__ \
Classes used: __SymbologyStack__

The default symbology stack is generated in geoApi and provided to the client app. This is done by creating an SVG representations of the layer renderers where possible; in cases where a renderer just references an image, that image is wrapped into an SVG container for consistency.

Two style options are available for symbology stacks:
 - icons
 - images

#### Icons

All symbology images are wrapped into SVG containers sized to 32x32 pixels and rendered in a vertical list with the icon followed by its label.

This style is used by default for all layer types except WMS layers.

#### Images

All symbology images are wrapped into SVG containers sized to fit the image. All containers will be sized as the largest image in the collection or upto the width of the main panel. The label is rendered underneath the image, similar to a caption.

This style is used by default for WMS layers as they symbology image usually already contain lists of legend items with labels.

#### Interactivity

When a symbology stack is rendered, it is displayed as three almost overlapping icons (regardless of the actual number of symbols and the rendering style). If rendered in the main panel, the stack can be expanded into a full list by simply clicking on it (or selecting the "Legend" option from the layer menu).

The transition between collapsed and expanded stack is animated inside the __rvSymbologyStack__ directive. If there are many symbology items (more than a hundred), the animation may get choppy. It might makes sense to turn the animation off or simplify it for large number of elements.

#### Config

Any Legend Node or Unbound Layer can have its symbology stack defined in the config. Here's the relevant bit of config schema:

```json
"symbologyStack": {
    "type": "array",
    "items": {
        "type": "object",
        "properties": { "image": { "type": "string" }, "text": { "type": "string" } },
        "required":[ "image", "text" ],
        "additionalProperties": false
    },
    "minItems": 1
}
```

If the custom symbology is specified in the config, the default layer symbology will not be displayed. If you want to enhance the existing default layer legend, you need to include all the default images and labels as well as new ones into the custom symbology stack through the config.

### Details Panel, Datagrid, Map Export
The symbology stack is also used outside the main panel and layer list. The details panel will display a non-interactivelayer's symbology stack along side the layer name. A single-item symbology item not wrapped into a symbology stack construct is used in the datatable to display a feature icon. And symbology stack for all visible layer are included into the map's export image legend section if enabled.