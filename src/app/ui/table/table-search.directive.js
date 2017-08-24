const templateUrl = require('./search.html');

/**
 * @module rvTableSearch
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTableSearch` directive let user enter text for a global search.
 *
 */
angular
    .module('app.ui')
    .directive('rvTableSearch', rvTableSearch);

/**
 * `rvTableSearch` directive body.
 *
 * @function rvTableSearch
 * @return {object} directive body
 */
function rvTableSearch(tableService, stateManager, $rootScope, events) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, el) {
        // wait until table is ready. If not, input is not created yet
        $rootScope.$on(events.rvTableReady, () => {
            el.find('input').on('focus', () => {
                changeColumnsName('data');
            });

            el.find('input').on('blur', () => {
                changeColumnsName('title');
            });
        });
    }

    /**
     * On search input focus show column field name, on blur show column title
     *
     * @function changeColumnsName
     * @param   {String}   value   value to use to show column name (data = data source and title = alias name)
     */
    function changeColumnsName(value) {
        const columns = stateManager.display.table.data.columns;

        angular.element(tableService.getTable().header()).find('th').each((i, el) => {
            if (columns[i].data !== 'rvSymbol' && columns[i].data !== 'rvInteractive') {
                // TODO check if needed
                //const index = el.innerHTML.indexOf('<div');
                //el.innerHTML = `${columns[i][value]}${el.innerHTML.substring(index, el.innerHTML.length)}`;

                const columnName = el.getElementsByTagName('span')[0];
                const column = columns.find(col => col.title === columnName.getAttribute('data-rv-column'));
                columnName.textContent = column[value];
            }
        });
    }
}

function Controller(tableService, debounceService, $timeout, $rootElement, stateManager, $rootScope, events, $scope) {
    'ngInject';
    const self = this;

    self.searchText = '';
    self.search = debounceService.registerDebounce(search, 1200, false);
    self.clear = clear;

    self.service = tableService;
    self.searchFilter = {};

    // all test operations for filtering (\\ is use to escape character when we remove the operand)
    const operators = {
        '\\<': (a, b) => a < b[0],
        '\\<=': (a, b) => a <= b[0],
        '\\>': (a, b) => a > b[0],
        '\\>=': (a, b) => a >= b[0],
        '\\[|]': (a, b) => a >= b[0] && a <= b[1],
        string: (a, b) => b.test(a.toUpperCase())
    };

    $rootScope.$on(events.rvTableReady, () => {
        // set global search from saved state
        self.searchText = stateManager.display.table.data.filter.globalSearch;

        // filter for complex query
        $.fn.dataTable.ext.searchTemp.push((settings, data) => filterComplex(settings, data));

        search();
    });

    $scope.stateManager = stateManager;
    $scope.$watch('stateManager.display.table.data.filter.globalSearch', value => {
        if (value === '_reset_') {
            stateManager.display.table.data.filter.globalSearch = '';
            self.searchText = '';
        }
    });

    /**
     * Apply global search to the table.
     *
     * @function search
     * @param   {Boolean}   [init=false] - true if the table is initialize, false otherwise
     */
    function search(init = false) {
        // show processing
        $rootElement.find('.dataTables_processing').css('display', 'block');

        // set filter information if user enter value
        const table = tableService.getTable();
        buildFilters(table);

        // if user enter value is not valid filters, simply search the whole datatable
        // redraw table with search parameter (use timeout for redraw so processing can show
        if (self.searchFilter.filters.length === 0) {
            $timeout(() => { table.search(self.searchText).draw(); }, 100);
        } else {
            $timeout(() => { table.search('').draw(); }, 100);
        }

        // keep global search value for this table
        if (!init) { stateManager.display.table.data.filter.globalSearch = self.searchText; }
    }

    /**
     * Clear global search for the table.
     *
     * @function clear
     */
    function clear() {
        self.searchText = '';
        search();
    }

    /**
     * Build filters object use by the custom filter to search the table
     *
     * @function buildFilters
     * @param {Object} table table to search
     */
    function buildFilters(table) {
        // reinitialize filters each time, if no valid filter, custom filter will not try to filter the table
        self.searchFilter.filters = []; // reinitialize filters each time

        // if no text or open quote is not close
        if (self.searchText !== '' && (self.searchText.match(/"/g) || []).length % 2 === 0) {

            // split all search value pairs (field:value). Keep string inside quote as one value
            // (?:         # non-capturing group
            //   [^\s"]+   # anything that's not a space or a double-quote
            //   |         #   or…
            //   "         # opening double-quote
            //     [^"]*   # …followed by zero or more chacacters that are not a double-quote
            //   "         # …closing double-quote
            // )+          # each match is one or more of the things described in the group
            const filters = self.searchText.match(/(?:[^\s"]+|"[^"]*")+/g);
            filters.forEach(field => {
                const info = field.split(':');
                const value = (info.length === 2) ? info[1].replace(/"/g, '') : null; // make sure there is a value and remove quotes

                // check if user has enter a value for a column
                if (value !== null) {
                    // check if column exist, if so set filter information
                    const column = table.columns().dataSrc().toArray()
                        .find(v => v.toUpperCase() === info[0].toUpperCase());

                    if (typeof column !== 'undefined') {
                        setFilterInfo(column, value);
                    }
                }
            });
        }
    }

    /**
     * Set information for a filter
     *
     * @function setFilterInfo
     * @param {String} column column name to search on
     * @param {String} value the search term
     */
    // eslint-disable-next-line complexity
    function setFilterInfo(column, value) {
        // default filter object
        const filter = { column, searchTerm: null, operator: null };

        // see if value contain one of the operand
        let operator = value.match(/(>=?|>=|<=?|<=|\[|\])/g); // check for presence of >, >=, <, <=, []

        // get proper search term. If no operator, it is a string
        if (operator === null) {
            filter.searchTerm = (value === '') ? null : new RegExp(value.toUpperCase());
            filter.operator = operators.string;
            filter.type = 'string';
        } else {
            // check if it is a valid operator (add some characters so we can easely remove operators from search term)
            operator = `\\${operator.join('|')}`;
            if (typeof operators[operator] !== 'undefined') {
                filter.operator = operators[operator];

                // parse search term as float to see if it is a number (split .. for range and - for date)
                const userValue = value.replace(new RegExp(operator), '').split(/\.\.|-/g)
                    .map(val => parseFloat(val));

                // check if it is only numbers
                if (!userValue.some(isNaN)) {
                    // set filter type and if it is a date, create date object
                    filter.type = (userValue.length <= 2) ? 'number' : 'date';
                    filter.searchTerm = (filter.type === 'number') ?
                        userValue :
                        [new Date(userValue.splice(0, 3).join('-')), new Date(userValue.splice(0, 3).join('-'))];
                }
            }
        }

        // add the filter to searchFilter object so it can be accessed from the custom filter
        if (filter.searchTerm !== null && filter.operator !== null) {
            self.searchFilter.filters.push(filter);
        }
    }

    /**
     * Filter (search) table with a complex query
     *
     * @function filterComplex
     * @param {Object} settings table settings to search on
     * @param {Array} data data for the row to test if it pass the filters
     * @return {Boolean} dataFlag return True if it pass the filter, False otherwise
     */
    function filterComplex(settings, data) {
        let dataFlag = true;

        if (self.searchFilter.filters.length > 0) {
            const filters = self.searchFilter.filters;

            filters.forEach(filter => {
                // if one of the filters is not good we already know we should hide the row (AND approach)
                if (dataFlag) {
                    // get column index to find row data
                    const column = settings.aoColumns
                        .find(v => v.data.toUpperCase() === filter.column.toUpperCase());

                    // check if we need to parse the value
                    let value = data[column.idx];
                    if (filter.type === 'number') {
                        value = parseFloat(value);
                    } else if (filter.type === 'date') {
                        value = new Date(value.split(' ')[0]);
                    }

                    // check if it pass the filter
                    dataFlag = filter.operator(value, filter.searchTerm);
                }
            });
        }

        return dataFlag;
    }
}
