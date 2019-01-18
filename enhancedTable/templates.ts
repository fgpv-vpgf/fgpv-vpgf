export const SEARCH_TEMPLATE = `
<md-input-container ng-controller="SearchCtrl as ctrl" md-no-float class="rv-table-search md-block table-control">
    <input
        ng-model="ctrl.searchText"
        ng-keyup="ctrl.updatedSearchText()"
        placeholder="{{ 't.search.placeholder' | translate }}" />
    <md-icon ng-if="ctrl.searchText.length > 2" ng-click="ctrl.clearSearch()" md-svg-src="navigation:close"></md-icon>
    <md-icon ng-if="ctrl.searchText.length <= 2" md-svg-src="action:search">
        <md-tooltip>{{ 't.search.placeholder' | translate }}</md-tooltip>
    </md-icon>
</md-input-container>
<span class="rv-table-divider"></span>
`;

export const CLEAR_FILTERS_TEMPLATE = `
<div class="table-control">
    <md-button
        ng-controller="ClearFiltersCtrl as ctrl"
        aria-label="{{ 't.table.filter.clear' | translate }}"
        class="md-icon-button black rv-button-24"
        rv-help="table-clear-button"
        ng-click="ctrl.clearFilters()"
        ng-disabled="!ctrl.anyFilters()">
        <md-tooltip>{{ 't.table.filter.clear' | translate }}</md-tooltip>
        <md-icon md-svg-src="community:filter-remove"></md-icon>
    </md-button>
</div>
`;

export const COLUMN_VISIBILITY_MENU_TEMPLATE = `
<md-menu-bar class="table-control" ng-controller="ColumnVisibilityMenuCtrl as ctrl">
    <md-menu md-position-mode="target-right target">
        <md-button
            aria-label="Menu"
            class="md-icon-button black rv-button-24"
            ng-click="$mdOpenMenu($event)">
            <md-tooltip>{{ 't.table.hideColumns' | translate }}</md-tooltip>
            <md-icon md-svg-src="community:format-list-checks"></md-icon>
        </md-button>
        <md-menu-content rv-trap-focus="{{::ctrl.appID}}" class="rv-menu rv-dense" width="4">
            <md-menu-item ng-repeat="col in ctrl.columnVisibilities">
                <md-button ng-click="ctrl.toggleColumn(col)" aria-label="{{ col.title }} " md-prevent-menu-close="md-prevent-menu-close">
                    {{col.title}}
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
            class="md-icon-button black rv-button-24"
            ng-click="$mdOpenMenu($event)">
            <md-icon md-svg-src="navigation:more_vert"></md-icon>
        </md-button>
        <md-menu-content rv-trap-focus="{{::ctrl.appID}}" class="rv-menu rv-dense" width="5">

            <md-menu-item type="radio" ng-model="ctrl.maximized" value="false" ng-click="ctrl.setSize(ctrl.maximized)" ng-if="!sizeDisabled" rv-right-icon="none">
                {{ 't.menu.split' | translate }}
            </md-menu-item>
            <md-menu-item type="radio" ng-model="ctrl.maximized" value="true" ng-click="ctrl.setSize(ctrl.maximized)"  ng-if="!sizeDisabled" rv-right-icon="none">
                {{ 't.menu.max' | translate }}
            </md-menu-item>
            <md-menu-divider class="rv-lg"></md-menu-divider>
            <md-menu-item type="checkbox" ng-model="self.filter.isActive" ng-click="self.applyFilter(self.filter.isActive)" rv-right-icon="community:filter">
                {{ 't.menu.filter.extent' | translate }}
            </md-menu-item>
            <md-menu-item type="checkbox" ng-model="ctrl.showFilter" ng-click="ctrl.toggleFilters()" rv-right-icon="community:filter">
                {{ 't.menu.filter.show' | translate }}
            </md-menu-item>
            <md-menu-divider></md-menu-divider>
            <md-menu-item>
                <md-button ng-click="ctrl.print()">
                    <md-icon md-svg-icon="action:print"></md-icon>
                    {{ 't.menu.print' | translate }}
                </md-button>
            </md-menu-item>
            <md-menu-item>
                <md-button ng-click="ctrl.export()">
                    <md-icon md-svg-icon="editor:insert_drive_file"></md-icon>
                    {{ 't.menu.export' | translate }}
                </md-button>
            </md-menu-item>
        </md-menu-content>
    </md-menu>
</md-menu-bar>
`;

export const MOBILE_MENU_BTN_TEMPLATE = `
<div class="mobile-table-control">
    <md-button
        ng-controller="MobileMenuCtrl as ctrl"
        class="md-icon-button black rv-button-24"
        ng-click="ctrl.toggleMenu()">
        <md-icon md-svg-src="navigation:more_vert"></md-icon>
    </md-button>
</div>`;

export const MOBILE_MENU_TEMPLATE = `
<div class="mobile-table-control mobile-table-menu">
    <div ng-if="visible" class="panel-controls">
        <span ng-if="searchEnabled">${SEARCH_TEMPLATE}</span>
        ${CLEAR_FILTERS_TEMPLATE}
        ${COLUMN_VISIBILITY_MENU_TEMPLATE}
        ${MENU_TEMPLATE}
    </div>
</div>`;

export const RECORD_COUNT_TEMPLATE = `
<p class="record-count">
    <span class="scrollRecords">{{ scrollRecords }}</span> of
    <span class="filterRecords">{{ filterRecords }}</span>
</p>`;

export const DETAILS_TEMPLATE = (oid) =>
    `<button ng-controller='DetailsAndZoomCtrl as ctrl' ng-click='ctrl.openDetails(${oid})' md-ink-ripple class='md-icon-button rv-icon-16 rv-button-24 md-button ng-scope enhanced-table-details' aria-label="{{ 't.detailsAndZoom.details' | translate }}">
        <md-icon md-svg-src="action:description" aria-hidden='false' class='ng-scope' role='img'>
            <md-tooltip  md-direction="top">{{ 't.detailsAndZoom.details' | translate }}</md-tooltip>
        </md-icon>
    </button>`;

export const ZOOM_TEMPLATE = (oid) =>
    `<button ng-controller='DetailsAndZoomCtrl as ctrl' ng-click='ctrl.zoomToFeature(${oid})'  md-ink-ripple class='md-icon-button rv-icon-16 rv-button-24 md-button ng-scope enhanced-table-zoom' aria-label="{{ 't.detailsAndZoom.zoom' | translate }}">
        <md-icon md-svg-src="action:zoom_in" aria-hidden='false'>
            <md-tooltip  md-direction="top">{{ 't.detailsAndZoom.zoom' | translate }}</md-tooltip>
        </md-icon>
    </button>`;

export const NUMBER_FILTER_TEMPLATE = (value, isStatic) => {
    const minVal = (value === undefined) ? '' : (value.split(',')[0] !== '') ? parseInt(value.split(',')[0]) : '';
    const maxVal = (value === undefined) ? '' : (value.split(',')[1] !== '') ? parseInt(value.split(',')[1]) : '';
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
                 <md-datepicker md-placeholder="{{ 't.columnFilters.date.min' | translate }}" ng-model='min' ng-change="minChanged()" ng-disabled='true' style='opacity: 0.4'></md-datepicker>
                 <md-datepicker md-placeholder="{{ 't.columnFilters.date.max' | translate }}" ng-model='max' ng-change="maxChanged()" ng-disabled='true' style='opacity: 0.4'></md-datepicker>
             </span>`;
    }
    return `<span>
                 <md-datepicker md-placeholder="{{ 't.columnFilters.date.min' | translate }}" ng-model='min' ng-change="minChanged()"></md-datepicker>
                 <md-datepicker md-placeholder="{{ 't.columnFilters.date.max' | translate }}" ng-model='max' ng-change="maxChanged()"></md-datepicker>
             </span>`;
}

export const TEXT_FILTER_TEMPLATE = (value, isStatic) => {
    value = (value === undefined) ? '' : value;

    if (isStatic) {
        return `<input class='rv-input' type="text" placeholder="{{ 't.columnFilters.text' | translate }}"' disabled style='opacity: 0.4' value='${value}'/>`
    }
    return `<input class='rv-input' ng-model='input' ng-change='inputChanged()' type="text" placeholder="{{ 't.columnFilters.text' | translate }}"' value='${value}'/>`
};

export const CUSTOM_HEADER_TEMPLATE = (displayName: string) => `
<div>
    <md-button md-no-ink class="custom-header-label">${displayName}</md-button>
    <md-icon ng-if="sortAsc" md-svg-icon="navigation:arrow_upward"></md-icon>
    <md-icon ng-if="sortDesc" md-svg-icon="navigation:arrow_downward"></md-icon>
    <div class="reorder-icons">
        <md-button class="reorder-button md-icon-button move-left" md-no-ink ng-disabled="min">
            <md-icon ng-style="{ 'font-size': '16px', height: '16px' }" md-svg-icon="hardware:keyboard_arrow_left"></md-icon>
        </md-button>
        <md-button class="reorder-button md-icon-button move-right" md-no-ink ng-disabled="max">
            <md-icon ng-style="{ 'font-size': '16px', height: '16px' }" md-svg-icon="hardware:keyboard_arrow_right"></md-icon>
        </md-button>
    </div>
</div>
`;

export const SELECTOR_FILTER_TEMPLATE = (value, isStatic) => {
    if (isStatic === true) {
        return `<md-select placeholder="{{ 't.columnFilters.selector' | translate }}" multiple="{{true}}" md-on-close='selectionChanged() style='height: 20px; opacity: 0.4; color: lightgrey' ng-model="selectedOptions" ng-disabled='true'>
                         <md-option ng-value="option" ng-repeat="option in options">{{ option }}</md-option>
                     </md-select>`;
    } else {
        return `<md-select placeholder="{{ 't.columnFilters.selector' | translate }}" multiple="{{true}}" style='height: 20px' md-on-close='selectionChanged()' ng-model="selectedOptions">
                         <md-option ng-value="option" ng-repeat="option in options">{{ option }}</md-option>
                     </md-select>`;
    }
}
