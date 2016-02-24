angular.element(document)
    .ready(function () {
        'use strict';

        // convert html collection to array:
        // https://babeljs.io/docs/learn-es2015/#math-number-string-object-apis
        var nodes = Array.from(document.getElementsByClassName('fgpv'));
        var child;

        nodes.forEach(function (node) {
            // load shell template into the node
            // we need to create an explicit child under app's root node, otherwise animation
            // doesnt' work; see this plunk: http://plnkr.co/edit/7EIM71IOwC8h1HdguIdD
            // or this one: http://plnkr.co/edit/Ds8e8d?p=preview
            child = angular.element('<rv-shell>')[0];
            node.appendChild(child);

            // bootstrap each node as an Angular app
            // strictDi enforces explicit dependency names on each component: ngAnnotate should find most automatically
            // this checks for any failures; to fix a problem add 'ngInject'; to the function preamble
            angular.bootstrap(node, ['app'], { strictDi: true });
        });
    });
