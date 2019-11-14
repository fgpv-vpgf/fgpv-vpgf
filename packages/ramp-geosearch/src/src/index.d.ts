import * as Q from './query';
import Provinces from './provinces';
import Types from './types';
import * as defs from './definitions';
export declare class GeoSearch {
    resultHandler: (results: defs.NameResultList) => HTMLElement;
    featureHandler: (results: defs.queryFeatureResults) => HTMLElement;
    docFrag: DocumentFragment;
    config: defs.MainConfig;
    resultContainer: HTMLElement;
    featureContainer: HTMLElement;
    constructor(uConfig?: defs.UserConfig);
    ui(resultHandler?: (results: defs.NameResultList) => HTMLElement, featureHandler?: (results: defs.queryFeatureResults) => HTMLElement, input?: HTMLInputElement, resultContainer?: HTMLElement, featureContainer?: HTMLElement): this;
    defaultResultHandler(results: defs.NameResultList): HTMLElement;
    defaultFeatureHandler(fR: defs.queryFeatureResults): HTMLElement;
    inputChanged(evt: KeyboardEvent): void;
    readonly htmlElem: DocumentFragment;
    query(query: string): Q.Query;
}
export { Q, Provinces, Types, defs as Defs };
