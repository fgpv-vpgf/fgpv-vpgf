/* jshint jasmine: true */
'use strict';
const layer = require('../src/layer.js')({}, {});

describe('verify columns of lat/long are numeric', () => {
    const arr =
        [
            ['person0', 'hello', 0.8484, 45.88295],
            ['person1', 'salut', 24, 45.88295],
            ['person2', 'nihao', 28, 45.88295],
            ['person3', 'josun', 84, 45.88295]
        ];

    it('should be numeric and return true', () => {
        expect(layer.validateLatLong(arr, 2, 3)).toBeTruthy();
    });

    it('should not be numeric and return false', () => {
        expect(layer.validateLatLong(arr, 1, 3)).toBeFalsy();
    });

});
