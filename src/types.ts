import * as types from '../data/types.json';
import * as defs from './definitions';

const typeObj = {};

class Types {
    allTypes = {};
    validTypes = {};
    filterComplete: boolean = false;

    constructor(language) {
        Object.keys(types[language]).forEach(typeKey => {
            this.allTypes[typeKey] = types[language][typeKey];
            this.validTypes[typeKey] = types[language][typeKey];
        });
    }

    filterValidTypes(include?: string | Array<string>, exclude?: string | Array<string>): defs.genericObjectType {
        if (this.filterComplete) {
            return this.validTypes;
        }

        include = typeof include === 'string' ? [include] : include;
        exclude = typeof exclude === 'string' ? [exclude] : exclude;
        const setExclusion = include || exclude ? (include && include.length > 0) || (exclude && exclude.length) : null;
    
        if (setExclusion !== null) {
            const typeSet = new Set(Object.keys(this.validTypes));
            const keySet = new Set(include || exclude);
            const invalidKeys = new Set([...typeSet].filter(x => !setExclusion === keySet.has(x)));
            for (let key of invalidKeys) {
                delete this.validTypes[key];
            }
        }

        this.filterComplete = true;
        return this.validTypes;
    }
}

export default function(language: string): defs.Types {
    return typeObj[language] = typeObj[language] ? typeObj[language] : new Types(language);
}

