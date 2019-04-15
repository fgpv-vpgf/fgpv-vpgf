import { PanelEvent } from 'api/events';
import { Subject } from 'rxjs';

/**
 * @module stateManager
 * @memberof app.common
 * @description
 *
 * The `stateManager` factory is a service controlling states (true/false) of panels and their content.
 * State object corresponds to either a panel with mutually exclusive content panes, a content pane, or any other element with set content. For simplicity, a state object which is a parent, cannot be a child of another state object.
 *
 * When a parent state object is:
 * - activated: it activates a first (random) child as well; activating a parent state object should be avoided;
 * - deactivated: it deactivates its active child as well;
 *
 * When a child state object is:
 * - activated: it activates its parent and deactivates its active sibling if any;
 * - deactivated: it deactivates its parent as well;
 *
 * Only `active` and `morph` state properties are animated (animation can be skipped which is indicated by the `activeSkip` and `morphSkip` flags) and need to be set through `setActive` and `setMorph` functions accordingly; these properties can be bound and watched directly though. Everything else on the `state` object can be set, bound, and watched directly.
 */
angular.module('app.core').factory('stateManager', stateManager);

// https://github.com/johnpapa/angular-styleguide#factory-and-service-names

function stateManager(displayManager, initialState, initialDisplay) {

    const service = {
        callback,
        state: angular.copy(initialState),
        display: angular.copy(initialDisplay)
    };

    const fulfillStore = {}; // keeping references to promise fulfill functions
    const displayService = displayManager(service); // init displayManager

    angular.extend(service, displayService); // merge displayManager service functions into stateManager

    return service;

    /*********/

    /**
     * Resolves promise on the item waiting for its transition to complete.
     * @function callback
     * @param  {String} itemName name of the state to resolve
     */
    function callback(itemName, property) {
        const fulfillKey = `${property}${itemName}`;

        // there is no memory leak since there is a finite (and small) number of fulfill keys
        if (fulfillStore[fulfillKey]) {
            fulfillStore[fulfillKey]();
        }
    }
}
