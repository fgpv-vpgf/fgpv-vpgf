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
    
    describe('makeLegend', () => {
        it('should work for more layers than sections (4,2,2)', () => {
            const res = legend.makeLegend([4,2,2].map(n => ({height: n})), 2);
            const expected = [false, true, false];
            expected.forEach((x,i) => expect(res[i].splitBefore).toBe(x));
        });

        it('should work for more layers than sections (4,2,2,4)', () => {
            const res = legend.makeLegend([4,2,2,4].map(n => ({height: n})), 3);
            const expected = [false, true, false, true];
            expected.forEach((x,i) => expect(res[i].splitBefore).toBe(x));
        });
        
    });


});
