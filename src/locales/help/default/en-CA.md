# Navigation Controls

Navigation controls are used for changing the viewing extent of the map.

The following navigation controls can be found in the bottom right corner of the map:

|Symbol|Name|Key Binding|Description|
|----|----|----|----|
|![](navigation/fullscreen.png)| Fullscreen | | Full screen presents map content using the entire page. Full screen option is only available when the map is embedded into another page  |
|![](navigation/zoomin.png)| Zoom in | Plus (+) | Zoom in one level on the map to see more detailed content |
|![](navigation/zoomout.png)| Zoom out | Minus (-) | Zoom out one level on the map to see less detailed content  |
|![](navigation/geolocation.png)| Geolocation | | Zoom and pan to your current geographical location |
|![](navigation/canada.png)| Initial extent | | Zoom and pan map such that initial extent is visible |
|![](navigation/help.png)| Help | | Open the help dialog |

You can also pan the map by using your left, right, up and down arrow keys, or by click-holding on the map and dragging. Using the mouse scroll wheel while hovering over the map will zoom the map in/out.

Note that the map __must be__ focused for key binding to work. The map has focus when there is a blue border around it.


# Navigation Information

The navigation information is located in the lower right corner of the map and includes map scale and mouse cursor positioning coordinates.
The positioning coordinates can be in degrees minutes seconds (DMS), decimal degrees or meters depending on the projection and configuration used.


# Basemap Selector

The basemap selector modifies the underlying basemap to provide a variety of geographical contexts.

__To open the basemap selector:__

![](basemap/open.png)

First open the layers panel by selecting the layer button (shown above in red). You will then see the basemap selector appear to the left of the layer button (shown above in blue). You can also open the basemap selector from within the main menu.

You'll be presented with one or more basemaps to choose from, separated by their projection types (mercator vs lambert). The map will reload if you change projections, but won't if you switch basemaps within the same projection.


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
| ![](menu/about.png) | About Map | Opens a dialog window that provides additional information on the map  |
| ![](menu/help.png) | Help | Opens the help dialog |
| ![](menu/language.png) | Language | Displays a list of supported languages you can switch to |


# Share

Share is used to generate a shareable URL of the current map state with selected datasets. It can be accessed in the main menu. If a Google API Key is configured for the map, you will also have the option to generate a short link. Once you highlight the link, copy it as you normally would copy text (right click -> copy or Ctrl+C)


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
| ![](layer_settings/settings.png) | Settings | Opens slideout panel where bounding box and queryable data can be toggled as well as the ability to adjust opacity amount |
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

![](datatable/overview_en.png)

The panel __Data Table__ is shown above in its initial state.

In addition to scrolling data, it is possible to:
- Sort the data by selecting the header of the column
- Open the detail panel corresponding to a given line by selecting the Details icon ![](datatable/details.png)
- Move the map and zoom the item corresponding to a given line by selecting the Zoom Icon ![](datatable/zoomto.png)
- Move the columns by clicking on the header when the cursor icon becomes a hand and moving it around the sorting icons of the place where it should move
- Filter the columns by numerical range, text, selection or date (if the configuration allows it)

If the number of characters entered exceeds the width of the text box, only the visible characters will be displayed, followed by ellipses (...). By selecting the field with the mouse or the keyboard, the full text will be displayed in a tooltip.

The number of entities in the layer is displayed in the lower left corner: Showing 1 to 4 of 247 entries.

By starting the filtering of the data, more feedback is obtained: Showing 1 to 4 of 15 entries (filtered from 247 total entries).

### Filter Control Group

![](datatable/apply_en.png)

This control group is located in the lower right corner and allows you to do the following:
- Apply data table filters
    - If the layer type allows it, when modifying the filters, __APPLY TO MAP__ will appear. After pressing this button, the map is refreshed and only the visible data of your table is displayed.
- Clear all filters ![](datatable/clear.png)
- Depending on the configuration, some filters may not be editable (see section __Filter Data__ for more information)
- Open the filter control panel ![](datatable/setting.png)

### Filter data

Data can be filtered by column. A column is searchable if there is an input field under the title of the header. As mentioned previously, there are 4 types of filters:
- __Text__: Character input field. Use the wildcard character \* to replace a sequence of zero or more characters (e.g. _* levo_ will find Charlevoix)
    - _Note, without a generic character, the search will find only the elements where the word searched begins the sentence._
- __Number__: Input fields that accept only numbers
    - If a minimum and a maximum are defined the filter will search for a range
    - If, for example, only a minimum is defined, it will perform the operation _greater than_
- __Selection__: Drop-down menu which allows the selection of one or more predefined values
- __Date__: Similar to the numeric field but uses dates

Some filters are not editable; Their value can not be changed. They are represented by a dashed line below their value.

![](datatable/search_en.png)

This control, which is found in the upper right corner of the data table, allows to filter the data table globally.
- If you enter the _Brook_ value, the data table will select the data that contains _Brook_ at any location (e.g ._Corner Brook_ will be selected)

When the input field is selected, the column names may change because they reflect the internal names of the data. These names allow you to do specific searches, for example:
- Search text: _name of field:value_ (e.g. Type:'my type')
- Search a number or date:
    - Simple value: _field name:[operator]value_ (eg OBJECTID:<30). The following operators can be used: <, <=,>,> =.
    - Range: _field name:[value..value]_ (e.g. OBJECTID:[30..50])
- You can also combine fields with _&&_ (e.g. Type:'my type' && OBJECTID:<30)

_Note: The filters defined by this control can not be applied to the map. They apply only to the data table._

### Configuration Panel

![](datatable/settingPanel_en.png)

In the configuration panel, if the configuration allows it , you can find a __Description__ section that contains information about the dataset and the different columns.
Changes made in the configuration panel are retained in the data table and vice versa.
Subsequently, the columns are found one after the other in the order in which the data table is displayed. For each column, the following actions can be carried out:
- Reorder: allows you to move the columns by pressing the icon and moving it
- Name: the name of the field
- Filter: the field filter (if present)
- Sort: allows you to sort data in ascending or descending order
- Display: allows you to see or hide a column. _Note: If a column contains a filter, the data will be filtered even if the column is not visible_

### Menu of options

![](datatable/menu_en.png)

The menu allows the following actions:
- Enlarge / reduce the size of the table (via shared view / enlarge)
- Filter data so that only data in the current spatial extent is displayed
- Show table column filters
- Export the data as a .csv file
- Print the data


# Feature Details Panel

Displays the data associated with a selected feature. This can be accessed by either performing an identify query on the map and selecting the layer from the list of available layers, or by clicking on the details icon ![](datatable/details.png) in a data table.


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


# North Arrow

![](north_arrow/arrow.png)

The main map contains a north arrow. It can be found at the top of the map. It will move horizontally on the screen such that it always intersects with an imaginary straight line that passes over the center of the map and the north pole.
