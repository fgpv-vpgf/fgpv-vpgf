/**
 * @function app.core.seed
 * @inner
 * @desc `seed` is an implicit function which runs on application startup to
 * initialize all marked DOM nodes to map instances
 */
angular.element(document)
    .ready(() => {
        // The app nodes in the dom
        RV.viewerElements.forEach(v => {
            // load shell template into the node
            // we need to create an explicit child under app's root node, otherwise animation
            // doesnt' work; see this plunk: http://plnkr.co/edit/7EIM71IOwC8h1HdguIdD
            // or this one: http://plnkr.co/edit/Ds8e8d?p=preview
            v.appendChild(angular.element('<rv-shell class="md-body-1">')[0]);

            // bootstrap each node as an Angular app
            // strictDi enforces explicit dependency names on each component: ngAnnotate should find most automatically
            // this checks for any failures; to fix a problem add 'ngInject'; to the function preamble
            angular.bootstrap(v, ['app'], {
                strictDi: true
            });
            delete window.angular;
            window.angular = existingWindowDotAngular;
        });
    });
