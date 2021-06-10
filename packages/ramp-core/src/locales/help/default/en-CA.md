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

If you are panning the map using arrow keys, you can press SHIFT or CTRL to pan the map faster or slower (respectively).

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

You can toggle the visibility of the layer at any time by selecting the checkbox (![](layer/checkbox.png)) next to each layer.

There are five types of layers that can reside in the Legend dropdown:

|Layer Type|Interactive|Layer Format|Datatable support|Notes|
|----|----|----|----|----|
| Feature | Yes | Vector | Yes | Fast, efficient - local rendering for small to medium size geometry sets |
| Dynamic | Yes | Raster | Yes | Good choice for large, complex geometry that would be slow to render locally |
| Image | No | Raster | No | Raster and image file support |
| Tile | No | Raster | No | Fast, efficient - server contains pre-rendered map tiles |
| WMS | Yes | Raster | No | Georeferenced map images which server generates using data from a GIS database |
| WFS | Yes | Vector | Yes | Fast, efficient - local rendering for small to medium size geometry sets |

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
- If you wish to add a file, you can do so by dragging the file over the import wizard, by clicking on the `Choose a File` button and selecting the file, or by providing the URL to the file.
- If you wish to add a service, you can do so by entering the service URL into the text box.
- Click the 'Continue' button to proceed.
- Select the option from the dropdown menu with the correct file or service type. If the wrong type is selected, an error will be displayed prompting you to try a different type.
- Click the 'Continue' button to proceed.
- Depending on the type of dataset being loaded, various parameters can be set in this final phase.
- A Feature Service allows the choice of a Primary Attribute, which determines the attribute used to identify a feature in the data table panel and map tips. All other information is derived from the service's metadata.
- A WMS Service allows the choice of the Layer Name, which determines the layer in the WMS to be used as the source for the dataset. All other information is derived from the service's metadata.
- A WFS Service allows the choice of the following: a Layer Name, which will be displayed in the Layer Selector; a Primary Field, which acts the same as a Feature Service's Primary Attribute; a Colour, which determines the colour of the points / lines / polygons on the map. All other information is derived from the service's metadata.
- File based datasets allow the choice of the following: a Dataset Name, which will be displayed in the Layer Selector; a Primary Attribute, which acts the same as in the Feature Service; a Symbol Colour, which determines the colour of the points / lines / polygons on the map. CSV files also allow the specification of the columns that contain the Latitude and Longitude values, used to derive the point location on the map.
- Click the 'Continue' button to insert the layer into the map and closes the Add Layer menu.


# Export Image

You can export an image of the map and its visible layers along with; a legend, title, north arrow with scalebar, custom footnote<sup>*</sup>, and a timestamp<sup>†</sup>.

Select the 'EXPORT' button from the main menu to get started. A dialog will appear with an image of the map, and an option to enter a map title if desired.

If you'd like to add or remove sections of the exported image such as a legend, click on the options cogwheel in the header. There you'll be able to select/deselect the sections to appear in the exported image.

If you'd like to change the map canvas size you can do so from the dropdown in the header. Select from default to a preset small/medium size, or specify your own size by choosing the 'custom size' option. Note that sizes only affect the map image, the actual exported image may be larger.

Click on the download button in the header to get the final generated map image.

<sup>*</sup>Please note that the footnote may not be available depending on the map. <br/>
<sup>†</sup>Please note timestamp is optional and may not be available depending on the map


# Data Table Panel

![](datatable/overview_en.png)

The __Data Table__ panel is shown above in its initial state.

In addition to scrolling data, it is possible to:
- Sort the data by clicking the header of the column. Multiple columns can be sorted by holding down shift before clicking a column header
- Open the detail panel corresponding to a given row by selecting the *Details* icon (![](datatable/details.png))
- Position the map view to the location of the feature corresponding to a given row by selecting the *Zoom To Feature* icon (![](datatable/zoomto.png))
- Move the columns by clicking beside the column title to shift it left or right (![](datatable/reorder.png))
- Filter the columns by numerical range, text, selection or date (if the configuration allows it). Changes in the table can also be made to reflect on the map by applying or clearing filters from map (*apply*: ![](datatable/apply.png), *clear*: ![](datatable/clear.png))
- Show and/or hide columns by clicking on the *Hide Columns* icon (![](datatable/hideColumns.png))
- Navigate the table using a keyboard

If the number of characters entered exceeds the width of the text box, only the visible characters will be displayed, followed by ellipses (...). By selecting the field with the mouse or the keyboard and hovering over it, the full text will be displayed in a tooltip.

The number of features in the layer is displayed in the top left corner below the layer title:

![](datatable/allEntries_en.png)

Filtering the data results in more feedback:

![](datatable/filteredEntries_en.png)

### Table Controls

![](datatable/tableControls_en.png)

This control group is located in the upper right-hand corner of the data table and has the following options:
- Global Search
    - filter the table by making sure that the search term is a substring of the rows' data at one or more columns
- Clear Column Filters
    - clear any existing filters that may be applied to the table
    - if no filters are applied to the table, this button will be disabled
- Apply Table Filters To Map
    - update the map to display only the data that is visible in the table
    - if the data in the table already matches the data displayed on the map, this button will be disabled
- Toggle Column Visibilities
    - allows you to choose which columns you want to be visible on the table
- Table Menu (More Options)

    ![](datatable/menu_en.png)

    - Split View
        - table occupies the upper half of the map area
        - not available in mobile view because table will take up whole height and width of the map by default
    - Maximize
        - table occupies all of the map area
        - not available in mobile view because table will take up whole height and width of the map by default
    - Filter by extent
        - table automatically updates on map extent change to display only layer features within the current extent
    - Show filters
        - toggling this option off will hide all column filters
            - unable to change column filters while toggled off
            - column filters remain applied even when toggled off
    - Print (disabled by default)
        - takes the user to a printer friendly page displaying table data
    - Export
        - exports table data to CSV
        - may not work as intended on mobile due to limitations with downloading files
- Close Table
    - closes the table

### Sorting and Reordering

For each column in the data table, there may be a set of arrows associated with that column which represents how it can be sorted and reordered.

__Column Sort__: Click on the column title to sort the columns in ascending/descending order (for numerical data) and alphabetical order (for text data).
- an upward arrow (![](datatable/sortAsc.png)) next to the column title indicates that the column data is being sorted in ascending order or alphabetical order
- a downward arrow (![](datatable/sortDesc.png)) next to the column title indicates that the column data is being sorted in descending order or reverse alphabetical order
- no arrow next to the column title means that there is no sort applied to current column
- sort multiple columns at once using shift + select column names
    - how it works: the next selected column using tab will be sorted according to the last selected column's groups of identical data

__Column Reorder__: The two right/left arrows next to the column name are for reordering the columns.
- click the right arrow (![](datatable/rightReorderArrow.png)) to swap a column with the one on the right
    - the right arrow is disabled for the rightmost column of a data table
- click the left arrow (![](datatable/leftReorderArrow.png)) to swap a column with the one on the left
    - the left arrow is disabled for the leftmost column of a data table

### Filter data

Data can be filtered by column. A column is searchable if there is an input field under the title of the header. As mentioned previously, there are 4 types of filters:
- __Text__: Character input field. Use the wildcard character (\*) to replace a sequence of zero or more characters (e.g. _* levo_ will find Charlevoix)
    - _Note, without a generic character, the search will find only the elements where the word searched begins the sentence._
- __Number__: Input fields that accept only numbers
    - If a minimum and a maximum are defined the filter will search for a range
    - If, for example, only a minimum is defined, it will perform the operation _greater than_
- __Selection__: Drop-down menu which allows the selection of one or more predefined values
- __Date__: Similar to the numeric field but uses dates

Some filters are not editable; Their value can not be changed. They are represented by a dashed line below their value.

![](datatable/search_en.png)

This control, which is found in the upper right corner of the data table, allows to filter the data table globally.
- If you enter the _Brook_ value, the data table will select the data that contains _Brook_ at any location (e.g. _Corner Brook_ will be selected)

### Keyboard Navigation

Use `Tab` to go through each of the table controls, and to navigate between the three major table groups:
- Column Headers
- Column Filters
- Table Body

Once any major group is focused on, you can use the arrow keys to navigate through the table cells for that component. Doing this will highlight the currently focused table cell.

To access the buttons and/or input fields within a cell, make sure the cell is highlighted (by using arrow keys as above) and use `Tab` to navigate between its children.


# Feature Details Panel

Displays the data associated with a selected feature. This can be accessed by either performing an identify query on the map and selecting the layer from the list of available layers, or by clicking on the details icon ![](datatable/details.png) in a data table.


# Accessibility

This page is WCAG 2.0 AA compliant.

#### Keyboard Navigation

Keyboard functionality is provided as an alternative for users who are unable to use a mouse. Use the Tab key to navigate forward to links and controls on the page. Press Shift+Tab to go back one step. Use the Enter or Spacebar keys to activate links and controls.

When the map gains focus, a crosshairs marker is displayed in the center of the map. Use the __arrow__ keys to move the map and __+__ / __-__ keys to zoom in and out. Press __Enter__ to select a feature under the crosshairs and display associated data in the Details panel.

![](accessibility/crosshairs.png)

Tooltips will be shown for supported features when the crosshairs marker is positioned over them.

![](accessibility/crosshairs_tooltip.png)


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


# Geolocation Search

### General Use
The geosearch component functions to allow users to search for places in Canada. When the geosearch icon is clicked, the main application bar is replaced with an input field for search keywords:

![](geosearch/searchbar_en.png)

#### Supported Search Types

__Keyword search__: Type any keyword into geosearch to display a list of results that contains the keyword.
- each search result consists of: location name (with keyword highlighted), location province, and location type (lake, city, town, etc.)
- click on any individual result to mark its coordinates and zoom the map to center around this location

__FSA search__: A __forward sortation area (FSA)__ is a way to designate a geographical area based on the first three characters in a Canadian postal code. All postal codes that start with the same three characters are considered an __FSA__.
- a search using FSA will display a list of results in the vicinity of that area
- the very first result is a location of the FSA itself, click to zoom and center the map on the FSA
- example: type in __M3H__

__Latitude/Longitude search__: Search using lat/long coordinates to display a list of results in the vicinity of that map point.
- similarly to FSA search, the first result will be a location of those coordinates entered, click this to zoom and center the map on the map point
- lat/long search recognizes spaces, commas, semicolons, or vertical bars (|) to separate the co-ordinates
- example: type in __54.3733,-91.7417__

__NTS search__: __National Topographic System (NTS)__ is a system used for providing general topographic maps of the country, producing details on landforms, lakes/rivers, forests, roads and railways, etc.
- the NTS is split into three major zones: "Southern zone" - latitudes between 40°N and 68°N, "Arctic zone" - latitudes between 68°N and 80°N, and the "High Arctic zone" - latitudes between 80°N and 88°N
- an NTS map number consists of a string containing a number identifying a map sheet, a letter identifying a map area, and a number identifying the scale map sheet
- likewise, the first result will be a location of the NTS map number, click to center map on this area
- example: type in __030M13__

#### Unsupported Search Types

__Street address__: Search using direct street addresses is not supported by geosearch.
- entering any valid street address should not return any results

### Geosearch Filtering
When searching for a location, a results panel will appear below the search box. This results panel contains two dropdown boxes that allow you to filter the search results by their __province__ and by their __type__ (lake, town, river, etc.). To the right of these two boxes is a __Clear Filters__ ![](datatable/clear.png) button, which when clicked clears the selected filter options.

![](geosearch/geofilter_en.png)

At the bottom of the results panel, there is a checkbox labeled __visible on map__. Checking this box will further filter the results to only show locations that are currently visible on the map. Moving the map around or zooming in/out with this box selected will automatically update the results to display locations that are on the map.

![](geosearch/visiblemap_en.png)