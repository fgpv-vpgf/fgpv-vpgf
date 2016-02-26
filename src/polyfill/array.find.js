// jshint freeze:false
// jshint bitwise: false
if (!Array.prototype.find) {
    Array.prototype.find = (predicate, thisArg) => {
        'use strict';
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        const list = Object(this);
        const length = list.length >>> 0;
        let value;

        for (let i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// jshint freeze:true
// jshint bitwise: false
