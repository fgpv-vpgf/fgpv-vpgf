# UI Overview and Terminology

This document describes UI components and elements used in RAMP applications, their general uses, and some specific of their functionality when it affects the UI of the application. For a more in-depth explanation of functionality, please see the technical documentation.

**Table of content:**

- [1. Overview](#1-overview)
- [2. Map](#2-map)
  * [2.1. Main application bar](#21-main-application-bar)
  * [2.2. North indicator](#22-north-indicator)
  * [2.3. Overview map](#23-overview-map)
  * [2.4. Feature tooltip](#24-feature-tooltip)
  * [2.5. Map navigation cluster](#25-map-navigation-cluster)
  * [2.6. Basemap attribution and logo](#26-basemap-attribution-and-logo)
  * [2.7. Scalebar and mouse coordinates](#27-scalebar-and-mouse-coordinates)
- [3. Side menu](#3-side-menu)
  * [3.1. Application logo](#31-application-logo)
  * [3.2. Application title](#32-application-title)
  * [3.3. Layers panel](#33-layers-panel)
  * [3.4. Basemap selector](#34-basemap-selector)
    + [3.4.1. Projection name](#341-projection-name)
    + [3.4.2. Basemap selection](#342-basemap-selection)
    + [3.4.3. Basemap preview](#343-basemap-preview)
    + [3.4.4. Basemap name](#344-basemap-name)
    + [3.4.5. Basemap description toggle](#345-basemap-description-toggle)
    + [3.4.6. Basemap description](#346-basemap-description)
  * [3.5. Geo search](#35-geo-search)
  * [3.6. Full screen toggle](#36-full-screen-toggle)
  * [3.7. Export dialog](#37-export-dialog)
    + [3.7.1 Export settings toggle](#371-export-settings-toggle)
    + [3.7.2 Export file name](#372-export-file-name)
    + [3.7.3 Close button](#373-close-button)
    + [3.7.4 Download button](#374-download-button)
    + [3.7.5 Map export image](#375-map-export-image)
    + [3.7.6 Map scale](#376-map-scale)
    + [3.7.7 North arrow](#377-north-arrow)
    + [3.7.8 Map export legend](#378-map-export-legend)
    + [3.7.9 Export footer text](#379-export-footer-text)
    + [3.7.10 Export timestamp](#3710-export-timestamp)
  * [3.8. Share dialog](#38-share-dialog)
  * [3.9. Touch mode toggle](#39-touch-mode-toggle)
  * [3.10. Help information](#310-help-information)
    + [3.10.1 Help Search](#3101-help-search)
    + [3.10.2 Help topic](#3102-help-topic)
  * [3.11. About information](#311-about-information)
  * [3.12. Language selector](#312-language-selector)
  * [3.13. Plugin section](#313-plugin-section)
  * [3.14. Build information](#314-build-information)
    + [3.14.1 Version number + commit hash](#3141-version-number---commit-hash)
    + [3.14.2 Build date](#3142-build-date)
    + [3.14.3 Github repo link](#3143-github-repo-link)
- [4. Geo search](#4-geo-search)
  * [4.1 Keyword search](#41-keyword-search)
    + [4.1.1 Search filters](#411-search-filters)
    + [4.1.2 Clear search button](#412-clear-search-button)
    + [4.1.3 Search results](#413-search-results)
    + [4.1.4 Map extent filter](#414-map-extent-filter)
  * [4.2 FSA search](#42-fsa-search)
    + [4.2.1 Location zoom shortcut](#421-location-zoom-shortcut)
  * [4.3 Latitude / Longitude search](#43-latitude---longitude-search)
    + [4.3.1 Location zoom shortcut](#431-location-zoom-shortcut)
- [5. Layers panel](#5-layers-panel)
  * [5.1. Add layer (Layer Import Wizard)](#51-add-layer--layer-import-wizard-)
    + [5.1.1. Select the 'Import File' or 'Import Service' option through the Add layer menu](#511-select-the--import-file--or--import-service--option-through-the-add-layer-menu)
    + [5.1.2. Add your File/Service](#512-add-your-file-service)
    + [5.1.3. Select the correct dataset type](#513-select-the-correct-dataset-type)
    + [5.1.4. Configure your file type](#514-configure-your-file-type)
    + [5.1.5. Click the 'Continue' button to insert the layer into the map and closes the Add Layer menu.](#515-click-the--continue--button-to-insert-the-layer-into-the-map-and-closes-the-add-layer-menu)
  * [5.2. Group toggle menu](#52-group-toggle-menu)
  * [5.3. Visiblity toggle menu](#53-visiblity-toggle-menu)
  * [5.4. Layer Node](#54-layer-node)
    + [5.4.1 Scale-dependent layers](#541-scale-dependent-layers)
  * [5.5. Layer Group](#55-layer-group)
    + [5.5.1 Dynamic layer groups](#551-dynamic-layer-groups)
  * [5.6. Layer flags](#56-layer-flags)
  * [5.7. Layer symbology (single)](#57-layer-symbology--single-)
    + [5.7.1 Symbology stack toggle](#571-symbology-stack-toggle)
    + [5.7.2 Symbology stack](#572-symbology-stack)
      - [5.7.2.1 Icons](#5721-icons)
      - [5.7.2.2 Images](#5722-images)
  * [5.8. Visibility toggle](#58-visibility-toggle)
  * [5.9. Layer Node context menu](#59-layer-node-context-menu)
  * [5.10. Failed layer indicator](#510-failed-layer-indicator)
  * [5.11. Loading layer indicator](#511-loading-layer-indicator)
  * [5.12. Reload layer control](#512-reload-layer-control)
  * [5.13. Layer Group context menu](#513-layer-group-context-menu)
  * [5.14. Layer symbology (multiple)](#514-layer-symbology--multiple-)
    + [5.14.1 Interactivity](#5141-interactivity)
  * [5.15. Layer visibility set](#515-layer-visibility-set)
  * [5.16. Layer Info section](#516-layer-info-section)
  * [5.17. Layer reorder](#517-layer-reorder)
  * [5.18. Layer settings panel](#518-layer-settings-panel)
    + [5.18.1 Active layer indicator](#5181-active-layer-indicator)
    + [5.18.2 Visibility toggle](#5182-visibility-toggle)
    + [5.18.3 Opacity slider](#5183-opacity-slider)
    + [5.18.4 Bounding box toggle](#5184-bounding-box-toggle)
    + [5.18.5 Identify query toggle](#5185-identify-query-toggle)
    + [5.18.6 Snapshot mode toggle](#5186-snapshot-mode-toggle)
    + [5.18.7 Layer refresh interval](#5187-layer-refresh-interval)
    + [5.18.8 WMS Styles selector](#5188-wms-styles-selector)
    + [5.18.9 Layer reload control](#5189-layer-reload-control)
  * [5.19. Layer metadata panel](#519-layer-metadata-panel)
    + [5.19.1 Active layer indicator](#5191-active-layer-indicator)
    + [5.19.2 Layer Metadata](#5192-layer-metadata)
    + [5.19.3 Expand metadata toggle](#5193-expand-metadata-toggle)
- [6. Enhanced Table](#6-enhanced-table)
  * [6.1. Table Title](#61-table-title)
  * [6.2. Scroll  and Filter Status](#62-scroll--and-filter-status)
    + [Example 1:  `6 - 12 of 15 records shown`](#example-1----6---12-of-15-records-shown-)
    + [Example 2: `1 - 6 of 10 records shown (filtered from 15 records)`](#example-2---1---6-of-10-records-shown--filtered-from-15-records--)
  * [6.3. Details](#63-details)
  * [6.4. Zoom](#64-zoom)
  * [6.5. Column Filters](#65-column-filters)
    + [6.5.1. Text Filter](#651-text-filter)
    + [6.5.2. Number Filter](#652-number-filter)
    + [6.5.3. Date Filter](#653-date-filter)
    + [6.5.4. Selector Filter](#654-selector-filter)
  * [6.6. Table Controls](#66-table-controls)
    + [6.6.1. Global Search](#661-global-search)
    + [6.6.2. Toggle Column Visibilities](#662-toggle-column-visibilities)
    + [6.6.3. Clear Column Filters](#663-clear-column-filters)
    + [6.6.4. Apply Table Filters to Map](#664-apply-table-filters-to-map)
    + [6.6.5. Table Menu](#665-table-menu)
    + [6.6.6.  Close table](#666--close-table)
  * [6.7. Column Reorder](#67-column-reorder)
  * [6.8. Column Title](#68-column-title)
  * [6.9. Column Sort](#69-column-sort)
- [7. Details panel](#7-details-panel)
  * [7.1. Details panel toggle](#71-details-panel-toggle)
  * [7.2. Currently selected layer](#72-currently-selected-layer)
  * [7.3. Expand details toggle](#73-expand-details-toggle)
  * [7.4. Layer without identify results](#74-layer-without-identify-results)
  * [7.5. Zoom to feature button](#75-zoom-to-feature-button)
  * [7.6. Collapsed identify result](#76-collapsed-identify-result)
  * [7.8. Identify marker](#78-identify-marker)
  * [7.9 Identify mode](#79-identify-mode)
    + [7.9.1 Query](#791-query)
    + [7.9.2 Marker](#792-marker)
    + [7.9.3 Highlight](#793-highlight)
    + [7.9.4 Haze](#794-haze)
    + [7.9.5 Details](#795-details)

## 1. Overview

The default view of the application.

![](https://i.imgur.com/DQZ54q6.png)

## 2. Map

The core component of the application is the Map and it consists of the basemap, all the data rendered on top of the basemap, and a number of additional components and control clusters displayed on top of the data.

![](https://i.imgur.com/kxhpaWZ.png)

The Map itself acts at the outer container for the whole application where no part of the UI can be rendered beyond this boundary - the `Outer shell`. The host pages is responsible for deciding on the size of the application container and can constrain or modify it as will.

All the feature and components of the UI - excluding the map and visualized data - are rendered inside the `Inner shell`, a container located inside the `Outer shell`. The `Inner shell` can also be manipulated by the host page for the purposes of creating map which seem to extend beyond active area of the page to which all the functionality is confined. The earlier designs of the Climate Portal application made use of this feature.

![](https://i.imgur.com/8d19RnC.png)

### 2.1. Main application bar

The main application bar is used for accessing the [Side menu](#3-side-menu), [Basemap selector](#34-basemap-selector), [Layers panel](#5-layers-panel), and [Geo search](#4-geo-search). The [Layers](#5-layers-panel), [Details](#7-details-panel) and [Import wizard](#51-add-layer-layer-import-wizard) panels open underneath the Main application bar and the name of the currently open panel is displayed on the left side of the bar.

![](https://i.imgur.com/HUNIniX.png)

The default configuration of the Main application bar will display the [Side menu](#3-side-menu), [Geo search](#4-geo-search), and [Layers panel](#5-layers-panel) controls. 

![](https://i.imgur.com/0J0QXV3.png)

The [Basemap selector](#34-basemap-selector) control is shown only when the [Layers panel](#5-layers-panel) is expanded.

![](https://i.imgur.com/cM98JeT.png)

The [Side menu](#3-side-menu), [Geo search](#4-geo-search), and [Layers panel](#5-layers-panel) controls can be independently hidden. When only the Side menu control is shown, the Main application bar collapses to the left. The bar will expand if the user opens one of the main panels ([Layers](#5-layers-panel) or [Details](#7-details-panel)).

![](https://i.imgur.com/8EytaGY.png)

![](https://i.imgur.com/QQD5rW2.png)

![](https://i.imgur.com/tnYaQ7F.png)

![](https://i.imgur.com/8GLjL32.png)

if the Main application bar is fully hidden, the main panels open at the top of the viewer `Inner shell` container.

![](https://i.imgur.com/QCXl2YB.png)

### 2.2. North indicator

The North Indicator is an arrow image (![](https://i.imgur.com/EMCtOyw.png)) displayed at the edge of the viewport where it intersects an imaginary line from the center of the current extent to the geographic north pole. The indicator moves along the edges of the viewport as the map is panned and zoomed.

When the pole is inside the current extent, it's marked by a flag icon; the North indicator is hidden. The icon marking the north pole can be customized through the config.

In the Mercator projection, the North indicator sits motionless pointing straight up in the middle of the top edge of the viewport.

The purpose of the North indicator is easily learnable as it's clear that indicator movements and extent changes are connected. It's also possible to pan the map, following the indicator until the geographic pole is reached where the indicator transitions into the pole icon.

![](https://i.imgur.com/ItPRRGV.png)

### 2.3. Overview map

The overview map provides glanceable information on where the main map is situated. The Overview map can be collapsed by the user.

![](https://i.imgur.com/21TsgqS.png)

On narrow (mobile) layouts, the Overview map is completely removed, so not to take up valuable space. It can also be disabled through the config. 

### 2.4. Feature tooltip 

Features of the vector-based layers (service and file) trigger on-hover tooltips to be shown. The tooltips are transient, and are removed when the mouse cursor moves away from the feature.

By default, the tooltip shows a symbology icon along with the value of a feature's main field as specified in the config. It is possible to show any custom content inside a tooltip including static images or even dynamic charts.

![](https://i.imgur.com/MUYN6kN.png)

### 2.5. Map navigation cluster

The Map navigation cluster is located in the lower right corner of the `Inner shell` container. It contains controls performing actions on the map - such as zooming, gelocating, re-centering the map over the home extent (usually the entirety of Canada) - and triggering some of the higher level functionality - such as opening the [Geo search](#4-geo-search), [Side menu](#3-side-menu), [Layers panel](#5-layers-panel), [Basemap selector](#34-basemap-selector), [Full screen toggle](#36-full-screen-toggle), and [Help](#310-help-information). 

The default configuration includes just the Full screen toggle, geo-location, Home extent, and Help controls. All other controls duplicate functionality of the [Main application bar](#21-main-application-bar) and can be used if the Main application bar is hidden.

All controls in the Map navigation cluster can be independently hidden (expect for zoom in/out - they are hidden together).

![](https://i.imgur.com/YYH398c.png)

### 2.6. Basemap attribution and logo

The optional basemap attribution and logo of the currently selected basemap are displayed in the lower left corner. Each basemap can be provided with a custom attribution logo or text through the config.

There is no additional customization for this component, but the host page can forcefully hide and replace it with a custom implementation.

For legal ramifications of removing the attribution text read the following: https://developers.arcgis.com/terms/attribution/

![](https://i.imgur.com/utLhJE8.png)

### 2.7. Scalebar and mouse coordinates

The current map scale (both metric and imperial) is displayed in the right lower corner along with the current coordinates of the mouse cursor on the map in the spatial reference of the basemap (in this case it'd be Lambert coordinates). The coordinates update dynamically as the user moves the mouse.

There is no customization for these components, but the host page can forcefully hide and replace them with a custom implementation.

![](https://i.imgur.com/dp7cdWx.png)

## 3. Side menu 

The application-level side menu can be opened from the [Main application bar](#1-main-application-bar) or from the [Map navigation cluster](#5-map-navigation-cluster). It contains various application settings such as the current language selector, full screen toggle, and touch mode, high-level functionalities such as the basemap selection, map export, bookmark sharing, help, and any loaded interactive plugins, and build information. All items on the Side menu except for the [Build information](#314-build-information) are optional and their presence is dictated by the config.

![](https://i.imgur.com/xqCiCn4.png)

### 3.1. Application logo

An optional image can be displayed as the application logo at the top of the side menu to provide the application branding. The logo image can be hidden through the config as well.

### 3.2. Application title

An optional application title can be displayed underneath the application logo on the side menu.

### 3.3. Layers panel

This menu option closes the side menu and toggles the [Layers panel](#5-layers-panel). A checkmark icon on the right side is displayed if the [Layers panel](#5-layers-panel) is already open.

### 3.4. Basemap selector

This menu option closes the side menu and opens the Basemap selector menu in its place where the user can change the current basemap. The basemaps are grouped by their projections and switching to a different projection will trigger a map reload.

![](https://i.imgur.com/kR1P8vj.png)

#### 3.4.1. Projection name

Displays the name of the basemap projection group. This name can be set through the config.

#### 3.4.2. Basemap selection

A checkmark icon is displayed in the right upper corner of a basemap preview image indicating the currently selected basemap.

#### 3.4.3. Basemap preview

Each basemap will display a dynamically preview image to give the user an idea what a basemap looks like. Preview images are directly constructed from the basemap tile images of a specific location. These locations are hard-coded and different for each projection.

#### 3.4.4. Basemap name

Displays the name of the basemap. This name can be set through the config.

#### 3.4.5. Basemap description toggle

The basemap description toggles between displaying the basemap preview image and its description text.

#### 3.4.6. Basemap description

Display the basemap description text set in the config. If the text is long, the basemap element will expand vertically to accommodate the entire description.

### 3.5. Geo search

This menu option closes the side menu and opens the [Geo search](#4-geo-search) panel.

### 3.6. Full screen toggle

This menu option toggles the Full screen mode where the application is maximized to take up all available screen space. A checkmark icon on the right side is displayed if the Full screen mode is already enabled.

### 3.7. Export dialog

This menu option closes the side menu and open the map Export dialog. The map Export dialog lets the user save the image of the map with all the data rendered on top of it exactly as seen on the screen (if allowed by the CORS policy). 

![](https://i.imgur.com/7t5teBd.png)

#### 3.7.1 Export settings toggle

This control toggles the Export setting panel where the user can select what elements should be included in the export image and download that image as a PNG file.

- **Title**: when checked, the entered title text will placed just above the map on the export image and prefixed to the download file name
- **Map**: when checked, the map will be included in the export image
- **North arrow and scalebar**: when checked, the north arrow and scalebar will be included in the export image just underneath the map
- **Legend**: when checked, the legends (or symbology stack) of all the visible layers will be included underneath the north arrow and scalebar in the export image
- **Footnote**: when checked, an optional footnote text supplied by the config will be added after the legend image
- **Timestamp**: when checked, a timestamp will be be placed at the very bottom of the export image

The generation of the export image starts as soon as the dialog is opened and the progress is indicated by the progress bar at the top of the dialog.

![](https://i.imgur.com/OOYcRXP.png)

#### 3.7.2 Export file name

If provided, the title will be shown at the top of the export image and prefix to the download file name. If not provided, the file name follows the following pattern: `<map-name> - <timestamp>.png`.

#### 3.7.3 Close button

Close the map Export dialog. If the export image was still generating, the result will be lost.

#### 3.7.4 Download button

After the export image is generated, the user needs to click the `Download` button to download the generated image file. The button is disabled while the image is being prepared.

In some cases, the export image cannot be downloaded because of the CORS policies. In such cases, the application with display the following notice to the user:

![](https://i.imgur.com/4eNRD2n.png)

Modern browsers (IE11 is not a modern browser) allow to save canvas images as PNG files.

#### 3.7.5 Map export image

The image of the map with all the data rendered on top of it as seen on the screen. This image is rendered as two separate layers - basemap and data - which are merged together.

#### 3.7.6 Map scale

The map scale is placed below the map image on the left side and is identical to the [Scalebar and mouse coordinates](#27-scalebar-and-mouse-coordinates) component without the mouse coordinates part.

#### 3.7.7 North arrow

The north arrow is placed below the map on the right side and it's pointing to the geographic north pole.

#### 3.7.8 Map export legend

The Map export legend contains all the symbology (including nested symbology of Dynamic layers) of layers currently visible on the map. If the symbology list is long, it will be broken and wrapped in a number of columns to minimize the size of the export image .

#### 3.7.9 Export footer text

The Map export footer text is placed after the map and legend images. It can be used for providing descriptions of the map and data layers, legal disclaimers or some other information. 

#### 3.7.10 Export timestamp

A timestamp specifying the exact time when the export image was generated is placed at the very bottom of the export image. This can be helpful in distinguishing similar export images from each other.

### 3.8. Share dialog

The Share dialog is used to generate a shareable URL of the current map state with selected datasets. It can be accessed in the main menu. If a Google API Key is provided in the config, a short link can be generated. Once the user highlights the link, the link can be copied as normal text (right click -> copy or Ctrl+C)

![](https://i.imgur.com/5Ms41K3.png)

### 3.9. Touch mode toggle

The Touch mode increases button sizes (mostly inside the [Layer panel](#5-layers-panel) and [Map navigation cluster](#25-map-navigation-cluster)) and makes context menu controls visible by default to improves the experience for touch users.

![](https://i.imgur.com/yDtmdpE.png)

![](https://i.imgur.com/FfbR2vI.png)

### 3.10. Help information

The Help dialog contains information on functionalities available within the application and how they are used.

![](https://i.imgur.com/CzojOw3.png)

#### 3.10.1 Help Search

The user can search through all the text content by typing keywords  into the help search field. Help topics with matches are automatically expanded, and topics with no matches are hidden. Clearing the search field reset the Help dialog.

![](https://i.imgur.com/7FJFH6P.png)

#### 3.10.2 Help topic

The content is broken into thematic collapsible topics with all the sections collapsed initially. The user can expand as many or as few help section as needed.

### 3.11. About information

Opens a dialog window which provides additional information about the current application. This information can supplied either through the config or a Markdown file hosted alongside the RAMP deployment.

![](https://i.imgur.com/YbEK5m0.png)

### 3.12. Language selector

The Language selector sections displays a list of supported languages the user can switch to. The current language is marked by a checkmark icon to the right of the language name. When the language is change, all the application UI elements will be re-rendered.

### 3.13. Plugin section

The Plugin section list all plugin functionalities which can be launched from the side menu.

### 3.14. Build information

The Build information section displays information about the current build.

 ![](https://i.imgur.com/JLKrJQi.png)

#### 3.14.1 Version number + commit hash

This displays the application version number (major.minor.patch) and the commit hash or the latest commit.

#### 3.14.2 Build date

This is an exact UTC timestamp when the build was made.

#### 3.14.3 Github repo link

This is a link to the main [fgpv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf) repository where the core source code is stored. There are additional related repositories (like geoApi, and plugins) listed on the [RAMP2/FGP Viewer](https://github.com/fgpv-vpgf) organization page.

## 4. Geo search

The functionality for this component is provided by [RAMP/geosearch](https://github.com/RAMP-PCAR/geosearch) plugin which uses [Geogratis services](http://geogratis.gc.ca/). It's possible to provide a different implementation of this plugin which can make use of any other search services.

This component allows the user to search for places in Canada. When activated, it replaces the [Main application bar](#21-main-application-bar) with an input field for search keywords and closes the main and secondary panels. The search results are displayed directly below the Geo search bar.

![](https://i.imgur.com/K0sS609.png)

There are three search modes: keyword, FSA, and latitude / longitude.

### 4.1 Keyword search

When a keyword is typed, a request is sent to Geogratis services and a list of results with this keyword is be displayed. While the request is being fulfilled, the indeterminate progress bar is displayed along the bottom edge of the Geo search bar.

![](https://i.imgur.com/OiuKjS8.png)

#### 4.1.1 Search filters

The user can filter search results either by province or result type (lake, town, military area, etc.).

#### 4.1.2 Clear search button

This will clear search filters.

#### 4.1.3 Search results

Each result consists of:

- location name (search keyword will be highlighted)
- location province 
- location type (lake, island, city, town, etc.)

Click on any results will zoom and center the map on this location, and also place a marker at the location coordinates.

#### 4.1.4 Map extent filter

This will filter search results based on the current map extent - showing only results visible on the map. Panning and zooming the map will affect the search results listed.

### 4.2 FSA search

A **forward sortation area** (**FSA**) is a way to designate a geographical unit based on the first three characters in a Canadian postal code. All postal codes that start with the same three characters—for example, K1A—are together considered an **FSA**.

A search of an FSA will return a list of results in vicinity of that area.

![](https://i.imgur.com/yA1AQs2.png)

#### 4.2.1 Location zoom shortcut

When searching by an FSA, the very first result will be a location of that FSA itself.

### 4.3 Latitude / Longitude search

A search of lat/long coordinates will return results in vicinity of that map point.

![](https://i.imgur.com/eiBP50t.png)

#### 4.3.1 Location zoom shortcut

When searching by coordinates, the very first result will be a location of those coordinates.

## 5. Layers panel

The Layers panel is the main panel in the application and it displays a list of all the layers added to the map and their state. This panel is also can be referred to as "Layer selector", "Table of contents" or "Legend". 

Apart from [Layer nodes](#54-layer-node) and [Layer groups](#55-layer-group) describing layers added to the map, the Layers panel can also contain arbitrary plain text (markdown, HTML markup), titles, images, blocks that look like proper layers but do not control anything on the map, groups that don't belong to Dynamic layers, and visibility sets. These sections are referred to as [Layer info sections](#516-layer-info-section).

The legend comes in two flavours - **structured** and **autogenerated**.

The **Structured** legend lets the config author define the ordering of legend blocks, their names, specify custom [Symbology stacks](#57-layer-symbology-single), put things into regular groups or [Visibility sets](#515-layer-visibility-set), hide layers from the legend, and have a single legend block controlling several layers. Lots of power options, plenty of opportunities to break up the config. All this should be used for thematic maps (i.e. maps that tell a certain story with the data).

The **Autogenerated** legend is simple - it takes the layer list and turns it into a legend, one to one correspondence (one regular legend block per one layer). 

**Note:** The config uses the term `autopopulate` when indicating the type of legend in an application.

It should be pointed out the **autogenerated** legend - after it was generated during the config parse - is technically a **structured** legend. It uses a subset of elements which can be used in the **structured** legend.

The only notable difference between the two is ability to reorder and layers in the **autogenerated** legend. **Structured** legends are immutable (apart from removing user-added layers - this is allowed by both legend types and cannot be disabled, yet). The **autogenerated** can be [reordered](#517-layer-reorder).

![](https://i.imgur.com/jKmbVtR.png)

### 5.1. Add layer (Layer Import Wizard)

#### 5.1.1. Select the 'Import File' or 'Import Service' option through the Add layer menu

![img](https://camo.githubusercontent.com/bad30d44ab651f4ed6a89d7bca0b028a61b29a72/68747470733a2f2f692e696d6775722e636f6d2f494f5a415067492e706e67)

| Supported Services| Supported File Types|
| ------------- |:-------------:|
| OGC WFS v3       |CSV  |
| OGC WMS       |GeoJSON  |
| ESRI Feature Layer |Zipped ShapeFile|
| ESRI Dynamic Layer| |
| ESRI Tile Layer|  |
| ESRI Image Server|  |


#### 5.1.2. Add your File/Service 

![step 1 - connect the service](https://user-images.githubusercontent.com/25359812/53022159-9d113e80-3428-11e9-8bd8-57a9d0ea7130.png)

If you selected `Import File`, click on the `Choose A File` button and select your local file (or alternatively drag and drop), or provide a URL  to the file (as shown on the left).

If you selected `Import Service` enter the service URL (as shown on the right).

Click the `Continue` button to proceed.

#### 5.1.3. Select the correct dataset type 

![](https://i.imgur.com/AY8qpFl.png)

This step works the same for both file and service based layers. 

- The Viewer will try to predict the dataset type. If you are satisfied with this, click the `Continue` button to proceed (Scenario 1). 
- If it is incorrect, select the option from the dropdown with the correct type (Scenario 2). Then click `Continue` to proceed.
- If the import wizard warns you that the selected file/service type is incorrect, double check that the selected type is correct and make any nescessary changes. If this doesn't work, double check that the source is not corrupted. 

**Note:** the drop down menu in Scenario 2 will look different depending on whether you are using a file or service. If you are using a service, it will look different depending on the *type* of service.

#### 5.1.4. Configure your file type

 Depending on the type of dataset being loaded, the following parameters can be set in this final phase:

![](https://i.imgur.com/oCKzXZJ.png)


1. **Layer Name** : the layer name as it appears in the legend
2.  **Primary Field**: the field to be used for identify (and hovertips if custom field is not set)
3. **Tooltip Field**: the field to be used for hovertips
4. **Lat/Long Fields**: specify the columns that contain the Latitude and Longitude values, used to derive the point location on the map
5. **Color**: the color that points/lines/polygons will be rendered in
6.  **Sublayers**: sublayers to be included as top level items in a
    - legend group (for dynamic layers)
        - if the dynamic service URL contained an index at the end, a corresponding sublayer will be preselected
        - the user has an shortcut option of selecting all sublayers or deselection currently selected
        - if a single sublayer is selected, the user can choose to not display this sublayer inside a group
    - wms legend block (for wms layers)
7. **Group Name**: as it appears in the legend (if more than one sublayer is selected, or the user chose to group a single sublayer)

**RAMP File Based Layers**

| File Type      | Lat/Long Fields        | Layer name| Primary Field| Tooltip Field| Color|
| ------------- |:-------------:|:-------------:|:-------------:|:-------------:|:-------------:|
|    CSV  | &#10004; |&#10004; | &#10004; | &#10004; |&#10004;|
|    GeoJSON  | :x: |&#10004; |&#10004; |&#10004; | &#10004;|
|    Zipped ShapeFile| :x: |&#10004; |&#10004; |&#10004; | &#10004;|

**Service Type**

| Layer Type| Layer Name| Primary Field| Tooltip Field| Color| Select Sublayers| Group Name|
| ------------- |:-------------:|:-------------:|:-------------:|:-------------:|:-------------:|:-------------:|
| OGC WFS       |&#10004;  | &#10004;| &#10004;| &#10004;|:x:|:x:|
| OGC WMS       |&#10004;  | :x:|:x:|:x:| &#10004;|:x:|
| ESRI Feature Layer |&#10004;  | &#10004;| &#10004;|:x:|:x:|:x: |
| ESRI Dynamic Layer |:x:  | :x:|:x:|:x:|&#10004;|&#10004;|
| ESRI Tile Layer| :x: | :x: | :x: | :x: | :x: | :x: |
| ESRI Image Server| :x: |:x: | :x: | :x: | :x: | :x: |


#### 5.1.5. Click the 'Continue' button to insert the layer into the map and closes the Add Layer menu.

### 5.2. Group toggle menu

The Group toggle menu is located at the top of the Layers panel and allows the user to collapse or expand all the [Layer groups](#55-layer-group) at the same time.

![](https://i.imgur.com/yPF3ZJ8.png)

### 5.3. Visiblity toggle menu

The Visibility toggle menu is located at the top of the Layers panel and allows the user to change the visibility of all layer and groups at the same time (if allowed by the config).

![](https://i.imgur.com/4mzb2jW.png)

### 5.4. Layer Node

A Layer node represents a single layer or a sublayer of a Dynamic layer. Usually, a Layer node has a [Symbology stack](#57-layer-symbology-single), layer name, [Layer flags](#56-layer-flags), [Layer Node context menu](#59-layer-node-context-menu), and [Visibility toggle](#58-visibility-toggle). In **Structured** legend, most of these elements can be customized through the config.

![](https://i.imgur.com/H1KDKtT.png)

#### 5.4.1 Scale-dependent layers

Scale-dependent layers will only render data on the map at certain zoom levels. Out-of-scale layers are rendered with a `zoom in` or `zoom out` toggle instead of the regular visibility toggle.

![](https://i.imgur.com/RRqoUud.png)

If the layer's visibility is toggled off, it will be displayed with an empty visibility checkbox even if the layer is out of scale. If the layer is made visible, the visibility toggle will be replace the `zoom in/out` button to indicate its out-of-scale status.

![](https://user-images.githubusercontent.com/2285779/30815682-dfafbbe8-a1e1-11e7-9f06-2acba957861f.gif)

### 5.5. Layer Group

Layer groups organize [Layer nodes](#54-layer-node) and [Layer info sections](#516-layer-info-section) into collapsible sections. Anything can be put inside a group, including other groups (group nesting). Nesting them more than ten levels deep will not produce any changes in the UI - it's a flat list from there on.

![](https://i.imgur.com/ihssSxE.png)

When the visibility of a group changes, the current values is propagated to all its children replacing their visibility values with the new one.

There is an ongoing discussion about changing how groups propagate their visibility values. Read more here: https://github.com/fgpv-vpgf/fgpv-vpgf/issues/3152#issuecomment-445801582

#### 5.5.1 Dynamic layer groups

By default, Dynamic layers are renders as groups. 

If a Dynamic layer does not support children _opacity_, the logic applying opacity is different and all children will have their _opacity_ controls disabled and display a jump link to its parent unless it's single entry collapsed. Read the following issue for more details: https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2131#issuecomment-324723049

**Note:** Jump link should never point to group blocks not belonging to this layer record.

### 5.6. Layer flags

Each [Layer node](#54-layer-node) has a set of layer flags displayed underneath the layer name:

![](https://i.imgur.com/Zcwn6HN.png)

- **Bounding box**: indicates if the layer's bounding box is shown on the map
- **Viewable data**: indicates if the layer has data which can be viewed in a table by clicking on the body of the node
- **Feature layer**: indicates this is a Feature, WFS layer and file-based layers added through the config (also shows a number of features in the tooltip)
- **User-added layer**: indicates this layer has been added by the user at runtime
- **Dynamic layer**: indicates this is a Dynamic layer (also shows a number of features in the tooltip)
- **Raster layer**: indicates this is a Tile or WMS layer
- **Out of scale**: indicates this layer is out of scale and no data is rendered on the map

### 5.7. Layer symbology (single)

Layer symbology consisting of a single element is a special case of the [Layer symbology (multiple)](#514-layer-symbology-multiple).


![](https://i.imgur.com/ze3lbLx.png)

#### 5.7.1 Symbology stack toggle

The collapsed symbology stack acts as a toggle. When clicked, it will expand the stack and display the solo item of the stack underneath the layer name. At this point the toggle is rendered visible as a "close" icon. When clicked, it collapses the symbology stack back.

#### 5.7.2 Symbology stack

A layer's symbology is a collection of image-label pairs explaining features available in the layer. Internally, it's referred to as a "symbology stack" with the "stack" bit describing its vertical orientation when rendered in the UI.

Two style options are available for symbology stacks:

- icons
- images

##### 5.7.2.1 Icons

All symbology images are wrapped into SVG containers sized to 32x32 pixels and rendered in a vertical list with the icon followed by its label.

This style is used by default for all layer types except WMS layers.

##### 5.7.2.2 Images

All symbology images are wrapped into SVG containers sized to fit the image. All containers will be sized as the largest image in the collection or upto the width of the main panel. The label is rendered underneath the image, similar to a caption.

This style is used by default for WMS layers as they symbology image usually already contain lists of legend items with labels.

### 5.8. Visibility toggle

The visibility toggle is a checkbox control indicating if the layer is visible on the map. For out-of-scale layers, this controls is replaced by the `zoom in/out` control. See [Scale-dependent layers](#541-scale-dependent-llayers). This control is always visible unless hidden through the config.

### 5.9. Layer Node context menu

The Layer Node context menu can be opened by clicking the "three horizontal dots" icon on any Layer node (only visible when hovering over a node or if the [Touch mode](#39-touch-mode-toggle) is enabled).

Not all options shown below might be available on all layers.

![](https://i.imgur.com/7laP4VC.png)

- **Metadata**: opens the [Layer metadata](#519-layer-metadata-panel) panel
- **Settings**: opens the [Layer settings](#518-layer-settings-panel) panel
- **Datatable**: open the [Table panel](#6-enhanced-table) panel and displays layer data.
- **Legend**: expands layers's symbology stack
- **Zoom to Layer Boundary**: zooms the map to the layer boundary
- **Reload**: reloads the layer by removing it from the map and adding it back (will also reload any linked layer nodes)
- **Remove**: removes the layer from the map (a notification is displayed upon removal with an option to restore the remove layer)

### 5.10. Failed layer indicator

If a layer fails to load, a sad face icon is displayed in the place of its symbology stack and a 4px-wide vertical red line is drawn at the right edge of the Layer node; its visibility toggle is replaced with a "Reload" button which will attempt to reload the layer if clicked.

In **Autogenerated** legend, an additional "Remove" control is displayed which will remove the layer from the legend if clicked.

### 5.11. Loading layer indicator

While a layer is loading, a happy face icon is displayed in the place of its symbology stack and an indeterminate progress back is shown at the bottom edge of the Layer node. 

### 5.12. Reload layer control

A "Reload" control is shown in the place of the [Visibility toggle](#58-visibility-toggle) while a layer is loading. It will remove and re-add the layer back to the map if clicked.

### 5.13. Layer Group context menu

The Layer Group context menu can be opened by clicking the "three horizontal dots" icon on any Layer group (only visible when hovering over a node or if the [Touch mode](#39-touch-mode-toggle) is enabled).

Not all options shown below might be available on all layer groups.

![](https://i.imgur.com/MGaLQus.png)

- **Metadata**: opens the [Layer metadata](#519-layer-metadata-panel) panel [only available for root-level Dynamic groups]
- **Settings**: opens the [Layer settings](#518-layer-settings-panel) panel
- **Zoom to Layer Boundary**: zooms the map to the layer boundary
- **Reload**: reloads layers inside the group by removing them from the map and adding it back (will also reload any linked layer nodes)
- **Remove**: removes the group and all the nested layers from the map (a notification is displayed upon removal with an option to restore the remove layers)

### 5.14. Layer symbology (multiple)

A layer's symbology is a collection of image-labels pairs explaining features available in the layer. Internally, it's referred to as a "symbology stack" with the "stack" bit describing its vertical orientation when rendered in the UI. The symbology stacks can be shown in the Layers panel, [Details panel](#7-details-panel), and [Enhanced table](#6-enhanced-table).

#### 5.14.1 Interactivity

When a symbology stack with more than a single icon is rendered, it is displayed as at most three almost overlapping icons (regardless of the actual number of symbols and the rendering style). The three icons will fan out when hovered over to indicate potential interactivity.

If rendered in the main panel, the stack can be expanded into a full list by simply clicking on it (or selecting the "Legend" option from the layer menu).

![](https://i.imgur.com/yjuiUBV.png)

### 5.15. Layer visibility set

A Layer visibility set is a convenience for the user when at most a single element from a set can be visible at a time - it's possible to have all elements in the set turned off. They groups things together, but there is no header element. It's also not possible to nest visibility sets directly - it just doesn't make sense. It is possible to put a set into a group and put that group into another set though.

The visibility set is rendered a bit differently from a group - it uses radio buttons instead of checkboxes as visibility controls. This helps to convey the "one of" nature of a visibility set. There is also some highlighting to clearly mark which legend blocks which belong to a set if there are two sets placed one after another for example.

A visibility set will remember the last selection when its parent container is turned off and on again.

![](https://i.imgur.com/ikK3PZO.png)

![](https://i.imgur.com/3IAO1pp.png)

### 5.16. Layer Info section

**Info sections** are pieces of static content which can be added between any other legend blocks. There are four types: text, title, image, and unbound layer.

- **Text**: accepts plain text, Markdown or HTML markup
- **Title**: accepts plain text; renders as text, but with a larger font size
- **Image**: adds an image to the legend; all common formats are supported
- **Unbound layer**: copies some of its looks from the regular legend block: it has a name and a symbology stack

![](https://i.imgur.com/Xc3VbR8.png)

![](https://i.imgur.com/WBsffrl.png)

### 5.17. Layer reorder

Layers can only be reordered in the __autogenerated__ legend but only inside their respective layer type groups (Feature layers and all other layer types). In __structured__ legends the layer Reorder toggle will be hidden.

![](https://i.imgur.com/Ii4LYyf.png)

When reordering, the section of the legend where the layer cannot be moved will be de-highlighted.

![](https://i.imgur.com/4ffCQWS.gif)

### 5.18. Layer settings panel

This is a secondary panel which opens to the right of the Layers list. It's available for both Layer nodes and Layer groups, although not all the options are available in all cases (all options can also be hidden through the config).

![](https://i.imgur.com/fo6QttW.png)

#### 5.18.1 Active layer indicator

Indicates which layer the Setting panel belongs to.

#### 5.18.2 Visibility toggle

Same as the [5.8 Visibility toggle](#58-visibility-toggle). Available for both layer nodes and groups.

#### 5.18.3 Opacity slider

This controls the opacity of a individual layer (including Dynamic sub-layers), a Dynamic layer and all of its sub-layers if applicable, or all the layers nested in a group.

#### 5.18.4 Bounding box toggle

This controls the visibility of the layer bounding box on the map. Available only for individual layers and Dynamic sub-layers; not available for simple groups.

#### 5.18.5 Identify query toggle

This indicates if the selected layer should be queried for results when the user clicks on the map to get feature details. Not available for simple groups.

#### 5.18.6 Snapshot mode toggle

The snapshot mode is available for Feature layers only. When enabled, all the data for this layer will be downloaded to the app. This can increase layer performance if the service latency is big, but will reduce performance if the layer has massive amounts of data.

#### 5.18.7 Layer refresh interval

#### 5.18.8 WMS Styles selector

This allows the user to select one of the available WMS styles. Only available for WMS layers.

#### 5.18.9 Layer reload control

Same as the [Reload layer control](#512-reload-layer-control). Available for both layer nodes and groups.

### 5.19. Layer metadata panel

This is a secondary panel which opens to the right of the Layers list. Only available for layers with metadata support.

![](https://i.imgur.com/VC9Askn.png)

#### 5.19.1 Active layer indicator

Indicates which layer the Metadata panel belongs to.

#### 5.19.2 Layer Metadata

Layer Metadata is fetched from the layer service as XML, parsed, and the result is rendered as HTML markup. There are three main sections: abstract, Contact information, and Metadata link.

#### 5.19.3 Expand metadata toggle

The metadata panel can also be opened in a separate dialog which takes up a major portion of the screen. This is useful when there is a lot of metadata to display.

![](https://i.imgur.com/RUegeQk.png)


## 6. Enhanced Table 

![table mockup and annotations](https://user-images.githubusercontent.com/25359812/52882741-a81d5380-3136-11e9-9c9d-bcf7f428ff53.png)

The `enhancedTable` is an accessible way to visualize layer attributes. Each row corresponds to a layer feature. 

### 6.1. Table Title
Displays the name of the table. This name can be set through the config. 

### 6.2. Scroll  and Filter Status
The filter status gives the user three pieces of information: 
1. The range of currently visible rows
2. The number of records that can be scrolled through
3. The number of records that were filtered out (if any)

#### Example 1:  `6 - 12 of 15 records shown` 
1.  rows 6 - 12 are currently visible
2.  15 records can be viewed in the table just by scrolling
3.  there are 15 records total for the corresponding layer (no filters are applied)
    
#### Example 2: `1 - 6 of 10 records shown (filtered from 15 records)`
1.  rows 1 - 6 are currently visible
2.  10 records can be viewed in the table just by scrolling
3.  there are 15 records total for the corresponding layer (5 records are filtered out either through [column filters](#65-column-filters) or [symbology toggles]())


### 6.3. Details

The details button is available on each row of the table, and opens up the [details panel](#7-details-panel) for the corresponding layer feature.

### 6.4. Zoom

The zoom button is available on each row of the table, and zooms to the corresponding layer feature on the map.

### 6.5. Column Filters

#### 6.5.1. Text Filter
![text filter mockup](https://user-images.githubusercontent.com/25359812/52877076-f75b8800-3126-11e9-8b5f-d02ef82faaaf.png)

Text filters allow the user to filter row records by making sure that the filter is a substring of the rows' data at that column:

- e.g. typing `ga` into the filter above will match for the second and third records because `ga` is a substring of "Korean **Ga**s" and "Ena**ga**s"

#### 6.5.2. Number Filter
![number filter mockup](https://user-images.githubusercontent.com/25359812/52876435-325cbc00-3125-11e9-9e7c-d612158d05e2.png)

Number filters allow the user to filter row records by making sure that the rows' data at that column fall into the range specified by that filter: 

- e.g. typing `3` into the min field and `4` into the max field will match for the first and second record because `3` and `4` fall into the range `3-4`
- ranges are inclusive
- filter will also work with only one of `min` or `max` fields filled out

#### 6.5.3. Date Filter
![date filter mockup and annotations 1](https://user-images.githubusercontent.com/25359812/52875517-831ee580-3122-11e9-9a07-b881b346d812.png)

Date filters let the user input dates by clicking on the calender icon to use a datepicker GUI or by typing dates into the input field. 

Date filters allow the user to filter row records by making sure that the rows' data at that column fall into the date range specified by that filter: 

- e.g. selecting  `2015-07-07` for the date min field and a date max of `2017-07-07` for the date max field will match for the last record because only `2016-10-05` falls into  the range `2015-07-07` - `2017-07-07`
- ranges are inclusive
- filter will also work with only one of `date min` or `date max` fields filled out

#### 6.5.4. Selector Filter
![selector filter](https://i.imgur.com/Iv2GObN.png)

Selector filters allow the user to filter row records by making sure that the rows'data at that column fall into one of the categories specified by the dropdown selector GUI (shown on the right).

### 6.6. Table Controls

![table controls](https://user-images.githubusercontent.com/25359812/52875375-35a27880-3122-11e9-996c-c24966b87feb.png)

#### 6.6.1. Global Search
The global search allow the user to filter row records by making sure that the search term is a substring of the rows' data at one or more columns.

Global search can be disabled in the config.

#### 6.6.2. Toggle Column Visibilities
Opens a menu that allows the user to toggle the column visibilities on or off. 

#### 6.6.3. Clear Column Filters
Clears any column filters that are currently set. 

Note that this does not: 
- clear the global search
- clear any symbology toggles that filter the table

#### 6.6.4. Apply Table Filters to Map
Applies the table filters to the map, so that only layer features that are displayed in the table are displayed on the map.

#### 6.6.5. Table Menu
![menu mockup and annotations](https://user-images.githubusercontent.com/25359812/52878964-fd079c80-312b-11e9-8cda-ce48e6be994a.png)

- **Split View**:** table height is half of the map height  
- **Maximize:**** table height takes up the full height of the map
- **Filter by extent:** table automatically updates on map extent change to display only layer features within the current extent 
- **Show filters:** toggling this option off will hide all column filters 
    - the user will not be able to use or change column filters while this option is toggled off 
    - columns themselves will still be displayed and column filters will remain applied
- **Print:** takes the user to a printer friendly page displaying table data
    - this option is disabled by default 
    - it is the map author's responsibility to enable it in the config
- **Export:** Exports table data to CSV


** **Note:** Not available in mobile view because table will take up whole height and width of the map by default

#### 6.6.6.  Close table 

Closes the table.

### 6.7. Column Reorder

Clicking the right arrow on a column makes it swap places with the column to the right of it. Clicking the left arrow makes it swap places with the column to the left of it. 

The right arrow is disabled for columns that are at the right end of the table, and the left arrow is disabled for columns that are at the left end of the table. 

Columns can also be reordered by dragging and dropping.

### 6.8. Column Title
Displays the name of the column. This name is generated automatically using layer data but can also be set in the config. 

### 6.9. Column Sort

Click on the column name to sort columns. 

- An up arrow indicates that the column data is being sorted in ascending order (for numerical data) and in alphabetical order (for text data)
- A down arrow indicates that the column data is being sorted in descending order (for numerical data) and in reverse alphabetical order (for text data)
- No arrow indicates that no column sort is being applied to the current column 
- You can use `Shift + click` to sort multiple columns at once


## 7. Details panel

The Details panel lists features the user clicked on (identify results). When the user clicks anywhere on the map, all queryable layers are checked for features at the click point. Based on the identify mode, an identify marker is added to the map and the Details panel is open to show the results.

![](https://i.imgur.com/J7GC0zi.png)

A list of all queryable layers is displayed on the left side of the Details panel. The list is collapsed such that only the layer symbology stacks are visible. A circle-badge with a number of valid results is shown in the lower right corner of the corresponding symbology stacks.

When hovered over, the list will expand to the right to reveal layer names. The user can click on any of the layers with valid results to see the results in the main part of the Details panel.

![](https://i.imgur.com/m92lsTJ.png)

### 7.1. Details panel toggle

This toggle collapses the Details panel without while preserving the result list; the user can restore the panel by clicking the toggle again. The Details panel toggle button will stay in the Main application bar until the details panel is explicitly closed.

### 7.2. Currently selected layer

A 4px-wide blue vertical line is displayed on the right side of the layer whose identify results are being displayed in the Details panel. The user can change the selection by clicking on any other layer with valid results.

### 7.3. Expand details toggle

The metadata panel can also be opened in a separate dialog which takes up a major portion of the screen. This is useful when there is a many results to display. In this view, only the results from the currently selected layer are displayed.

![](https://i.imgur.com/s1UZwqD.png)

### 7.4. Layer without identify results

Queryable layers with no identify results are rendered with their symbology stacks and layer names faded-out.

### 7.5. Zoom to feature button

The Zoom-to button is displayed when the identify result is hovered over (or when the [Touch mode](#39-touch-mode-toggle) is enabled). This will zoom the map and center on the corresponding feature.

### 7.6. Collapsed identify result

Results are rendered as collapsed sections with just the name of the feature and its symbology icon visible. Initially, when all results are collapsed, all the corresponding features are highlighted.

If the user expands a result, the corresponding feature on the map is highlighted while others are dimmed (depending on the identify mode). When subsequent results are expanded, their corresponding features are highlighted as well. 

### 7.8. Identify marker

When the user clicks the map, an identify marker is placed at the click point (depending on the identify mode). This marker will always be visible while the layers are being queried. After that,

- if the currently selected layer is a vector-based layer, the marker will be removed and all the results in this layer will be highlighted
- if the currently selected layer is not vector-based, the identify marker will remain on the map

### 7.9 Identify mode

The identify mode specifies which actions, if any, are performed when the map is clicked. The identify mode can be set to any combination of the following options (or none at all):

* query
* marker
* highlight
* haze
* details

#### 7.9.1 Query
Runs the identify query and pipes the available results through the `identify` API endpoint.


#### 7.9.2 Marker
Adds a graphic marker at the point of a mouse click. The marker will be set on the map even if the `Query` option is not set.


#### 7.9.3 Highlight
Highlight the identify results on the map. If the `Marker` mode is set, highlighted features will replace the marker.
Only works when `Query` is set.

#### 7.9.4 Haze
Dehighlights all other layers and features except the identify results (if `Highlight` is set) or the marker (if `Marker` is set).
The haze will not be applied if neither `Marker` nor `Highlight` is set.

#### 7.9.5 Details
Display the identify results in the details panel.
This option only works in conjunction with the `Query` option. Without `Query`, there will be no results to display in the details panel.