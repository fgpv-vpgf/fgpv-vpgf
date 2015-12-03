(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name stateManager
     * @module app.common
     * @requires
     * @description
     *
     * The `stateManager` factory .
     *
     */
    angular
        .module('app.common.router')
        .factory('stateManager', stateManager);

    // https://github.com/johnpapa/angular-styleguide#factory-and-service-names

    function stateManager($q) {

        const service = {
            set: set,
            get: get,
            resolve: resolve
        };

        // state object
        let state = {
            main: {
                enabled: false
            },
            mainToc: {
                enabled: false,
                parent: 'main'
            },
            mainToolbox: {
                enabled: false,
                parent: 'main'
            },
            side: {
                enabled: false
            },
            sideMetadata: {
                enabled: false,
                parent: 'side'
            },
            sideSettings: {
                enabled: false,
                parent: 'side'
            },
            filters: {
                enabled: false
            },
            filtersFulldata: {
                enabled: false,
                parent: 'filters',
                mode: 'full' // half, tenth
            },
            filtersNamedata: {
                enabled: false,
                parent: 'filters'
            }
        };

        return service;

        ///////////

        /**
         * Sets items states.
         * @param {Array} items [description]
         */
        function set(...items) {
            if (items.length > 0) {

                let one = items.shift(); // get first item
                let oneTargetValue;

                // infer name, target state and parent
                if (typeof one === 'string') {
                    one = getItem(one);
                    oneTargetValue = !one.item.enabled; // using negated current state as target
                } else {
                    let oneName = Object.keys(one)[0];
                    oneTargetValue = one[oneName];
                    one = getItem(oneName);
                }

                //console.log('-->', one, 'to', oneTargetValue);

                if (one.item.parent) {
                    // toggling child and it's parent

                    // turn off other children of one's parent
                    let oneParent = getParent(one.name);
                    getChildren(oneParent.name)
                        .forEach(child => {
                            //console.log('child - ', child);
                            child.item.enabled = false;
                        });

                    oneParent.item.enabled = oneTargetValue;

                } else {
                    // toggling parent

                    // turn off all children
                    let oneChildren = getChildren(one.name);
                    oneChildren.forEach(child => {
                        //console.log('child - ', child);
                        child.item.enabled = false;
                    });

                    // when turning a parent item on, turn on first (random) child
                    if (oneTargetValue && oneChildren.length > 0) {
                        oneChildren[0].item.enabled = true;
                    }
                }

                // return promise for easy promise chaining
                return setItem(one.item, oneTargetValue, one.name)
                    .then(() => {
                        //console.log('continue');

                        // process the rest of the items
                        set(...items);
                    });
            }
        }

        // private: sets specified item to the provided value; waits for transition to complete
        function setItem(item, value, itemName) { // itemName is temporary TODO: remove itemName
            return $q(fulfill => { // reject is not used
                if (item.enabled !== value) {
                    item.fulfill = fulfill;
                    item.enabled = value;

                    // TODO: wait for items to animate
                    // rv-test directive should call stateManager.resolve(...) with component name
                    resolve(itemName);
                } else {
                    // resolve immediately
                    fulfill();
                }
            });
        }

        // private: returns item object from itemName specified
        function getItem(itemName) {
            return {
                name: itemName,
                item: state[itemName]
            };
        }

        // private: returns parent of the itemName specified
        function getParent(itemName) {
            let parentName = state[itemName].parent;
            let parent = state[parentName];

            return {
                name: parentName,
                item: parent
            };
        }

        // private: returns array of children of the itemName specified
        function getChildren(parentName) {
            return Object.keys(state)
                .filter((key) => {
                    return state[key].parent === parentName;
                })
                .map((key) => {
                    return {
                        name: key,
                        item: state[key]
                    };
                });
        }

        // returns item state
        function get(item) {
            let itemName = typeof item === 'string' ? item : item.name;
            return state[itemName].enabled;
        }

        // resolves promise on the item waiting for transition end
        function resolve(itemName) {
            let item = state[itemName];

            //console.log('resolving', itemName, item);

            if (item.fulfill) {
                item.fulfill();
                delete item.fulfill;
            }
        }

    }
})();
