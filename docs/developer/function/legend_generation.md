## Legend Generation (LegendService)

The LegendService is responsible for converting the entries, entryGroups, and other items from the legend section of the config into appropriate LegendBlocks which will then be rendered in UI. The concept is simple - take an legend entry from the config, create a LegendBlock, and link it to the corresponding LayerRecord, and yet the `legend.service.js` file is currently 800 lines long.

### constructLegend

This function is invoked only once per every config load and will generate initial legend based on the config data. All additional layers need to be added to the legend separately, one by one. `constructLegend` function takes in an array of legend blocks and an array of layer definitions. Each layer definition is converted into a layer blueprint for future references by the legend blocks. It's possible for a single layer record to be referenced in several layer blocks, and for some layer records not to be used at all. Layer blueprints are just that, dormant layer record templates which are only instantiated when a corresponding reference is found in a legend block.

Next, the legend tree is processed. Group, Info, and Set legend blocks are very straightforward to create - they are static and not directly connected to the layer record. Groups and Sets are containers for other blocks, while Info blocks are just hold some text or image data.

An additional mapping is created which holds an array of references to the legendBlock and the corresponding blockConfig objects that belong to a particular layerRecord in the form of `{ <layerRecordId>: [ { legendBlockId: <String>, blockConfigId: <String> }, ... ] }`.

This is used when reloading or removing legend blocks. Since the user can issue to reload or remove a single legend block, and several legend blocks can potentially reference a single layer, all legend blocks connected to that layer need to be re-created. This mapping makes it easier to track such cases.

When creating a Legend Node block (`_makeLegendBlock`), first the appropriate blueprints are found - there must be a single main blueprint and zero or more controlled blueprints (`controlledIds` option from the config). Then, legend block is mapped to the entry type:
- all single entries except for entries whose main blueprint is of `esriDynamic` type are rendered as `LegendNode`s
    - `ogcWMS` are rendered as `LegendNode`s for now
- all single entries whose main blueprint is of `esriDynamic` type are rendered as `LegendGroup`s
- all child entries of a entry referencing an `EsriDynamic` layer, are rendered according to that layer's structure, after the layer has been loaded - this cannot be determined upfront

#### _makeNodeBlock

First, a referenced layer record for this block is retrieved from the `layerRegistry` - the record might already exist or not (if not, it's created and loaded), and its proxy object extracted. This happens in `_getLegendBlockProxy`.

> Note: a layer proxy object is a geoApi wrapper around ESRI layer objects, adding a layer of abstraction between the client code and ESRI API.

This proxy object is then wrapped in a `ProxyWrapper` together with the corresponding layer config snippet. This is required since layer config might have settings specified that are not available through the layer proxy. Also, initial opacity, visibility, and query states are set on the proxy objects here using the values from the layer config. As the properties being changed by the user, the layer config is being updated along with the proxy object. This is useful when the layer needs to be reloaded - it automatically keeps all the latest settings are they are ultimately stored in the layer blueprint.

Next, the actual `LegendNode` object is created and an appropriate `legendMappings` is made. A on-load listener is set on the corresponding layer record which will apply initial settings specified in the config to the layer proxy object (`LegendNode.applyInitialStateSettings`). This is needed to apply state settings that are not set in geoApi (dynamic layers, for example, start up as fully invisible to prevent flicker on initial load).

The controlled blueprints are processed next. A flat list of controlled blueprints is converted into a flat list of `ProxyWrapper`s using `_getControlledLegendBlockProxy`. Each controlled proxy wrapper is added to the `LegendBlock` and its settings are synchronized with the main layer record (`LegendNode.addControlledProxyWrapper` and `LegendNode.synchronizeControlledProxyWrappers`). Only `opacity` and `visibility` properties are synchronized between the main and controlled blueprints. It's one way synchronization - changes made on the legend block (and its main layer record) are forced on controlled layer records.

It's possible to prevent this by disabling `visibility` or `opacity` controls on the controlled layer records:

```json
"legend": {
    "type": "structured",
    "root": {
       "name": "root",
        "children": [
            {
                "layerId": "powerplant100mw-electric",
                "controlledIds": [
                    "powerplant100mw-naturalGas"
                ]
            }
        ]
    }
}
```

```json
"layers": [
    {
        "id": "powerplant100mw-electric",
        "name": "Some Custom Name",
        "layerType": "esriFeature",
        "url": "www..."
    },
    {
        "id": "powerplant100mw-naturalGas",
        "name": "Natural Gas Pipeline",
        "layerType": "esriFeature",
        "disabledControls": ["opacity", "visibility"],
        "url": "www..."
    }
]
```

In this case, the controlled `powerplant100mw-naturalGas` layer will always be visible on the map, even if its master `powerplant100mw-electric` is turned off.

#### _makeDynamicGroupBlock

This is most convoluted one. Dynamic entries are rendered as a group (unless they are single entry collapsed), with children, some of which can also be groups, depending on the layer structure, which is unknown until the layer is loaded.

First, we get the `ProxyWrapper` for the Dynamic layer itself and construct a new `LegendGroup` config for it. A new group config is needed since an `entry` is turned into a `group` and groups have some different controls and settings. With the new config and the `ProxyWrapper` the `LegendGroup` block is created and mapped to its layer. Then a on-load listener is set which will run `_createDynamicChildTree` to create a tree since now we know the layer structure. The tree is parsed and all its children are added to the `LegendGroup` block created in the beginning (`_addChildBlock`). The settings of leaves are synchronized (`LegendNode.applyInitialStateSettings`).

The controlled layers are processed in a similar fashion to controlled layers on a `LegendNode` with huge difference - controlled `ProxyWrapper`s are actually turned into normal legend blocks which are added to the group as usual. These blocks are marked as `controlled` which precludes them from being rendered.

#### _getControlledLegendBlockProxy

This function is used by all layer types to create a flat list of controlled `ProxyWrapper`s. First, controlled wrappers get their `boundingBox` and `query` settings and states disabled. If the controlled layer is not a Dynamic one: layer record is retrieved, its proxy object is obtained, wrapped and returned. Easy.

If the controlled layer is a Dynamic layer, its structure is unknown until it loads. When it does load, its child tree is created (`_createDynamicChildTree`), and their `ProxyWrapper`s are extracted as a flat list (their hierarchy is irrelevant since they will never be rendered in UI, so we are content with a flat list).

#### _createDynamicChildTree

This function parses the child tree returned by the service, and creates a config for each child using options specified in the config (if any), child defaults, group defaults, and their parent defaults (see `ConfigObject.applyLayerNodeDefaults` for details on how defaults are applied in this case).

Let's say we have this legend and layer definitions from the config file:

```json
"legend": {
    "type": "structured",
    "root": {
       "name": "root",
        "children": [
            {
                "layerId": "one",
            }
        ]
    }
}
```

```json
"layers": [
    {
        "id": "one",
        "name": "Dynamic Layer",
        "layerType": "esriDynamic",
        "url": "www...",
        "layerEntries": [{"index": 1}]
    }
]
```

The service returns the following child tree:

```json
[
    {
        "entryIndex":1,
        "name":"Group2",
        "childs":[
            { "entryIndex":2 }
        ]
    }
]
```

And we end up with the following legend blocks:

```json
LegendGroup: "Dynamic Layer"
    LegendGroup: "Group2"
        LegendNode: "prox_point_l2"
```

When all of these additional block configs are created, they are stored in the original layer config source and the layer itself is considered `resolved`. The next time this layer is reloaded or restored from a bookmark, its config is complete and there is no need to apply defaults (if defaults are applied, they will mess up stored state).

### importLayerBlueprint

Adding a new layer blueprint is simple - generate an entry config (importing a layer blueprint works as autogenerated legend), make a legend block and add it to the existing legend blocks. For the last step, you need to find an appropriate place to insert the newcomer: in `autogenerate` legend, the new layer is added at the top of its respective group (Feature layers or everything else); in `structured` legend, the new layer is added to the position provided to `importLayerBlueprint` or at the bottom of the legend.

It's added to `legendMappings` and the new block config is added to the legend config (always to the root group), so it will be preserved when map is rebuilt.

### reloadBoundLegendBlocks

A trick in reloading a legend block is to find all the legend blocks connected to the underlying layer record and update all of them. Getting a layerRecordId, regenerate the layer record (`layerRegistry.regenerateLayerRecord`), go through `legendMappings` and find all the legend blocks involved. Reload all the layers which are controlled by these legend block in a recursive call to `reloadBoundLegendBlocks`. After this is done, create a new `LegendNode` and replace the old one. Don't forget to remove any leftover bounding boxes, as they are separate entities from the legend blocks.


### removeLegendBlock

Removing a legend block involves pulling out the block from the legend, and turning off visibility on the corresponding layer record. `removeLegendBlock` returns two functions - to remove completely and restore the legend block. The caller function must decide what to do.

Removing completely means calling `layerRegistry.removeLayerRecord` to kill the layer record and remove the leftover bounding boxes (the actual legend block is already removed from the legend).

Restoring adds the legend block back to its place and restored cached visibility values (in cases of dynamic layers, there can be more than one).

> Note: since removing legend blocks is only allowed for user-added layers and autogenerated legends, it's safe to assume there is only one legend block per layer record.


## Notes

Config samples use __2.1__ version of the schema.