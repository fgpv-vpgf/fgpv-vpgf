(() => {
    // fields blueprints to be added to the table header for large layout and inside setting panel
    // `self` property is named so intentionally, as it will be passed on a scope to the FILTERS_TEMPLATE
    const FILTERS = {
        string: {
            name: 'rv-filter-string',
            scope: null,
            self: {
                isFunction: angular.isFunction,
                placeholder: 'filter.placeholder.string',
                change: angular.noop,
                prevent: angular.noop
            }
        },
        number: {
            name: 'rv-filter-number',
            scope: null,
            self: {
                isFunction: angular.isFunction,
                min: {
                    placeholder: 'filter.placeholder.min'
                },
                max: {
                    placeholder: 'filter.placeholder.max'
                },
                change: angular.noop,
                prevent: angular.noop
            }
        },
        date: {
            name: 'rv-filter-date',
            scope: null,
            self: {
                isFunction: angular.isFunction,
                min: {
                    placeholder: 'filter.placeholder.datemin'
                },
                max: {
                    placeholder: 'filter.placeholder.datemax'
                },
                change: angular.noop,
                prevent: angular.noop
            }
        }
    };

    // jscs:disable maximumLineLength
    const FILTERS_TEMPLATE = {
        string: (column) =>
            `<div class="rv-filter-string" ng-show="$root.isFiltersVisible">
                <md-input-container class="md-block" md-no-float flex>
                    <input ng-click="self.prevent($event)"
                            ng-keypress="self.prevent($event)"
                            ng-change="self.change('${column}', self.${column}.value)"
                            ng-model="self.${column}.value" class="ng-pristine ng-valid md-input ng-touched" placeholder="{{ self.placeholder | translate }}"/>
                </md-input-container>
            </div>`,
        number: (column) =>
            `<div class="rv-filter-number" ng-show="$root.isFiltersVisible">
                <md-input-container class="md-block" md-no-float flex>
                    <input rv-filters-number-only
                            ng-click="self.prevent($event)"
                            ng-change="self.change('${column}', self.${column}.min, self.${column}.max)"
                            ng-model="self.${column}.min" class="ng-pristine ng-valid md-input ng-touched" placeholder="{{ self.min.placeholder | translate }}" />
                </md-input-container>
                <md-input-container class="md-block" md-no-float flex>
                    <input rv-filters-number-only
                            ng-click="self.prevent($event)"
                            ng-change="self.change('${column}', self.${column}.min, self.${column}.max)"
                            ng-model="self.${column}.max" class="ng-pristine ng-valid md-input ng-touched" placeholder="{{ self.max.placeholder | translate }}" />
                </md-input-container>
            </div>`,
        date: (column) =>
            `<div class="rv-filter-date" ng-show="$root.isFiltersVisible">
                <md-datepicker
                    ng-click="self.prevent($event)"
                    ng-change="self.change('${column}', self.${column}.min, self.${column}.max)"
                    ng-model="self.${column}.min"
                    md-placeholder="{{ self.min.placeholder | translate }}">
                </md-datepicker>
                <md-datepicker
                    ng-click="self.prevent($event)"
                    ng-change="self.change('${column}', self.${column}.min, self.${column}.max)"
                    ng-model="self.${column}.max"
                    md-placeholder="{{ self.max.placeholder | translate }}">
                </md-datepicker>
            </div>`
    };
    // jscs:enable maximumLineLength

    /**
     * @module rvFiltersDefinition
     * @memberof app.ui
     * @restrict E
     * @description
     *
     * The `rvFiltersDefinition` directive for a filters setting panel.
     *
     */
    angular
        .module('app.ui.filters')
        .directive('rvFiltersDefinition', rvFiltersDefinition);

    /**
     * `rvFiltersDefinition` directive body.
     *
     * @function rvFiltersDefinition
     * @return {object} directive body
     */
    function rvFiltersDefinition(stateManager, events, $compile, filterService) {
        const directive = {
            restrict: 'A',
            template: '',
            replace: true,
            transclude: true,
            scope: { info: '=' },
            link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el, attr, ctrl, transclude) {

            // columns type with filters information
            const columnTypes = {
                esriFieldTypeString: {
                    type: 'string',
                    callback: 'onFilterStringChange',
                },
                esriFieldTypeDate: {
                    type: 'date',
                    callback: 'onFilterDateChange',
                },
                esriFieldTypeSmallInteger: {
                    type: 'number',
                    callback: 'onFilterNumberChange',
                },
                esriFieldTypeInteger: {
                    type: 'number',
                    callback: 'onFilterNumberChange',
                },
                esriFieldTypeSingle: {
                    type: 'number',
                    callback: 'onFilterNumberChange',
                },
                esriFieldTypeDouble: {
                    type: 'number',
                    callback: 'onFilterNumberChange',
                },
                esriFieldTypeOID: {
                    type: 'number',
                    callback: 'onFilterNumberChange',
                }
            };

            // use transclude to have access to filters inside ng-repeat in filters-setting-panel
            transclude(() => {
                if (!el[0].hasChildNodes() && typeof scope.self.info !== 'undefined') {
                    el.append(setFilter(scope.self.info));
                    scope.self.info.init = true;
                }
            });

            // wait for table to finish init before we create filters on table
            scope.$on(events.rvTableReady, () => {
                // if info === columns, set filters for datatables
                if (attr.info === 'columns') {
                    // datatables is created each time so add the filters
                    setFilters(el);
                }
            });

            /**
             * Filters initialization
             * @function setFilters
             * @private
             * @param {Object} el element to add filter to
             */
            function setFilters() {
                const table = filterService.getTable();
                const displayData = stateManager.display.filters.data;

                // make sure there is item inside columns (it is null first time it is run)
                const columns = displayData.columns !== null ? displayData.columns : [];

                columns.forEach(column => {
                    // get column directive
                    const filterDirective = setFilter(column);

                    // add to table
                    $(table.columns(`${column.data}:name`).header()[0]).append(filterDirective);
                });
            }

            /**
             * Set filter
             * @function setFilter
             * @private
             * @param {Object} column the column
             * @return {Object} filterDirective the directive for the filter
             */
            function setFilter(column) {
                const displayData = stateManager.display.filters.data;
                const columnEdit = displayData.fields.find(field => column.data === field.name);

                // set filters from field type
                // TODO: for thematic map value will have to come from config file.
                if (typeof columnEdit !== 'undefined') {
                    // get column info (type and callback function)
                    const columnInfo = columnTypes[columnEdit.type];

                    // set change action
                    const filter = FILTERS[columnInfo.type];
                    filter.self.change = filterService[columnInfo.callback];

                    // set prevent default sorting
                    filter.self.prevent = filterService.preventSorting;

                    // set filter initial value
                    filter.self[column] = column.filter;

                    // set scope
                    const filterScope = scope.$new(true);
                    filterScope.self = filter.self;
                    filter.scope = filterScope;
                    filter.scope.self[column.name] = column.filter;

                    // create directive
                    const template = FILTERS_TEMPLATE[columnInfo.type](column.name);
                    return $compile(template)(filter.scope);
                }
            }
        }
    }

    function Controller(filterService) {
        'ngInject';
        const self = this;

        self.filterService = filterService;
    }
})();
