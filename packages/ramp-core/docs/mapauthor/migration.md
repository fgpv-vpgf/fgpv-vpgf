# Migrating from RAMP v2 to v3

Version 3 of RAMP introduces sweeping changes to its API and plugin architecture. It's designed to encourage developers (and web savvy map authors) to customize RAMP to suit their project needs - without any knowledge of the inner workings of RAMP.

We've taken a balanced approach to introducing these changes so that migration from RAMP version 2 to version 3 is relatively pain free. The RAMP version 2 API is now deprecated, but continues to be available until the next minor release. All RAMP v2 plugins have been ported to v3 as well.

We encourage you to replace any deprecated v2 API code on your host page with the new v3 API, but we realize this may not always be possible right away.

## v2 API deprecation

If your host page contains `RV.getMap` then it is accessing the deprecated v2 API. You can continue to use the deprecated v2 API, although we encourage you to explore the newer v3 API and migrate your code as soon as possible.

To continue to use the deprecated v2 API you'll need to add a script called **legacy-api.js** before the main RAMP file **rv-main.js**. The **legacy-api.js** file is included in the RAMP release bundle.

```html
<script src="legacy-api.js"></script>
<script src="rv-main.js"></script>
```

<p class="warning">
  The deprecated v2 API will be removed in a future release, so its a good idea to start using the new v3 API as soon as possible.
  <br><br>
  Visit the [new v3 API documentation](/developer/api-overview)
</p>

<p class="tip">
  Visit the [Legacy API](/developer/legacy_api?id=available-methods-and-alternatives) page to see what methods have been migrated and those that still only exist on the legacy API.
</p>

## Plugins

The deprecated v2 API `registerPlugin` function has been removed, so you'll need to perform a few simple changes outlined below if you'd like to continue using the **BackToCart**, **CoorInfo**, or **AreaOfInterest** plugins.

### Step 1: Add plugin script to host page header

The RAMP release bundle contains a folder **plugins** with the files **areasOfInterest.js**, **backToCart.js**, and **coordInfo.js**. Add the relevant script files to the **head** section of your host page.

```html
<html lang="en">
  <head>
  ...
  <script src="areasOfInterest.js"></script>
  <script src="backToCart.js"></script>
  <script src="coordInfo.js"></script>
  ...
  </head>
...
```

### Step 2: Register plugins on the RAMP element

We need to specify the plugin names RAMP needs to execute by adding a property on the RAMP map element named `rv-plugins`.

```html
<div is="rv-map" rv-plugins="areasOfInterest,backToCart,coordInfo"</div>
```

### Step 3 (for backToCart only): Add configuration to the RAMP config file

Add a new section in your RAMP configuration file to set your catalogue url for the **backToCart** plugin.

```json
{
  ...
  "plugins": {
    "backToCart": {
      "catalogueUrl": "backtocart-index.html?keys={RV_LAYER_LIST}"
    }
  }
  ...
}
```

## Enhanced Table

Previously called the data table, it is now a plugin. You can load it like any other plugin.

```html
<html lang="en">
  <head>
  ...
  <script src="enhancedTable.js"></script>
  <link rel="stylesheet" href="enhancedTable.css" />
  ...
  </head>
...
```

These files are located in the RAMP release bundle in the folder **plugins/enhancedTable**. Take note that we also included a **CSS** file named **enhancedTable.css**.

```html
<div is="rv-map" rv-plugins="enhancedTable"></div>
```

<p class="tip">
  The enhanced table is autoloaded by RAMP even if you do nothing. This is by design to ease migration issues as we roll out version 3.0.0 on this widely used feature.
</p>
