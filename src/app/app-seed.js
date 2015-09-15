angular.element(document)
    .ready(function () {
        'use strict';

        // convert html collection to array:
        // http://blog.cluster-text.com/2013/04/29/a-trap-when-looping-on-getelementsbyclassname/
        var nodes = [].slice.call(document.getElementsByClassName('fgpv'));

        nodes.forEach(function (node) {
            // load shell template into the node
            node.setAttribute('data-ng-include', '\'app/layout/shell.html\'');

            // bootstrap each node as an Angular app
            angular.bootstrap(node, ['app'], {
                // TODO: set strictDi to true in production
                //strictDi: true,
            });
        });
    });
