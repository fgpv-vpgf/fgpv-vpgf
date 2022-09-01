# Datatables

Datatables allow a tabular view of feature attributes for a given feature class. They are important because they allow RAMP to meet [accessibility reqirements](/mapauthor/wcag_compliance). This is the main reason it is encouraged to include them at all times.

The datatable is considered a [plugin](#other-table-plugins), but by default the standard `enhancedTable` plugin is used. It allows map authors and users to customize how data is displayed through the map config and UI. It allows uers to interact with and filter map data in more detail.

## Configuration Steps

###  Layer Types that Support Tables

#### Service Based Layers

| Layer Type| Datatable Available?
| ------------- |:-------------:|
| OGC WFS       |&#10004;  |
| OGC WMS       |:x:  |
| ESRI Feature Layer |&#10004;  |
| ESRI Dynamic Layer (Feature Layer Child)|&#10004;  |
| ESRI Dynamic Layer (Raster Layer Child)  | :x: |
| ESRI Tile Layer| :x: |
| ESRI Image Server| :x: |

#### File Based Layers

| File Type      | Datatable Available?          |
| ------------- |:-------------:|
|    CSV  | &#10004; |
|    GeoJSON  | &#10004; |
|    Zipped ShapeFile| &#10004;  |


### Enabling and Disabling in the Config

#### Disabling Datatables

<p class="warning">
  Datatables are required for RAMP to be [`WCAG2.0 AA`](/mapauthor/wcag_compliance) accessible. Thus it is NOT advisible to disable them.
</p>

First approach: `disabledControls` array is defined for the layer and `data` is included

```json
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

Second approach: `controls` array is defined for the layer and `data` is NOT included

```json
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

#### Enabling Datatables

First approach: neither `controls` or `disabledControls` arrays are defined on a layer's config object (datatable is on by default)

Second approach: `controls` array is defined for the layer and `data` is included

```json
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

Third approach: `disabledControls` array is defined for the layer and `data` is NOT included

```json
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

### Customizing the Table

<p class="tip">
Customization is optional. If nothing is specified, RAMP will create a default setting based on service or file metadata.
<p>

If you need to override the default table settings, you can use the config to do so. The table settings reside as a child property of a layer configuration object.

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

For a full list of `table` config options, visit the [interactive schema](https://fgpv-vpgf.github.io/schema-to-docs/) and navigate to `map > properties > layers > items > 1 > properties > table > properties`.

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

Here we have a table with 3 columns displaying:
-  The`OBJECTID` column has a fixed with, a custom title and has its sort set to descending on open

```json
"table": {
  ...
  "columns": [
    {
      "data": "OBJECTID",
      "title": "System ID",
      "width": 20,
      "sort": "desc"
    },
    {
      "data": "Country"
    },
    {
      "data": "Operator"
    }
  ]
}
```

#### Example 3: Modifying Fitler Defaults

Here we have a table whose `Population` column has a custom filter:
- Filter is a number filter, with a default min of 0 and max of 2500
- The filter is set to `static` meaning the values can't be modified or cleared through the UI

```json
"table": {
  ...
  "columns": [
    {
      "data": "Population",
      "filter": {
        "type": "number",
        "value": "0,2500",
        "static": true
      }
    },
    ...
  ]
},
```

## Other Table Plugins

It is possible to develop and use your own table plugin for `RAMP`. If you would like to do so, follow the steps to develop your own plugin outlined [here](/developer/plugins).

Be sure to replace `enhancedTable` with your custom plugin like so:

```js
window.myCustomTable = {
    ...
    feature: 'table',
    ...
}
```

