export const SEARCH_TEMPLATE = `
<md-input-container ng-controller="SearchCtrl as searchCtrl" md-no-float class="rv-table-search md-block">
    <input
        aria-label="Search
        ng-model="searchCtrl.searchText"
        ng-keyup="searchCtrl.updatedSearchText()"
        placeholder="Search Text">
    <md-button ng-show="searchCtrl.searchText.length > 2" ng-click="">
        <md-icon md-svg-src="navigation:close"></md-icon>
    </md-button>
    <md-icon md-svg-src="action:search">
        <md-tooltip>Search</md-tooltip>
    </md-icon>
</md-input-container>

<span class="rv-table-divider"></span>
`;

export const MENU_TEMPLATE = `
<md-menu-bar ng-controller="MenuCtrl as ctrl">
    <md-menu md-position-mode="target-right target">

        <md-button
            aria-label="Menu"
            class="md-icon-button black rv-button-24"
            ng-click="$mdOpenMenu($event)">
            <md-icon md-svg-src="navigation:more_vert"></md-icon>
        </md-button>

        <md-menu-content rv-trap-focus="{{::ctrl.appID}}" class="rv-menu rv-dense" width="5">

            <md-menu-item type="radio" ng-model="ctrl.maximized" value="false" ng-click="ctrl.setSize(ctrl.maximized)" rv-right-icon="none">
                Split View
            </md-menu-item>

            <md-menu-item type="radio" ng-model="ctrl.maximized" value="true" ng-click="ctrl.setSize(ctrl.maximized)" rv-right-icon="none">
                Maximize
            </md-menu-item>

            <md-menu-divider class="rv-lg"></md-menu-divider>

            <md-menu-item type="checkbox" ng-model="self.filter.isActive" ng-click="self.applyFilter(self.filter.isActive)" rv-right-icon="community:filter">
                Filter by Extent
            </md-menu-item>

            <md-menu-item type="checkbox" ng-model="self.filter.isOpen" ng-click="self.showFilters()" rv-right-icon="community:filter">
                Show Filters
            </md-menu-item>

            <md-menu-divider></md-menu-divider>

            <md-menu-item>
                <md-button ng-click="ctrl.print()">
                    <md-icon md-svg-icon="action:print"></md-icon>
                    Print
                </md-button>
            </md-menu-item>

            <md-menu-item>
                <md-button ng-click="ctrl.export()">
                    <md-icon md-svg-icon="editor:insert_drive_file"></md-icon>
                    Export
                </md-button>
            </md-menu-item>

        </md-menu-content>
    </md-menu>
</md-menu-bar>
`;
