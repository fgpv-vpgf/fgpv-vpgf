import { Grid } from 'ag-grid/main';

const SEARCH_TEMPLATE = `
<md-input-container ng-controller="SearchCtrl as ctrl" md-no-float class="rv-table-search md-block">
    <input
        aria-label="Search
        ng-model="self.searchText"
        ng-keyup="self.search()"
        placeholder="Search Text">
    <md-button ng-show="self.searchText.length > 2" ng-click="self.clear()">
        <md-icon md-svg-src="navigation:close"></md-icon>
    </md-button>
    <md-icon md-svg-src="action:search">
        <md-tooltip>Search</md-tooltip>
    </md-icon>
</md-input-container>

<span class="rv-table-divider"></span>
`;

const MENU_TEMPLATE = `
<md-menu-bar ng-controller="MenuCtrl as ctrl">
    <md-menu md-position-mode="target-right target">

        <md-button
            aria-label="Menu"
            class="md-icon-button black rv-button-24"
            ng-click="$mdOpenMenu($event)">
            <md-icon md-svg-src="navigation:more_vert"></md-icon>
        </md-button>

        <md-menu-content rv-trap-focus="{{::ctrl.appID}}" class="rv-menu rv-dense" width="5">

            <md-menu-item type="radio" ng-model="self.tableMode" value="default" ng-click="self.setMode(self.tableMode)" rv-right-icon="none">
                Split View
            </md-menu-item>

            <md-menu-item type="radio" ng-model="self.tableMode" value="full" ng-click="self.setMode(self.tableMode)" rv-right-icon="none">
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
                <md-button ng-click="self.dataPrint()">
                    <md-icon md-svg-icon="action:print"></md-icon>
                    Print
                </md-button>
            </md-menu-item>

            <md-menu-item>
                <md-button ng-click="self.dataExportCSV()">
                    <md-icon md-svg-icon="editor:insert_drive_file"></md-icon>
                    Export
                </md-button>
            </md-menu-item>

        </md-menu-content>
    </md-menu>
</md-menu-bar>
`;

export class PanelManager {
    constructor(mapApi: any) {
        this.mapApi = mapApi;
        this.panel = this.mapApi.createPanel(this.id);
        this.tableContent = $(`<div rv-focus-exempt></div>`);

        this.panel.panelContents.css({
            top: '0px',
            left: '410px',
            right: '0px',
            bottom: '0px'
        });

        this.panel.panelBody.addClass('ag-theme-balham');

        this.panel.controls = this.header;
        this.panel.content = new this.panel.container(this.tableContent);
    }

    open(tableOptions: any, layer: any) {
        const controls = this.panel.controls;
        controls.push(new this.panel.container(`<h2>Features: ${layer.name}</h2>`));
        this.panel.controls = controls;

        this.tableContent.empty();
        new Grid(this.tableContent[0], tableOptions);
        this.panel.open();
    }

    get id(): string {
        this._id = this._id ? this._id : 'fancyTablePanel-' + Math.floor(Math.random() * 1000000 + 1) + Date.now();
        return this._id;
    }

    get header(): any[] {
        this.angularHeader();

        const menuBtn = new this.panel.container(MENU_TEMPLATE);
        menuBtn.element.css('float', 'right');

        const closeBtn = new this.panel.button('X');
        closeBtn.element.css('float', 'right');

        const searchBar = new this.panel.container(SEARCH_TEMPLATE);
        searchBar.element.css('float', 'right');

        return [closeBtn, menuBtn, searchBar];
    }

    angularHeader() {
        const that = this;

        this.mapApi.agControllerRegister('SearchCtrl', function() {});

        this.mapApi.agControllerRegister('MenuCtrl', function($mdDialog, $scope) {
            this.appID = that.mapApi.id;

            var originatorEv;

            this.openMenu = function($mdMenu, ev) {
                originatorEv = ev;
                $mdMenu.open(ev);
            };

            this.notificationsEnabled = true;
            this.toggleNotifications = function() {
                this.notificationsEnabled = !this.notificationsEnabled;
            };

            this.redial = function() {
                $mdDialog.show(
                    $mdDialog
                        .alert()
                        .targetEvent(originatorEv)
                        .clickOutsideToClose(true)
                        .parent('body')
                        .title('Suddenly, a redial')
                        .textContent('You just called a friend; who told you the most amazing story. Have a cookie!')
                        .ok('That was easy')
                );

                originatorEv = null;
            };

            this.checkVoicemail = function() {
                // This never happens.
            };
        });
    }
}

export interface PanelManager {
    panel: any;
    mapApi: any;
    tableContent: JQuery<HTMLElement>;
    _id: string;
}
