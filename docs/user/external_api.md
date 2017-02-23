There is an external API accessible through `window.RV`. This API gives you access to base and core plugins, as well as map instances. Map instances in turn have an accessible API as well.

### Map API
Since there can be multiple viewers on any given page it makes sense for some API functionality to be bound to a viewer instance. This API is available immediately on page load, even if the viewer hasn't been fully loaded yet. As a result, any API call which should return a value will instead return a promise which is resolved when the map has finished loading.

Below is a list of available API functionality. 

**loadRcsLayers(Array: keys)** - RCS layers to be loaded once the map has been instantiated.

**setLanguage(String: lang)** - Sets the translation language and reloads the map.

**getBookmark()** - Returns a bookmark for the current viewers state.

**useBookmark(String: bookmark)** - Updates the map using bookmark.

**initialBookmark(String: bookmark)** - Initializes the viewer with this bookmark.

**centerAndZoom(Number: x, Number: y, Object: spatialRef, Number: zoom)** - Updates the extent of the map by centering and zooming the map.

**restoreSession(Array: keys)** - Loads using a bookmark from sessionStorage (if found) and a keyList.

**getRcsLayerIDs()** - Returns an array of ids for rcs added layers.

**registerPlugin()** - Registers a plugin with a viewer instance.

### Plugins
You can access {@tutorial base_plugins} through `RV.BasePlugins` and {@tutorial core_plugins} through `RV.Plugins`. 

For example, the {@tutorial back_to_cart} plugin can be accessed via `RV.Plugins.BackToCart`.