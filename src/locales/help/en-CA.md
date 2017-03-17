# Navigation Controls

Navigation controls are used for changing the viewing extent of the map.

Usage:

Click and drag to move the map in a particular direction.

- Zoom In/Out: Click 'Zoom In/Out' to change the map extent
- Canada: Click 'Canada' to view map at its full extent


# Basemaps

The Basemap selector is used to modify the underlying basemap to provide a variety of geographical contexts.

Usage:

BASEMAP: Click BASEMAP. From the slideout menu, select the basemap of your choice and the map display will update. Click on the double arrow to close the slideout menu.


# Overview Map

The Overview map displays a generalised view of the main map at a smaller scale.

Usage:

Drag to change the map extent of the main map.

- Hide/Show: Click 'Hide/Show' to close or open the overview map window


# Main Menu

The main menu displays general usage options.

Usage:

- Menu: Click 'Menu' to display the slideout menu. Click anywhere outside the slideout menu to close it.


# Full Screen

Full screen presents map content using the entire page. Full screen option is only available when the map is embedded into another page.

Usage:

FULL SCREEN: Click the FULL SCREEN option in the Menu slideout to make the map content use the entire page. Click the FULL SCREEN option again to restore to default view.


# Share

Share is used to generate a shareable URL of the current map state with selected datasets.

Usage:
SHARE: Click the SHARE option [add missing function and help text]


# Help

Help is used to display this help text.

Usage:

HELP: Click the HELP option to open a windows and view this help text


# Layers

The Layer dropdown serves as a map legend and lists the layers available to display in the map. Feature layers also display in the data table panel. There are three types of layers that can reside in the Legend dropdown:

- Feature layers represent data that can be interacted with on the map, and viewed in the data table panel.
- Dynamic layers represent interactive data on the map that cannot be cached, but have to be fetched from the server each time the map is changed. They can be a collection of feature layers and can be viewed in the data table panel.
- Image Service layers displays imagery and other types of raster data provided by an ArcGIS Server Image Service. They are not interactive and do not show in the data table panel.
- Tile layers displays map content from an ArcGIS Server Map service that has been cached (tiled). A cached map service contains pre-generated map tiles. They are not interactive and do not show in the data table panel.
- WMS layers provide an overlay of data from a Web Map Service. They can support a click interaction on the map, but do not show in the data table panel.


# Layer Visibility

- Hide/Show: Select the ""eye"" icon next to a dataset or group name to toggle the layer display on or off on the map.


# Layer Legends

Each layer has some symbology associated with it. For simple feature layers a single icon will be present next to the layer name. For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack and maybe toggled on and off. When toggled on a section will expand beneath the layer name and show the full symbology for the layer. WMS layers may optionally have a graphical legend defined, if one is present it will be displayed in the same drop down manner.


# Handling Layer Errors

If a layer fails to load correctly it will be identified by an error notice. Instead of the standard layer actions you can select to either reload the layer (this is particularly helpful if there is a temporary network connectivity issue) or remove the layer. If a layer is removed it will be taken out of the layer selector completely and if it is added back via ""Undo"" or ""Add Dataset"" it will lose any previous customizations.


# Geolocation

Click to zoom to the current geographical location of the user.


# Layer Settings

Hover over a layer name and click the ""three dots"" icon link to access additional options for the layer.

'Metadata'
In the additional options, if it is available for that layer, select the ""Metadata"" link to display relevant metadata for that source in a slideout panel.

'Settings'
- The layer's opacity can be adjusted using the Opacity slider control.
- If the layer has a bounding box, its visibility can be toggled using the Bounding Box toggle.

'Datatable'
- Select to view this layers data in table format.

'Show Legend'
- Expands/Collapses the legend image stack

'Zoom to Layer Boundary'
- Pans and zooms the map so that the layer boundary is in view.

'Reload'
- Reloads the layer

'Remove'
- Remove the layer from the map and legend.


# Export Image

You can export an image of the map and its visible layers along with; a legend, title, north arrow with scalebar, custom footnote, and a timestamp.

Select the 'EXPORT' button from the left side menu to get started. A dialog will appear with an image of the map, and an option to enter a map title if desired.

If you'd like to add or remove sections of the exported image such as a legend, click on the options cogwheel in the header. There you'll be able to select/deselect the sections to appear in the exported image.

If you'd like to change the map canvas size you can do so from the dropdown in the header. Select from default to a preset small/medium size, or specify your own size by choosing the 'custom size' option. Note that sizes only affect the map image, the actual exported image may be larger.

Click on the download button in the header to get the final generated map image.


# Zoom Scale Dependent Layers

Some layers may only be visible at certain zoom levels. If a layer is not visible at a given zoom level the legend will display a notice and have an action available to zoom to the closest zoom level at which the layer will be visible (this may involve either zooming in or zooming out).


# Add Layers

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


# Data Table Panel

The Data Table Panel lists detailed information about all the selected features in the map.

You can view, sort, print, and save the data and zoom the map to a specific entry listed in the data table.

You can also minimize, maximize, or split the panel view.


# Information Panel (Point)

The Information Panel (Point) displays data associated with a selected feature.

Usage:

Select a feature on the map interface. The Info Panel will display information related to the selected feature. Clicking the 'X' in the top right corner of the panel will hide panel.


# Accessibility

This page is WCAG 2.0 AA compliant.

Keyboard Accessibility - Keyboard functionality is provided as an alternative for users who are unable to use a mouse. Use the Tab key to navigate forward to links and controls on the page. Press Shift+Tab to go back one step. Use the Enter or Spacebar keys to activate links and controls.


# Load Times / Unanticipated Behaviour

Load times may vary based on network location and bandwidth availability, and unanticipated behaviour may occur if any map interactions occur before data is fully loaded. Please allow the webpage to load completely before triggering any map functions.

Note: If the scrolling loading line indicator appears at the bottom of the map or in the legend, or the data table panel displays a loading message, please allow the loading indicator to disappear before triggering any function on the map.
