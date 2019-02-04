const templateUrl = require('./table-pane.html');

angular
    .module('app.ui')
    .directive('tablePane', tablePane);

function tablePane(stateManager, $rootScope, appInfo) {
    const directive = {
        restrict: 'E',
        templateUrl,
        link: link
    };

    return directive;

    /*********/

    function link(scope) {
        const self = scope.self;
        self.display = stateManager.display.table;
        let table;

        // DataTable is either being created or destroyed
        $rootScope.$watch(() => self.display.data, val => {
            if (val && val.rows) {
                
                self.title = self.display.requester.name;
                // triggered on DataTable panel open
                const cols = self.display.data.columns.map(c => ({
                    headerName: c.title, field: c.data
                }));
                $('#testTable1').empty();
                const tableI = appInfo.plugins.find(p => p.feature === 'table');
                table = tableI.create(document.querySelector('#testTable1'), cols, self.display.data.rows);
            }
        });
    }
}