The UI module is where most of the viewers visible elements can be found. Use the table below to scroll to the appropriate sub-module. Each sub-module includes a screenshot of where to visually find it on the map, as well as what should or shouldn't go into that sub-module.

| Submodule Names   |         |          |
|-------------------|---------|----------|
| [appbar](#appbar) | [basemap](#basemap) | [common](#common) |
| [details](#details)           | [export](#export)  | [filters](#filters)  |
| [help](#help)              | [loader](#loader)  | [mapnav](#mapnav)|
| [metadata](#metadata)          | [panels](#panels)  | [settings](#settings) |
| [sidenav](#sidenav)           | [toc](#toc)     | [toolbox](#toolbox)  |
| [tooltip](#tooltip)           |         |          |

# Appbar
![](./images/modules/appbar.png)

Contains the functionality of the top left navigation bar as shown above. This includes the functionality for displaying:
- Layer List
- Left side menu
- Basemap selector
- Context aware secondary menu (second line only visible when layer list is open)

Only content that appears in either the main navigation bar or the secondary context aware bar should be added here. The actual implementation of features that appear in the appbar (like basemaps or importing layers) should not go here, see their respective sections below.

# Basemap
![](./images/modules/basemap.png)

The basemap selector panel can be accessed by clicking on the icon in the [appbar](#appbar) (only visible when the layer list is open). 

Code in this sub-module should remain focused on generating a list of available basemaps (from the config), tracking the currently selected basemap, rendering the slide out menu panel, and rendering individual basemap options and their descriptions. You should not put basemap switching logic in here, this belongs in the GEO module.

# Common
Home to any directive or service which can be used by other sub-modules for ui related purposes. In general, if some functionality is UI related and can be shared by more than one sub-module, it should go here. Below is a general list of some commonly used directives and services:

| File Name         | Description |
|-------------------|-----------|
| truncate.directive.js | Shortens the contents to a set limit as defined by the `maxTextLength` property. If the maxTextLength is reached mid-word, the entire word is truncated instead.     |
| morph.directive.js | Animates the given HTML element from one CSS class to another provided to the `rvMorph` attribute. The element is morphed by using GSAP animation library. |
| dragula.directive.js| Used in the layer list to handle drag-and-drop functionality|
| stepper | Step implementation for forms (used in import service/file) based on the Material Design stepper component |

# Details

![](./images/modules/details-slider.png)

![](./images/modules/details-popup.png)

Some notable directives and services in this sub-module include:

| File Name         | Description |
|-------------------|-----------|
| detail.service.js | Allows for the display of a popup box containing detailed information on a point, as well as logic for closing the details view panel|
| details.directive.js | Handles the detail view logic including the selecting of a layer and its display |
| details-content.directives.js | Responsible for displaying layer data |
| details-header.directive.js | Handles the logic for closing and expanding/collapsing the datatable |
| details-record-esrifeature.directive.js | Renders a single identify result from an esri feature (and dynamic) layers |
| layer-list-slider.directive.js | Handles the in/out sliding of the details panel. The panel slides open when either any point layer is focused or on mouseover. It closes when no point layers have focus, no mouseover, or the user clicked on a point layer. |

# Export

![](./images/modules/export.png)

Allows the map to be exported in image format. This includes functionality for rendering the map, layer list, scale bar, and north arrow. 

# Filters

![](./images/modules/filters.png)

Also known as **DataTables**, this section is responsible for rendering the table data. This also includes:
- Filtering by extent
- Maximizing/minimizing the tables size
- Printing the table
- Exporting the table as a CSV file

This is what the menu looks like:

![](./images/modules/filters-options.png)

The `filters-default.directive.js` file handles the creation of the DataTable instance. The `filters.service.js` file handles filtering by extent.

# Help

![](./images/modules/help.png)

Relates to anything in the help dialog popup including its display and search capabilities. Please note that there are remnants of an overlay help system that are not yet implemented. 

# Loader

![](./images/modules/loader.png)

This includes importing a file or a service as implemented in `loader-file.directive.js` and `loader-service.directive.js` respectively.

# Mapnav

![](./images/modules/mapnav.png)

Found in the lower right corner of the map, these buttons perform actions to the map including zooming in/out, geolocation, re-centering map over Canada, and activating the help popup.

`mapnav.service.js` defines these buttons including their icons and actions to perform when clicked. You should avoid implementation logic for button actions, deferring this task out to the appropriate directives and services in other modules.

# Metadata

![](./images/modules/metadata.png)

Secondary panel to the right of the layer list. Only available for layers with metadata support. Also includes the metadata popup panel:

![](./images/modules/metadata-popup.png)

# Panels

There are three panels in the viewer:
- 'main' panel which is used for the layer list, layer details view, and import functionality
- 'side' panel which is used for settings and metadata
- 'filters' panel for the DataTable

While this sub-module is not meant for any particular content implementation, it handles the panels headers like the close and expand buttons as well as their animations from open to close. 

# Settings

![](./images/modules/settings.png)

`settings.directive.js` contains the logic of changing various layer settings such as opacity and bounding box visibility. This module should only define the various option types, deferring implementation to more specific modules. For example, this sub-module does not draw the bounding box, it merely calls the appropriate `geoService.setBboxState` method.

Note that this section should not contain any viewer settings (as found in the left sliding panel). The next section covers this.

# Sidenav

![](./images/modules/sidenav-open.png)

![](./images/modules/sidenav.png)

This is where you'll find various application settings such as the language selector, full screen toggle, export image, share link among others. This panel should not implement any of these features, it should instead link to the functionality better suited in a more specific module.

# TOC

Also known as "Table of Contents", "Legend", or more recently "Layer List". 

![](./images/modules/toc.png)

| File Name         | Description |
|-------------------|-----------|
| entry.directive.js | Handles the rendering of the individual layers or groupings. This directive uses either the `layer-entry.html`, `group-entry.html`, or `placeholder-entry.html` templates depending on it's type. |
| entry-control.directive.js | Each layer has menu options accessible via the triple ellipses. These options are defined here. |
| entry-flag.directive.js | Each layer can have zero or more flags giving visual cues as to the state of the layer. These can include if a layer is hidden or out of scale with the map. |
| entry-symbology.directive.js | Handles the symbology stack including the opening and closing animations |
| toc.directive.js | Mostly involved with the implementation of `Dragula`, a drag and drop library used for reordering layers and groups |
| toc.service.js | Responsible for implementing most functionality such as toggling visibility, zooming to layer scale, and removing layers. |

# Toolbox

Not currently used and may be removed.

# Tooltip

![](./images/modules/tooltip.png)

Handles the creating and positioning of maptips, and anchors.
