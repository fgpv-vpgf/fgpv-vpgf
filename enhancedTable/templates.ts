export const SEARCH_TEMPLATE = `
<div ng-controller="SearchCtrl as ctrl" class="rv-table-search table-control">
    <md-input-container md-no-float class="rv-table-search table-control">
        <input
            ng-model="ctrl.searchText"
            ng-keyup="ctrl.updatedSearchText()"
            placeholder="{{ 'plugins.enhancedTable.search.placeholder' | translate }}"/>
    </md-input-container>
    <md-icon ng-if="ctrl.searchText.length > 2" ng-click="ctrl.clearSearch()" md-svg-src="navigation:close"></md-icon>
    <md-icon ng-if="ctrl.searchText.length <= 2" md-svg-src="action:search">
        <md-tooltip>{{ 'plugins.enhancedTable.search.placeholder' | translate }}</md-tooltip>
    </md-icon>
    <span class="rv-button-divider"></span>
</div>
`;

export const CLEAR_FILTERS_TEMPLATE = `
<div class="table-control">
    <md-button
        ng-controller="ClearFiltersCtrl as ctrl"
        aria-label="{{ 'plugins.enhancedTable.table.filter.clear' | translate }}"
        class="md-icon-button black"
        rv-help="table-clear-button"
        ng-click="ctrl.clearFilters()"
        ng-disabled="ctrl.noActiveFilters()">
        <md-tooltip>{{ 'plugins.enhancedTable.table.filter.clear' | translate }}</md-tooltip>
        <md-icon md-svg-src="community:filter-remove"></md-icon>
    </md-button>
</div>
`;

export const APPLY_TO_MAP_TEMPLATE = `
<div class="table-control">
    <md-button
        ng-controller="ApplyToMapCtrl as ctrl"
        aria-label="{{ 'plugins.enhancedTable.table.filter.apply' | translate }}"
        class="md-icon-button black"
        ng-click="ctrl.applyToMap()"
        ng-disabled="!ctrl.filtersChanged()">
        <md-tooltip>{{ 'plugins.enhancedTable.table.filter.apply' | translate }}</md-tooltip>
        <md-icon md-svg-src="action:map-refresh"></md-icon>
    </md-button>
</div>
`;

export const COLUMN_VISIBILITY_MENU_TEMPLATE = `
<md-menu-bar class="table-control" ng-controller="ColumnVisibilityMenuCtrl as ctrl">
    <md-menu md-position-mode="target-right target">
        <md-button
            aria-label="Menu"
            class="md-icon-button black"
            ng-click="$mdOpenMenu($event)">
            <md-tooltip>{{ 'plugins.enhancedTable.table.hideColumns' | translate }}</md-tooltip>
            <md-icon md-svg-src="community:format-list-checks"></md-icon>
        </md-button>
        <md-menu-content class="rv-menu rv-dense">
            <md-menu-item ng-repeat="col in ctrl.columnVisibilities">
                <md-button ng-click="ctrl.toggleColumn(col)" aria-label="{{ col.title }}" md-prevent-menu-close="md-prevent-menu-close">
                    <span style='flex-basis: auto; overflow-wrap:normal;'>{{col.title}}</span>
                    <md-icon md-svg-icon="action:done" ng-if="col.visibility"></md-icon>
                </md-button>
            </md-menu-item>
        </md-menu-content>
    </md-menu>
</md-menu-bar>
`;

export const MENU_TEMPLATE = `
<md-menu-bar class="table-control" ng-controller="MenuCtrl as ctrl">
    <md-menu md-position-mode="target-right target">
        <md-button
            aria-label="Menu"
            class="md-icon-button black"
            ng-click="$mdOpenMenu($event)">
            <md-icon md-svg-src="navigation:more_vert"></md-icon>
            <md-tooltip>{{ 'plugins.enhancedTable.menu.options' | translate }}</md-tooltip>
        </md-button>
        <md-menu-content class="rv-menu rv-dense">
            <md-menu-item type="radio" ng-model="ctrl.maximized" value="false" ng-click="ctrl.setSize(ctrl.maximized)" ng-if="!sizeDisabled" rv-right-icon="none">
                {{ 'plugins.enhancedTable.menu.split' | translate }}
            </md-menu-item>
            <md-menu-item type="radio" ng-model="ctrl.maximized" value="true" ng-click="ctrl.setSize(ctrl.maximized)"  ng-if="!sizeDisabled" rv-right-icon="none">
                {{ 'plugins.enhancedTable.menu.max' | translate }}
            </md-menu-item>
            <md-menu-divider class="rv-lg"></md-menu-divider>
            <md-menu-item type="checkbox" ng-model="ctrl.filterByExtent" ng-click="ctrl.filterExtentToggled()" rv-right-icon="community:filter">
                {{ 'plugins.enhancedTable.menu.filter.extent' | translate }}
            </md-menu-item>
            <md-menu-item type="checkbox" ng-model="ctrl.showFilter" ng-click="ctrl.toggleFilters()" rv-right-icon="community:filter">
                {{ 'plugins.enhancedTable.menu.filter.show' | translate }}
            </md-menu-item>
            <md-menu-divider></md-menu-divider>
            <md-menu-item ng-if='ctrl.printEnabled'>
                <md-button ng-click="ctrl.print()">
                    <md-icon md-svg-icon="action:print"></md-icon>
                    {{ 'plugins.enhancedTable.menu.print' | translate }}
                </md-button>
            </md-menu-item>
            <md-menu-item>
                <md-button ng-click="ctrl.export()">
                    <md-icon md-svg-icon="editor:insert_drive_file"></md-icon>
                    {{ 'plugins.enhancedTable.menu.export' | translate }}
                </md-button>
            </md-menu-item>
        </md-menu-content>
    </md-menu>
</md-menu-bar>`;

export const MOBILE_MENU_BTN_TEMPLATE = `
<div class="mobile-table-control">
    <md-button
        ng-controller="MobileMenuCtrl as ctrl"
        class="md-icon-button black"
        ng-click="ctrl.toggleMenu()">
        <md-icon md-svg-src="navigation:more_vert"></md-icon>
    </md-button>
</div>`;

export const MOBILE_MENU_TEMPLATE = `
<div class="mobile-table-control mobile-table-menu">
    <div ng-if="visible" class="panel-controls">
        <span ng-if="searchEnabled">${SEARCH_TEMPLATE}</span>
        ${COLUMN_VISIBILITY_MENU_TEMPLATE}
        ${CLEAR_FILTERS_TEMPLATE}
        ${APPLY_TO_MAP_TEMPLATE}
        ${MENU_TEMPLATE}
    </div>
</div>`;

export const RECORD_COUNT_TEMPLATE = `
<p class="rv-record-count" title="{{ 'filter.default.label.info' | translate:{range: scrollRecords, total: totalRecords, max: totalRecords} }}" >
    <span class="filterRecords" ng-if="filtered == false">{{ 'filter.default.label.info' | translate:{range: scrollRecords, total: totalRecords, max: totalRecords} }}</span>
    <span class="filterRecords" ng-if="filtered == true">{{ 'filter.default.label.filtered' | translate:{range: scrollRecords, total: shownRecords, max: totalRecords} }}</span>
</p>`;

export const DETAILS_TEMPLATE = (oid) =>
    `<button ng-controller='DetailsAndZoomCtrl as ctrl' ng-click='ctrl.openDetails(${oid})' md-ink-ripple class='md-icon-button rv-icon-16 md-button ng-scope enhanced-table-details' aria-label="{{ 'plugins.enhancedTable.detailsAndZoom.details' | translate }}">
        <md-icon md-svg-src="action:description" aria-hidden='false' class='ng-scope' role='img'>
            <md-tooltip  md-direction="top">{{ 'plugins.enhancedTable.detailsAndZoom.details' | translate }}</md-tooltip>
        </md-icon>
    </button>`;

export const ZOOM_TEMPLATE = (oid) =>
    `<button ng-controller='DetailsAndZoomCtrl as ctrl' ng-click='ctrl.zoomToFeature(${oid})'  md-ink-ripple class='md-icon-button rv-icon-16 md-button ng-scope enhanced-table-zoom' aria-label="{{ 'plugins.enhancedTable.detailsAndZoom.zoom' | translate }}">
        <md-icon md-svg-src="action:zoom_in" aria-hidden='false'>
            <md-tooltip  md-direction="top">{{ 'plugins.enhancedTable.detailsAndZoom.zoom' | translate }}</md-tooltip>
        </md-icon>
    </button>`;

export const NUMBER_FILTER_TEMPLATE = (value, isStatic) => {
    const minVal = (value === undefined) ? '' : (value.split(',')[0] !== 'null') ? parseInt(value.split(',')[0]) : '';
    const maxVal = (value === undefined) ? '' : (value.split(',')[1] !== 'null') ? parseInt(value.split(',')[1]) : '';
    if (isStatic === false) {
        return `<input class="rv-min" style="width:50%" type="text" placeholder="min" value='${minVal}'/>
         <input class="rv-max" style="width:50%" type="text" placeholder="max" value='${maxVal}'/>`;
    }
    return `<input class="rv-min" style="width:45%; opacity: 0.4" type="text" placeholder="min" value='${minVal}' disabled/>
         <input class="rv-max" style="width:45%; opacity: 0.4" type="text" placeholder="max" value='${maxVal}' disabled/>`;

}

export const DATE_FILTER_TEMPLATE = (value, isStatic) => {

    if (isStatic === true) {
        return `<span>
                 <md-datepicker md-placeholder="{{ 'plugins.enhancedTable.columnFilters.date.min' | translate }}" ng-model='min' ng-change="minChanged()" ng-disabled='true' style='opacity: 0.4'></md-datepicker>
                 <md-datepicker md-placeholder="{{ 'plugins.enhancedTable.columnFilters.date.max' | translate }}" ng-model='max' ng-change="maxChanged()" ng-disabled='true' style='opacity: 0.4'></md-datepicker>
             </span>`;
    }
    return `<span>
                 <md-datepicker md-placeholder="{{ 'plugins.enhancedTable.columnFilters.date.min' | translate }}" ng-model='min' ng-change="minChanged()"></md-datepicker>
                 <md-datepicker md-placeholder="{{ 'plugins.enhancedTable.columnFilters.date.max' | translate }}" ng-model='max' ng-change="maxChanged()"></md-datepicker>
             </span>`;
}

export const TEXT_FILTER_TEMPLATE = (value, isStatic) => {
    value = (value === undefined) ? '' : value;

    if (isStatic) {
        return `<input class='rv-input' type="text" placeholder="{{ 'plugins.enhancedTable.columnFilters.text' | translate }}"' disabled style='opacity: 0.4' value='${value}'/>`
    }
    return `<input class='rv-input' ng-model='input' ng-change='inputChanged()' type="text" placeholder="{{ 'plugins.enhancedTable.columnFilters.text' | translate }}"' value='${value}'/>`
};

export const CUSTOM_HEADER_TEMPLATE = (displayName: string) => `
<div class="column-header">
    <md-button class="custom-header-label">${displayName}</md-button>
    <md-icon ng-if="sortAsc" class="rv-sort-arrow" md-svg-icon="navigation:arrow_upward"></md-icon>
    <md-icon ng-if="sortDesc" class="rv-sort-arrow" md-svg-icon="navigation:arrow_downward"></md-icon>
    <div class="arrows"></div>
    <div class="reorder-icons">
        <md-button class="reorder-button md-icon-button move-left" ng-disabled="min">
            <md-icon ng-style="{ 'font-size': '16px', height: '16px' }" md-svg-icon="hardware:keyboard_arrow_left"></md-icon>
        </md-button>
        <md-button class="reorder-button md-icon-button move-right" ng-disabled="max">
            <md-icon ng-style="{ 'font-size': '16px', height: '16px' }" md-svg-icon="hardware:keyboard_arrow_right"></md-icon>
        </md-button>
    </div>
</div>
`;

export const SELECTOR_FILTER_TEMPLATE = (value, isStatic) => {
    if (isStatic === true) {
        return `<md-select placeholder="{{ 'plugins.enhancedTable.columnFilters.selector' | translate }}" multiple="{{true}}" md-on-close='selectionChanged() style='height: 20px; opacity: 0.4; color: lightgrey' ng-model="selectedOptions" ng-disabled='true'>
                         <md-option ng-value="option" ng-repeat="option in options">{{ option }}</md-option>
                     </md-select>`;
    } else {
        return `<md-select placeholder="{{ 'plugins.enhancedTable.columnFilters.selector' | translate }}" multiple="{{true}}" style='height: 20px' md-on-close='selectionChanged()' ng-model="selectedOptions">
                         <md-option ng-value="option" ng-repeat="option in options">{{ option }}</md-option>
                     </md-select>`;
    }
}

export const PRINT_TABLE = (title, cols, rws) => {

    // make headers with the column names of the currently displayed columns
    let headers = ``;
    const columnNames = Object.keys(cols).map(column => cols[column]);
    columnNames.forEach(columnName => {
        if (columnName !== 'SHAPE' && columnName !== ' ' && columnName !== '') {
            headers += `<th style='width:200%; padding: 5px; border-bottom: 2px solid #000000'><div class='cell'>${columnName}</div></th>`;
        }
    });

    const columns = `<thead><tr>` + headers + `</tr></thead>`;

    // make rows
    // make sure row attributes are only pushed for columns that are currently displayed.
    const rows = `<tbody>${rws.map((rowAttributes: any) => {
        let eachRow = Object.keys(cols).map(attribute => rowAttributes.data[attribute]);
        return `<tr>${eachRow.map((r: any) => {
            return `<td><div class='cell'>${r}</div></td>`;
        }).join('')}</tr>`;
    }).join('')}</tbody>`;

    // return formatted HTML table
    return `<head>
                <style>
                    table {
                        font-family: arial, sans-serif;
                        border-collapse: collapse;
                    }
                    td, th {
                        border-bottom: 1px solid #dddddd;
                        text-align: left;
                        padding: 3px;
                        padding-right: 50px;
                        min-width: 150px;
                    }
                    h1{
                        font-family: arial, sans-serif;
                    }
                    .cell{
                        min-height: 40px;
                    }
                </style>
            </head>
            <body class ='dt-print-view'>
                <div>
                    <h1 class="md-title" style='padding:8px;'>Features: ${title}</h1>
                    <table>${columns}${rows}</table>
                </div>
            </body>`;
}

export const TABLE_UPDATE_TEMPLATE =
    `<md-toast class="table-toast">
        <span class="md-toast-text flex">{{ 'filter.default.label.outOfDate' | translate }}</span>
        <md-button class="md-highlight" ng-click="reloadTable()">{{ 'filter.default.action.outOfDate' | translate }}</md-button>
        <md-button ng-click="closeToast()">{{ 'filter.default.action.hide' | translate }}</md-button>
    </md-toast>`;

export const TABLE_LOADING_TEMPLATE = (legendEntry) =>
    // hhite match parent
    `<div class="rv-table-splash" style="position:inherit">
        <div class="rv-splash-count">
            <span class="rv-splash-count-current">${Math.floor(legendEntry.loadedFeatureCount)}</span>
                <svg class="rv-splash-count-slash" height="50" width="25">
                    <line x1="0" y1="50" x2="25" y2="0"></line>
                </svg>
            <span class="rv-splash-count-total">${legendEntry.featureCount}</span>
        </div>
        <span class="rv-splash-message md-caption">{{ ${Math.floor(legendEntry.loadedFeatureCount)} < ${legendEntry.featureCount} ? 'table.splash.loadingdata' : 'table.splash.buildingtable' | translate }} </span>
        <md-progress-linear class="rv-progress-top" md-mode="indeterminate" ng-show="true"></md-progress-linear>
    </div>`;
