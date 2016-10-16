/* jshint jasmine: true */
'use strict';
const data = require('./legendData.json');
const legend = require('../src/legend.js')();

describe('Legend', () => {
    
    describe('allComb', () => {
        it('should produce a single entry for (1,1)', () => {
            const res = legend.allComb(1,1);
            expect(res.length).toBe(1);
            expect(res[0][0]).toBe(true);
        });
        
        it('should work correctly for (7,3)', () => {
            const res = legend.allComb(7,3);
            expect(res.length).toBe(35);
            res.forEach(perm => expect(perm.filter(x => x).length).toBe(3));
        });
        
    });


});
