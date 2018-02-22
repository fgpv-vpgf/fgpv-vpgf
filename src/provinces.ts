import * as defs from './definitions';
import * as provs from '../data/provinces.json';
import * as fsaToProv from '../data/fsa_to_prov.json';

const provinceObj = {};

class Provinces {
    list: defs.genericObjectType = {};

    constructor(language: string) {
        Object.keys(provs[language]).forEach(provKey => {
            this.list[provKey] = provs[language][provKey];
        });
    }

    fsaToProvinces(fsa: string): defs.genericObjectType {
        const genericObj = {};
    
        // either a provincial code, or an array of them
        let provCodes = fsaToProv[fsa.substring(0,1).toUpperCase()];
    
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