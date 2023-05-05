# Bookmark Data Format

This lays out how information is encoded into the character string that is appended to the url of a bookmarked page.

## Version B

`B,<Basemap>,<X-Coord>,<Y-Coord>,<Scale>,<Layer Info>`

`<Basemap>` = `<Basemap Id><Blank Basemap Flag>`

`<Basemap Id>` is the id of the active basemap.

`<Blank Basemap Flag>` is a binary flag (encoded as a character) indicating the basemap is in blank mode. Blank mode means there is a basemap, but it is set to be invisible. `1` for blank mode, `0` for normal mode.

`<X-Coord>` and `<Y-Coord>` are the co-ordinates of the center of the map on the screen.  Units are defined by the projection of the `<Basemap Id>`.

`<Scale>` is the scale the map is currently at.

`<Layer Info>` is a list of zero or more `<Layer Item>` separated by commas (if zero, there is no comma following `<Scale>`)

`<Layer Item>` = `<Layer Code><Layer Settings><Children Info><Layer Id>`

`<Layer Code>` is a hex digit specifying the layer type.  Values are

* `0` - Feature Layer
* `1` - WMS Layer
* `2` - Tile Layer
* `3` - Dynamic Layer
* `4` - Image Layer

`<Layer Settings>` = `<Opacity><Visibility><Bounding Box><Snapshot><Query><Child Count>`. Defines the properties of the layer.  It is a blob of binary data encoded in 5 hex characters. The layout is the same regardless of `<Layer Code>`; properties that don't apply to the given layer code will be given a default or arbitrary value, and will be ignored when the bookmark is consumed.

`<Opacity>` is an integer specifying the opacity. Values between `0` and `100` are valid.  It is stored using 7 bits.

`<Visibility>` is a binary flag indicating visibility. `1` for visible, `0` for invisible.  1 bit!

`<Bounding Box>` is a binary flag indicating visibility of the bounding box. `1` for visible, `0` for invisible.  1 bit!

`<Snapshot>` is a binary flag indicating snapshot mode. `1` for snapshot mode, `0` for on-demand mode.  1 bit!

`<Query>` is a binary flag indicating layer queryability. `1` for queryable, `0` for not.  1 bit!

`<Child Count>` is an integer specifying the number of entries that exist in the `<Children Info>` section. It is stored using 9 bits, resulting in an upper limit of 512 child entries for a layer.

`<Children Info>` is a list of zero or more `<Child Item>`.  Since `<Child Item>` has a fixed size, there is no delimiter.  This will only have content for Dynamic Layers; all other types will have an empty list and `<Child Count>` will be 0.  The order of `<Child Item>` matters, as it determines which items are children of a root-level sub layer.  Children of a root-level sub-layer must immediately follow the root-level entry. See `<Root Flag>` below.  E.g. `<Root A><Child 1 of A><Child 2 of A><Root B><Child 1 of B><Root C><Root D><Child 1 of D>`

`<Child Item>` = `<Opacity><Visibility><Query><Root Flag><Layer Index>`.  Represents a sublayer of a Dynamic service. It is a blob of binary data encoded in 6 hex characters.  **Note** that we technically have 2 bits left over in this structure as is, so we could buff our `<Layer Index>` to an upper limit of 16,384 if we desired.

`<Root Flag>` is a binary flag indicating if the `<Child Item>` is at the root of the layer in the legend. `1` for a root item, `0` for a child of a root item.  1 bit!

`<Layer Index>` is an integer specifying the index that a sub layer is defined by in a Dynamic Layer.  It is stored using 12 bits, resulting in an upper limit of 4096 layer indexes for a map service.

`<Layer Id>` is the id of the layer.  It can be of variable length.

Additional ideas not yet captured in the spec
* If we want to have fun and adopt base-36 numbers, might be able to squish things down further.  Havn't done any math on it yet.
* Proposal to change the bookmark-to-config process from a `push` to a `pull` approach.
  * NOTE this whole topic may be invalidated after the state snapshot refactor happens
  * The current `push` approach takes the config fragment generated from bookmark data and merges it into the existing/defaulted master config structure.  Any existing properties are overwritten. Any new properties are added.
  * The `pull` proposal iterates over the properties of the master config structure, and looks to see if the config fragment from the bookmark has matching properties. If so, it will update the master config. Anything in the bookmark config fragment that is not defined in the master config will be ignored.
  * Benefit of the `pull` approach is that we can encode all properties for all layer types (i.e. any layer has an identical layout in the bookmark), and any properties that don't apply to a specific layer will be ignored when reconstructing the config file from the bookmark.  The proposal below still uses the identical layout format, but requires layer-type specific logic to identify which properties to ignore when the bookmark is consumed.
  * Potential risk of the `pull` approach is there is no way to get a new property into the config from the bookmark. If we have defaulting with full coverage of properties, this should be ok. However if we have a situation where the lack of a property is an acceptable default, we run into problems (e.g. the newly proposed `layer.controls` config entry has meaning when it is not defined).
* Possible refactor to always store the X and Y co-ordinates in Lat/Long with a fixed precision.
  * Avoids encoding massive decimal information due to rounding when using meters-based projections (e.g. `11222333.599999999999` converts to `85.293945`)
  * Requires an additional point projection when encoding and decoding the bookmark.


## Version A

Note that Version A has been depreciated and is no longer supported. The schema is preserved here in perpetuity on the chance it is needed.

`A,<Basemap>,<X-Coord>,<Y-Coord>,<Scale>,<Layer Info>`

`<Basemap>` is the id of the active basemap.

`<X-Coord>` and `<Y-Coord>` are the co-ordinates of the center of the map on the screen.  Units are defined by the projection of the `<Basemap>`.

`<Scale>` is the scale the map is currently at.

`<Layer Info>` is a list of zero or more `<Layer Item>` separated by commas (if zero, there is no comma following `<Scale>`)

`<Layer Item>` = `<Layer Code><Layer Id><Layer Settings>`

`<Layer Code>` is a two digit code specifying the layer type.  Values are

* `00` - Feature Layer
* `01` - WMS Layer
* `02` - Tile Layer
* `03` - Dynamic Layer
* `04` - Image Layer

`<Layer Id>` is the id of the layer.  It can be of variable length.

`<Layer Settings>` define properties of the layer. The layout differs depending on the `<Layer Code>`

* Feature - `<Opacity><Visibility><Bounding Box><Snapshot><Query>`
* WMS - `<Opacity><Visibility><Bounding Box><Query>`
* Tile - `<Opacity><Visibility><Bounding Box>`
* Dynamic - `<Opacity><Visibility><Bounding Box><Query>`
* Image - `<Opacity><Visibility><Bounding Box>`

`<Opacity>` is a three digit integer specifying the opacity. Values between `000` and `100` are valid.

`<Visibility>` is a binary flag indicating visibility. `1` for visible, `0` for invisible.

`<Bounding Box>` is a binary flag indicating visibility of the bounding box. `1` for visible, `0` for invisible.

`<Snapshot>` is a binary flag indicating snapshot mode in Feature Layers. `1` for snapshot mode, `0` for on-demand mode.

`<Query>` is a binary flag indicating layer queryability. `1` for queryable, `0` for not.