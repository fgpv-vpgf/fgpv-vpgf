import * as defs from './definitions';
import * as jsonprovs from '../data/provinces.json';
import * as jsonfsaToProv from '../data/fsa_to_prov.json';

const provinceObj: {[key: string]: Provinces} = {};
const fsaToProv = (<any>jsonfsaToProv).default;
const provs: defs.GenericObjectType = (<any>jsonprovs).default;

class Provinces {
    list: defs.GenericObjectType = {};

    constructor(language: string) {
        Object.keys(provs[language]).forEach(provKey => {
            this.list[provKey] = (<any>provs[language])[provKey];
        });
    }

    fsaToProvinces(fsa: string): defs.GenericObjectType {
        const genericObj: defs.GenericObjectType = {};
    
        // either a provincial code, or an array of them
        let provCodes = (<number[] | number>fsaToProv[fsa.substring(0, 1).toUpperCase()]);
    
        if (typeof provCodes === 'number') {
            provCodes = [provCodes];
        }
    
        provCodes.forEach(n => {
            genericObj[n] = this.list[n];
        });
 
        return genericObj;
    }
    
}

export default function(language: string): defs.Provinces {
    return provinceObj[language] = provinceObj[language] ? provinceObj[language] : new Provinces(language);
}