# Navigation Controls

Navigation controls are used for changing the viewing extent of the map.

The following navigation controls can be found in the bottom right corner of the map:

|Symbol|Name|Key Binding|Description|
|----|----|----|----|
|![](navigation/fullscreen.png)| Fullscreen | | Full screen presents map content using the entire page. Full screen option is only available when the map is embedded into another page  |
|![](navigation/zoomin.png)| Zoom in | Plus (+) | Zoom in one level on the map to see more detailed content |
|![](navigation/zoomout.png)| Zoom out | Minus (-) | Zoom out one level on the map to see less detailed content  |
|![](navigation/geolocation.png)| Geolocation | | Zoom and pan to your current geographical location |
|![](navigation/canada.png)| Canada | | Zoom and pan map such that all of Canada is visible |
|![](navigation/help.png)| Help | | Open the help dialog |

You can also pan the map by using your left and right arrow keys, or by click-holding on the map and dragging. Using the mouse scroll wheel while hovering over the map will zoom the map in/out.

Note that the map __must be__ focused for key binding to work. The map has focus when there is a blue border around it.


# Basemap Selector

The basemap selector modifies the underlying basemap to provide a variety of geographical contexts.

__To open the basemap selector:__

![](basemap/open.png)

First open the layers panel by selecting the layer button (shown above in red). You will then see the basemap selector appear to the left of the layer button (shown above in blue). You can also open the basemap selector from within the main menu.

You'll be presented with one or more basemaps to chose from, separated by their projection types (mercator vs lambert). The map will reload if you change projections, but won't if you switch basemaps within the same projection.


# Overview Map

The overview map displays a generalised view of the main map at a smaller scale. It can be found in the top right corner of the map.

Click-hold on the overview map and drag it to change the extent of the main map. Clicking on the toggle icon (![](overview/toggle.png)) in the top right corner of the overview map will expand or contract it.


# Main Menu

![](menu/menu.png) Access the menu by clicking on the menu button near the top left of the viewer.

There are a variety of options described below. Note that some options may not be available or are preselected depending on various factors.

|Symbol|Name|Description|
|----|----|----|
| ![](menu/layers.png) | Layers | Opens the layer panel |
| ![](menu/basemap.png) | Basemap | Opens the basemap selection panel |
| ![](menu/fullscreen.png) | Full Screen | Full screen presents map content using the entire page. Full screen option is only available when the map is embedded into another page |
| ![](menu/export.png) | Export | Opens the export image dialog  |
| ![](menu/share.png) | Share | Opens the share a url dialog |
| ![](menu/touch.png) | Touch Mode | Increases button sizes and generally improves the experience for touch users |
| ![](menu/help.png) | Help | Opens the help dialog |
| ![](menu/language.png) | Language | Displays a list of supported languages you can switch to |


# Share

Share is used to generate a shareable URL of the current map state with selected datasets. It can be accessed in the main menu. You may also have the option to generate a short link which greatly reduces the length of the link. Once you highlight the link copy it as you normally would copy text (right click -> copy or Ctrl+C)


# Layers

The Layer dropdown serves as a map legend and lists the layers available to display in the map.

![](layer/layer.png) Access the layer list by clicking on the layer button in the top, left of center portion of the viewer.

Each layer has some symbology associated with it. For simple feature layers a single icon will be present next to the layer name. For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack that can be toggled open and closed which is expanded beneath the layer name. WMS layers may optionally have a graphical legend defined, if one is present it will be displayed in the same drop down manner.

Some layers may only be visible at certain zoom levels. If a layer is not visible at a given zoom level the legend will display an icon (![](layer/scale.png)). Further, a zoom to the nearest valid level button will be displayed (![](layer/zoom.png)).

You can toggle the visibility of the layer at any time by selecting the eye icon (![](layer/eye.png)) next to each layer.

There are five types of layers that can reside in the Legend dropdown:

|Layer Type|Interactive|Server Renders|Datatable support|Notes|
|----|----|----|----|----|
| Feature | Yes | No | Yes | Fast, efficient - local rendering for small to medium size geometry sets |
| Dynamic | Yes | Yes | Yes | Good choice for large, complex geometry that would be slow to render locally |
| Image | No | Yes | No | Raster and image file support |
| Tile | No | Yes | No | Fast, efficient - server contains pre-rendered map tiles |
| WMS | Yes | Yes | No | Georeferenced map images which server generates using data from a GIS database |

Note that if a layer fails to load correctly it will be identified by an error notice. Instead of the standard layer actions you can select to either reload the layer (this is particularly helpful if there is a temporary network connectivity issue) or remove the layer. If a layer is removed it will be taken out of the layer selector completely and if it is added back via "Undo" it will lose any previous customizations.


# Layer Settings

While hovering over a layer or tabbing to one, select the three dots icon ![](layer_settings/ellipses.png) to make the settings menu appear.

Note that some settings may not be available depending on various factors such as layer type or configuration.

|Symbol|Name|Description|
|----|----|----|
| ![](layer_settings/metadata.png) | Metadata | Display relevant metadata in a slideout panel |
| ![](layer_settings/settings.png) | Settings | Opens slideout panel where opacity amount, bounding box visibility, and queryable data can be toggled |
| ![](layer_settings/datatable.png) | Datatable | Select to view data in table format |
| ![](layer_settings/layer.png) | Show legend | Expands/Collapses the legend image stack  |
| ![](layer_settings/zoomto.png) | Zoom to layer boundary | Pans and zooms the map so that the layer boundary is in view |
| ![](layer_settings/reload.png) | Reload | Reloads the layer |
| ![](layer_settings/remove.png) | Remove | Remove the layer from the map and legend |


# Layer Submenu

![](layer_submenu/menu.png)

Provides additional layer options when the layer panel is open. It is shown in red above. It has the following features:

|Symbol|Name|Description|
|----|----|----|
| ![](layer_submenu/add.png) | Add Layer | Menu options to add a file or service based layer |
| ![](layer_submenu/reorder.png) | Reorder Layers | Provides an alternative to the click-hold and drag reordering already available. When selected, layers are only reorderable by holding onto the handle icon next to each layer. Most useful for touch devices |
| ![](layer_submenu/expand.png) | Toggle Groups | Opens or closes all groups |
| ![](layer_submenu/view.png) | Toggle Visibility | Enables or disables the visibility for all layers  |


# Add Layer

Additional layers can be added to the map viewer. Supported formats include: ESRI Feature Layer, ESRI Dynamic Layer, ESRI Tile Layer, ESRI Image Layer, OGC Web Map Service, or a Raster Layer. The '+' button at the top of the Legend menu will launch the Add Layers menu.

Usage:
- Select the 'Import File' or 'Import Service' option.
- When 'Import File' is selected, click on the 'choose a file' button and select your local file, or you can provide a url to the file.
- When 'Import Service' is selected you'll be given the option to enter the service URL.
- Click the 'Continue' button to proceed.
- The Viewer will try to predict the dataset type. If it is incorrect, select the option from the dropdown with the correct type.
- Click the 'Continue' button to proceed.
- Depending on the type of dataset being loaded, various parameters can be set in this final phase.
- A Feature Service allows the choice of a Primary Attribute, which determines the attribute used to identify a feature in the data table panel and map tips. All other information is derived from the service's metadata.
- A WMS Service allows the choice of the Layer Name, which determines the layer in the WMS to be used as the source for the dataset. All other information is derived from the service's metadata.
- File based datasets allow the choice of the following: a Dataset Name, which will be displayed in the Layer Selector; a Primary Attribute, which acts the same as in the Feature Service; a Symbol Colour, which determines the colour of the points / lines / polygons on the map. CSV files also allow the specification of the columns that contain the Latitude and Longitude values, used to derive the point location on the map.
- Click the 'Continue' button to insert the layer into the map and closes the Add Layer menu.


# Export Image

You can export an image of the map and its visible layers along with; a legend, title, north arrow with scalebar, custom footnote, and a timestamp.

Select the 'EXPORT' button from the main menu to get started. A dialog will appear with an image of the map, and an option to enter a map title if desired.

If you'd like to add or remove sections of the exported image such as a legend, click on the options cogwheel in the header. There you'll be able to select/deselect the sections to appear in the exported image.

If you'd like to change the map canvas size you can do so from the dropdown in the header. Select from default to a preset small/medium size, or specify your own size by choosing the 'custom size' option. Note that sizes only affect the map image, the actual exported image may be larger.

Click on the download button in the header to get the final generated map image.


# Data Table Panel

![](datatable/overview.png)

The data table panel is shown above with its menu options open. You can scroll through all the data as well as:
- increase/decrease the size of the table (via split view/maximize options)
- sort the data by selecting the column header
- filter the data such that only data in your current extent is shown
- export the data as a csv file
- print the data

You can also open a corresponding details panel for an given row by selecting the ![](datatable/details.png) details icon. You can also pan and zoom the map to a given row by selecting the ![](datatable/zoomto.png) zoom icon.


# Feature Details Panel

Displays the data associated with a selected feature. This can be accessed by either performing an identify query on the map and selecting the layer from the list of available layers, or by clicking on the details icon in a data table.


# Accessibility

This page is WCAG 2.0 AA compliant.

Keyboard Accessibility - Keyboard functionality is provided as an alternative for users who are unable to use a mouse. Use the Tab key to navigate forward to links and controls on the page. Press Shift+Tab to go back one step. Use the Enter or Spacebar keys to activate links and controls.


# Load Times / Unanticipated Behaviour

Load times may vary based on:
- network location
- bandwidth availability
- number of layers being loaded
- Layer types and their sizes

Unanticipated behaviour may occur if any map interactions occur before data is fully loaded. Please allow the webpage to load completely before triggering any map functions.

**Note:** If the scrolling loading line indicator appears at the bottom of the map or in the legend, or the data table panel displays a loading message, please allow the loading indicator to disappear before triggering any function on the map.
