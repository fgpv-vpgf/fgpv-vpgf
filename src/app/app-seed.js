angular.element(document)
    .ready(function () {
        'use strict';

        // convert html collection to array:
        // http://blog.cluster-text.com/2013/04/29/a-trap-when-looping-on-getelementsbyclassname/
        var nodes = [].slice.call(document.getElementsByClassName('fgpv'));
        var child;

        nodes.forEach(function (node) {
            // load shell template into the node
            // we need to create an explicit child under app's root node, otherwise animation
            // doesnt' work; see this plunk: http://plnkr.co/edit/7EIM71IOwC8h1HdguIdD
            // or this one: http://plnkr.co/edit/Ds8e8d?p=preview
            child = angular.element('<div>').attr('ng-include', '\'app/layout/shell.html\'')[0];
            node.appendChild(child);

            // bootstrap each node as an Angular app
            angular.bootstrap(node, ['app'], {
                // TODO: set strictDi to true in production
                //strictDi: true,
            });
        });
    });
