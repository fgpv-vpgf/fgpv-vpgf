# Datatables

Datatables come in two flavours, *simple* and *enhanced*.

`simpleTables` are lightweight and available by default for all layers that allow datatables to be displayed. They are replacable by the more feature rich `enhancedTables`.

`enhancedTables` on the other hand, need to be enabled by the map author upon which they will override `simpleTables`.

### Jump to:
- [Usage Scenarios](#Usage-Scenarios)
- [List of Differences](#Differences)
- [Configuration Steps](#Configuration-Steps)
- [Other Table Plugins](#Other-Table-Plugins)


## Usage Scenarios

Datatables are important because they allow RAMP to meet [accessibility reqirements](../mapauthor/wcag_compliance.md). This is the main reason it is encouraged to include them at all times.

In general `simpleTables` are useful for users who would like to quickly visualize layer data in a table format. It is lightweight, enabled by default (so that RAMP meets accessibility requirements by default), and requires no additional set up.


`enhancedTables` come in handy for datatable powerusers. It allows map authors and users to customize how data is displayed through the map config and UI. It allows uers to interact with and filter map data in more detail. `enhancedTables` are not available by default.

## Differences

Below is a comprehensive list of differences between the two tables.

| Pros         | Simple Table| Enhanced Table |
| ------------- |:-------------:| :-----: |
| Lightweight (Avoids External Libraries)|  &#10004;  |  :x:|
| Enabled by Default |  &#10004;  | :x: |
| Feature Details Shortcut| :x:   | &#10004;  |
| Zoom Shortcut|   :x: | &#10004;  |
| Column Filters|  :x:  | &#10004;  |
| Column Sorting| :x:  | &#10004;  |
| Column Reordering| :x:  | &#10004;  |
| Column Visibility (Toggle)| :x:  | &#10004;  |
| Paging Results| :x:   | &#10004;  |
| Global Search|  :x:  | &#10004;  |
| Custom Title|  :x:  | &#10004;  |
|Split/Maximize View|  :x:  | &#10004;  |
| Mobile Compatible|:x: | &#10004;  |
| Synced with Layer Visibility|   :x: | &#10004;  |
| Synced with Map|  :x:  | &#10004;  |
|Filter by Map Extent|  :x:  | &#10004;  |
| Option to Print Data|  :x:  | &#10004;  |
|Export Data as CSV| :x:   | &#10004;  |
|Customize through config|  :x:  | &#10004;  |

## Configuration Steps


- `simpleTables` are available by default provided two conditions are met:
    - [**Condition 1**](#Condition-1-Available-on-the-Corresponding-Layer-Type): Datatables are available on the corresponding layer type
    - [**Condition 2**](#Condition-2-Datatable-is-not-Disabled-in-Config): The datatable is not disabled in the config

- `enhancedTables` can replace `simpleTables` if the user chooses to meet *additional* conditions:
    - [**Condition 3**](#Condition-3-Set-Up-the-HTML-File): Additions to host page's `HTML` file
    - [**Condition 4**](#Condition-4-Customize-the-table-through-the-config): Customize through the config (Optional)

----
### **Condition 1:** Available on the Corresponding Layer Type

#### Service Type

| Layer Type| Datatable Available?
| ------------- |:-------------:|
| OGC WFS       |&#10004;  |
| OGC WMS       |:x:  |
| ESRI Feature Layer |&#10004;  |
| ESRI Dynamic Layer (Feature Layer Child)|&#10004;  |
| ESRI Dynamic Layer (Raster Layer Child)  | :x: |
 ESRI Tile Layer| :x: |
| ESRI Image Server| :x: |

#### RAMP File Based Layers

| File Type      | Datatable Available?          |
| ------------- |:-------------:|
|    CSV  | &#10004; |
|    GeoJSON  | &#10004; |
|    Zipped ShapeFile| &#10004;  |



----
### **Condition 2:** Datatable is not Disabled in Config

#### **IMPORTANT:** datatables are required for RAMP to be [`WCAG2.0 AA`](../mapauthor/wcag_compliance.md) accessible. Thus it is NOT advisible to disable them.

#### Datatables are *disabled* when:


```json
// way one: disabledControls array is defined for the layer and 'data' is included
"layers": [
      {
       ...
        "disabledControls": [
          "data"
        ],
        ...
      }
    ]
```

```json
// way two: controls array is defined for the layer and 'data' NOT included
"layers": [
     {
        ...
        "controls": [
          "remove"
        ],
        ...
      }
    ]
```

#### Datatables are *enabled* when:

```json
// way one: controls array is defined for the layer and 'data' is included
"layers": [
      {
       ...
        "controls": [
          "data"
        ],
        ...
      }
    ]
```

```json
// way two: disabledControls array is defined for the layer and 'data' is NOT included
"layers": [
     {
        ...
        "disabledControls": [
          "remove"
        ],
        ...
      }
    ]
```

```json
// way three: neither controls or disabledControls arrays are included
"layers": [
     {
        ...
      }
    ]
```

----
### **Condition 3:** Set Up the HTML File

Include a link to the minified `enhancedTable.js` and `enhancedTable.css` files available in [`fgpv-vpgf/src/content/samples/extensions/enhancedTable`](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/v3/src/content/samples/extensions/enhancedTable).


```html
    <link rel="stylesheet" href="../enhancedTable.css" />
    <script src="../enhancedTable.js"></script>
```
Include `enhancedTable` on the `rv-plugins` tag  on your map `div` like so:
```html
<div class="myMap" id="sample-map" is="rv-map" rv-config="ramp-config.json" rv-langs='["en-CA", "fr-CA"]' rv-plugins="enhancedTable">
```
----
### **Condition 4:** Customize the table through the config

- **Note**: this condition is optional

If you need to override the default table settings, you can use the config to do so.

For a full list of `table` config options, go [here](https://fgpv-vpgf.github.io/schema-to-docs/) and navigate to `map > properties > layers > items > 1 > properties > table > properties`.

#### The table settings reside as a child property of a layer configuration object.

```json
"layers": [
      {
        "id": "layer1"
        "table": {
          ...
        },
        ...
      },
      {
        "id": "layer2"
        "table": {
          ...
        },
        ...
      },
      ...
    ]
```

#### Example 1: Modifying Table Defaults

Here we have a table with:
- a custom title, disabled global search, and the option to print data

```json
"table": {
    "title": "Table Test One - Custom Title",
    "search": {
        "enabled": false
    },
    "printEnabled": true
}
```


#### Example 2: Modifying Column Defaults

Here we have a table with 3 columns:
-  The`OBJECTID` column has a fixed with, a custom title and has its sort set to descending on open
```json
        "table": {
          ...
          "columns": [
            {
              "data": "OBJECTID",
              "title": "Custom OID",
              "description": "the object ids for the features",
              "width": 20,
              "sort": "desc",
            },
            {
              "data": "Country",
            },
            {
              "data": "Operator"
            }
          ]
        }
```

#### Example 3: Modifying Fitler Defaults

Here we have a table whose `OBJECTID` column has a custom filter:
-  Filter is a number filter, with a default min of 0 and max of 25
-  The filter is static meaning the values can't be modified or cleared through the UI

```json
        "table": {
          ...
          "columns": [
            {
              "data": "OBJECTID",
              "filter": {
                "type": "number",
                "value": "0,25",
                "static": true
              }
            },
            ...
          ]
        },
```

## Other Table Plugins

It is possible to develop and use your own table plugin for `RAMP`. If you would like to do so, follow the steps to develop your own plugin outlined [here](./plugins.md).


Be sure to replace `simpleTable` with your custom plugin like so:

```js
window.myCustomTable = {
    ...
    feature: 'table',
    ...
}
```

