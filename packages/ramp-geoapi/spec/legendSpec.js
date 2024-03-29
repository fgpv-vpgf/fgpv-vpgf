/* jshint jasmine: true */
'use strict';
const data = require('./legendData.json');
const legend = require('../src/legend.js')();
const sampleLayer = {
    y: 0,
    headerHeight: 0,
    height: 110,
    type: 'layer',
    items: [
        {
            type: 'group',
            items: [
                { type: 'item', height: 20, y: 10 },
                { type: 'item', height: 40, y: 30 },
            ],
            headerHeight: 10,
            y: 0,
        },
        { type: 'item', height: 20, y: 70 },
        { type: 'item', height: 20, y: 90 },
    ],
};

describe('Legend', () => {
    describe('allComb', () => {
        it('should produce a single entry for (1,1)', () => {
            const res = legend.allComb(1, 1);
            expect(res.length).toBe(1);
            expect(res[0][0]).toBe(true);
        });

        it('should work correctly for (7,3)', () => {
            const res = legend.allComb(7, 3);
            expect(res.length).toBe(35);
            res.forEach((perm) => expect(perm.filter((x) => x).length).toBe(3));
        });
    });

    describe('findOptimalSplit', () => {
        it('should work for a simple split case', () => {
            const testdata = JSON.parse(JSON.stringify(sampleLayer));
            legend.findOptimalSplit(testdata, 2);
            expect(testdata.items[1].splitBefore).toBe(true);
            expect(testdata.items[2].splitBefore).toBe(undefined);
        });

        it('should work for another simple split case', () => {
            const testdata = JSON.parse(JSON.stringify(sampleLayer));
            legend.findOptimalSplit(testdata, 4);
            expect(testdata.items[0].items[1].splitBefore).toBe(true);
        });
    });

    describe('makeLegend', () => {
        it('should work for more layers than sections (4,2,2), 2', () => {
            const res = legend.makeLegend(
                [4, 2, 2].map((n) => ({ height: n })),
                2
            );
            const expected = [false, true, false];
            expected.forEach((x, i) => expect(res.layers[i].splitBefore).toBe(x));
        });

        it('should work for more layers than sections (4,2,2,4), 3', () => {
            const res = legend.makeLegend(
                [4, 2, 2, 4].map((n) => ({ height: n })),
                3
            );
            const expected = [false, true, false, true];
            expected.forEach((x, i) => expect(res.layers[i].splitBefore).toBe(x));
        });

        it('should not use more sections than necessary (2,2,4,2,2), 4', () => {
            const res = legend.makeLegend(
                [2, 2, 4, 2, 2].map((n) => ({ height: n })),
                4
            );
            const expected = [false, false, true, true, false];
            expected.forEach((x, i) => expect(res.layers[i].splitBefore).toBe(x));
        });

        it('should work for more sections than layers', () => {
            const testdata = JSON.parse(JSON.stringify(data));
            legend.makeLegend(testdata, 4, 200);
            expect(testdata[1].splitBefore).toBe(true);
            expect(testdata[2].splitBefore).toBe(true);
            expect(testdata[1].items[0].items[3].items[4].splitBefore).toBe(true);
        });

        it('should do nothing fancy for very tall maps', () => {
            const testdata = JSON.parse(JSON.stringify(data));
            const res = legend.makeLegend(testdata, 4, 2000);
            expect(res.sectionsUsed).toBe(3);
        });

        it('should use simple allocation when given lots of layers', () => {
            const res = legend.makeLegend(
                Array(20)
                    .fill(4)
                    .map((n) => ({ height: n })),
                3,
                20
            );
            expect(res.sectionsUsed).toBe(3);
            expect(res.layers[7].splitBefore).toBe(true);
            expect(res.layers[14].splitBefore).toBe(true);
        });
    });
});
