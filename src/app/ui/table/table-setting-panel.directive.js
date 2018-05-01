const templateUrl = require('./setting-panel.html');

/**
 * @module rvTableSettingPanel
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvTableSettingPanel` directive for a table setting panel.
 *
 */
angular
    .module('app.ui')
    .directive('rvTableSettingPanel', rvTableSettingPanel);

/**
 * `rvTableSettingPanel` directive body.
 *
 * @function rvTableSettingPanel
 * @return {object} directive body
 */
function rvTableSettingPanel(stateManager, dragulaService, animationService, tableService, $timeout) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: { },
        link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, directiveElement) {
        const self = scope.self;

        self.tableService = tableService;

        self.onClose = () => {
            self.tableService.isSettingOpen = false;
        };

        // TODO convert this object into an ES6 class
        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        self.dragulaOptions = {

            // only let the user move the item if drag handle is selected
            moves(el, source, handle) {
                // prevent drag from starting if something other than a handle was grabbed
                if (angular.element(handle).parentsUntil(el, '[rv-drag-handle]').length > 0) {
                    return true;
                } else {
                    return false;
                }
            },

            accepts(dragElement, target, source, sibling) {
                // only accepts if there is handle on the sibling (thre is no handle on rvSymbol and rvInteractive)
                // when sibling element is the last one, class gu-mirror is present.
                if (angular.element(sibling).find('[rv-drag-handle]').length > 0 ||
                    sibling.className === 'gu-mirror') {
                    return true;
                } else {
                    return false;
                }
            },

            rvDragDrop() {
                // update datatable order (need to reset before setting back the order, if not order is not set properly)
                const table = tableService.getTable();
                table.colReorder.reset();

                // set a timeout because model needs ot be updated before we reorder the fields
                $timeout(() => {
                    table.colReorder.order(stateManager.display.table.data.columns.map(item => item.position));
                }, 250);
            }
        };
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        // set an empty animation object in the event a method is called prior
        // to a scroll animation being created
        let scrollAnimation = { pause: () => {}, isActive: () => false };

        // on drag start
        // TODO: abstract the scrolling animation, to avoid code duplication (already in toc.directive)
        scope.$on('table-bag.drag', (evt, dragElement, source) => {
            // handle autoscroll when dragging layers
            const scrollElem = source.closest('.rv-filter-setting');
            directiveElement.on('mousemove touchmove', event => {

                const pageY = event.pageY ? event.pageY :  event.originalEvent.touches[0].clientY;

                // scroll animation is linear
                let scrollDuration;
                const speedRatio = 1 / 500; // 500 px in 1 second

                // scrolling upwards
                if (scrollElem.offset().top + dragElement.height() > pageY) {
                    scrollDuration = scrollElem.scrollTop() * speedRatio;

                    if (!scrollAnimation.isActive()) {
                        scrollAnimation = animationService.to(scrollElem, scrollDuration,
                            { scrollTo: { y: 0 }, ease: 'Linear.easeNone' });
                    }

                // scrolling downwards
                } else if (scrollElem.height() - pageY <= 0) {
                    if (!scrollAnimation.isActive()) {
                        scrollDuration = (scrollElem[0].scrollHeight -
                            scrollElem.height() - scrollElem.scrollTop()) * speedRatio;

                        scrollAnimation = animationService.to(scrollElem, scrollDuration,
                            { scrollTo: { y: scrollElem[0].scrollHeight - scrollElem.height() },
                                ease: 'Linear.easeNone' });
                    }

                // stop scrolling
                } else {
                    scrollAnimation.pause();
                }
            });
        });

        // on drop, set columns order on stateManager
        scope.$on('table-bag.drop-model', () => {
            self.dragulaOptions.rvDragDrop();

            // stop and remove autoscroll
            directiveElement.off('mousemove touchmove');
            scrollAnimation.pause();
        });

        // on cancel
        scope.$on('table-bag.cancel', () => {
            // stop and remove autoscroll
            directiveElement.off('mousemove touchmove');
            scrollAnimation.pause();
        });
    }
}

function Controller($scope, events, tableService, stateManager, $timeout) {
    'ngInject';
    const self = this;

    self.sort = onSort;
    self.display = onDisplay;
    self.tableService = tableService;
    self.isNameTruncated = false;
    self.setNameTruncated = setNameTruncated;

    $scope.$on(events.rvTableReady, () => {
        self.description = stateManager.display.table.data.filter.description;
        self.columns = stateManager.display.table.data.columns;
        $scope.columns = self.columns;
        self.title = stateManager.display.table.data.filter.title;
        self.tableService.isSettingOpen = false;

        self.sortStatus = sortStatus;
        self.sortAll = sortAll;

        self.displayStatus = displayStatus;
        self.displayAll = displayAll;

        init();
    });

    /**
     * On table load, initialize sort and display for all columns
     *
     * @function init
     */
    function init() {
        sortColumns();

        // toggle the visibility
        self.columns.forEach(column => {
            if (!column.display) {
                self.tableService.getTable().column(`${column.name}:name`).visible(false);
            }
        });
    }

    /**
     * Sort table from array of sort values (all columns)
     *
     * @function sortColumns
     */
    function sortColumns() {
        // create array of sort from columns
        const sorts = [];
        self.columns.forEach((column, i) => {
            if (typeof column.sort !== 'undefined' && column.sort !== 'none') {
                sorts.push([i, column.sort]);
            }
        });

        // sort columns
        const table = self.tableService.getTable();
        if (sorts.length) {
            table.order(sorts).draw();
        } else {    // All sorting removed from settings panel, reset table to original state
            table.fnSortNeutral(table.settings()[0]);
        }
    }

    /**
     * On sort click, apply sort value to the column then sort the table
     *
     * @function onSort
     * @param   {Object}   columnInfo   column information
     */
    function onSort(columnInfo) {
        // set sort value on actual column
        const sort = (columnInfo.sort === 'none') ? 'asc' : ((columnInfo.sort === 'asc') ? 'desc' : 'none');
        columnInfo.sort = sort;

        // sort the table
        sortColumns();
    }

    /**
     * Check current sort state of all columns
     *
     * @function sortStatus
     * @return {String} asc if all columns ascending, desc if all columns descending, otherwise none
     */
    function sortStatus() {
        // use the third column here because the first two are the always hidden ones: symbology and interactive buttons
        const sort = self.columns[2].sort;

        if (self.columns.some((col, index) => index > 2 && col.sort !== sort)) {
            return 'none';
        }

        return sort;
    }

    /**
     * On sort click, apply sort value to all columns then sort the table
     *
     * @function sortAll
     */
    function sortAll() {
        let newSort;

        switch (self.sortStatus()) {
            case 'asc':
                newSort = 'desc';
                break;
            case 'desc':
                newSort = 'none';
                break;
            default:
                newSort = 'asc';
        }

        self.columns.forEach((col, index) => {
            if (index > 1) {
                col.sort = newSort;
            }
        });
        sortColumns();
    }

    /**
     * On display click, show/hide the column
     *
     * @function onDisplay
     * @param   {Object}   columnInfo   column information
     */
    function onDisplay(columnInfo) {
        // get column
        const column = self.tableService.getTable().column(`${columnInfo.name}:name`);

        // toggle the visibility and class name use to show/hide collumn when export or print
        column.visible(columnInfo.display);
        column.header().classList.toggle('rv-filter-noexport');
    }

    /**
     * Check current display state of all columns
     *
     * @function displayStatus
     * @return {Boolean|String} true if all columns shown, false if none shown, otherwise 'indeterminate'
     */
    function displayStatus() {
        // use the third column here because the first two are the always hidden ones: symbology and interactive buttons
        const display = self.columns[2].display;

        if (self.columns.some((col, index) => index > 2 && col.display !== display)) {
            return 'indeterminate';
        }

        return display;
    }

    /**
     * On display click, show/hide all columns
     *
     * @function displayAll
     */
    function displayAll() {
        const newDisplay = !(self.displayStatus() === true);

        self.columns.forEach((col, index) => {
            if (index > 1) {
                col.display = newDisplay;
                onDisplay(col);
            }
        });
    }

    /**
     * Set the indicated self.isNameTruncated to True if the name is truncated
     *
     * @function setNameTruncated
     * @private
     * @param{event} evt event when being hovered
     */
    function setNameTruncated(evt) {
        self.isNameTruncated = false;
        $timeout(() => {
            self.isNameTruncated = evt.target.scrollWidth > evt.target.clientWidth;
        }, 250);
    }
}

