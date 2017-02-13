![](./images/technical/datatable-location.png)

Also known as a grid view, this component uses the [DataTables](https://datatables.net/) table plug-in for jQuery. The code source we'll be discussing here can be found in the `src/app/ui/filters/` folder.

### filters-default.directive.js

All aspects of table rendering happen here. Given some data we initialize a DataTable instance. For every row we also add two buttons; details and zoom. You can see these buttons rendered visually in the screenshot above (orange box). We also need to handle focus management (for accessibility) and language support. Lastly, we implement a scrolling extention for pageination, and employ some minor alterations on the data so that it is visually appealing.

This file may seem more complex than it actually is; and perhaps a refactor is in order in the future. But the main takeaway here is that there are challenges coordinating large amounts of data, allowing data to be filtered, supporting multiple languages, and implementing custom row buttons. By and large, the order in which these actions happen is vitally important. I encourage you to glance over the code a few times first, then read over the inline documentation. You'll start to see all the parts (albeit spread out) to come together. 

There are two main functions in the file that divide what goes where - the **link** and **controller** functions. 

The **link** function is responsible for creating the DataTable instance, to define the details and zoom buttons (and their actions), as well as handling focus management for accessibility.

The **controller** function on the other hand handles language switching logic and sets up various watchers which:
- On language change, redraw the table
- On print or export button click perform the appropriate action
- Watch `filterService` for changes to the raw table data and redraw or destory the table as needed

Of note, this directive should not alter or gather any data apart from what is given to it from `filterService`. 

### filters.service.js

This service provides `filters-default.directive.js` with the data to be displayed in the table. Currently the service watches the `stateManager.display.filters.data` value for either data being propulated, or being removed. If data is being populated, it will begin filtering the data. At this time, only filter by extent is supported, however any type of filtering should be done here. Since we use the DataTable extension and we don't want to delete rows from the actual data, we push a custom filtering function to `$.fn.dataTable.ext.search`.

This service communicates changes through its `filterTimeStamps` object. There are three properties; `onCreated`, `onChanged`, and `onDeleted`. The intent is for outside directives and services (like `filters-default.directive.js`) to watch these timestamps for changes. When they change you can then take appropriate action. For example, when a user pans the map and filter by extent is active, `onChanged` with update with a new timestamp. This tells `filters-default.directive.js` to redraw the map.

The `queryMapserver` function handles the filter by extent implementation. It performs an ESRI query for all features with a spatial intersection with the current extent. You can refer to the inline documentation for further details. 

### filters-default-menu.directive.js

Simple directive which defines the popup menu items (visually represented in the above screenshot in blue).