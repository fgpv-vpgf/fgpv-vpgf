import * as jsontypes from '../data/types.json';
import * as defs from './definitions';

const typeObj: {[key: string]: Types} = {};
const types: defs.GenericObjectType = (<any>jsontypes).default;


class Types {
    allTypes: defs.GenericObjectType = {};
    validTypes: defs.GenericObjectType = {};
    filterComplete: boolean = false;

    constructor(language: string) {
        Object.keys(types[language]).forEach(typeKey => {
            this.allTypes[typeKey] = (<any>types[language])[typeKey];
            this.validTypes[typeKey] = (<any>types[language])[typeKey];
        });
    }

    filterValidTypes(exclude?: string | string[]): defs.GenericObjectType {
        if (this.filterComplete) {
            return this.validTypes;
        }

        exclude = typeof exclude === 'string' ? [exclude] : exclude;

        if (exclude && exclude.length > 0) {
            for (const key of exclude) {
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

