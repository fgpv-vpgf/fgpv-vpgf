import { GeoSearch } from '../src/index';
import * as Q from '../src/query';

describe('The query router', () => {
    let search: GeoSearch;
    let query: (q: string) => Q.Query;

    beforeAll(() => {
        search = new GeoSearch();
        query = Q.make.bind(undefined, search.config);
    });

    describe('returns an NTS query class', () => {
        xit("when given a partial NTS query", () => {
            expect(query('064D')).toEqual(jasmine.any(Q.NTSQuery));
        });

        it("when given a full NTS query", () => {
            expect(query('064D02')).toEqual(jasmine.any(Q.NTSQuery));
        });
    });

    describe('returns an FSA query class', () => {
        xit("when given a valid FSA", () => {
            expect(query('L5L')).toEqual(jasmine.any(Q.FSAQuery));
        });

        it("when given a postal code", () => {
            expect(query('L5L 2R7')).toEqual(jasmine.any(Q.FSAQuery));
        });
    });

    describe('returns a normal query class', () => {
        it("when given a name", () => {
            expect(query('Milton')).toEqual(jasmine.any(Q.Query));
        });

        xit("with a promise rejection when given an incomplete query", done => {
            query('L5').onComplete.then(() => done.fail('onComplete promise should have rejected')).catch(() => done());
        });
    });
});
