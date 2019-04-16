const mapInstances = {};

class MapInstance {
    id: string;
    queues: { [key:number]: Array<() => void>; }; // queue function list waiting to be executed
    legacyFunctions: { [key:string]: (...args: any[]) => any };
    deprecatedWarning: boolean = false;

    constructor(id: string) {
        this.id = id;
        this.queues = {};
        this.legacyFunctions = {};
    }

    /**
     * Runs all queues - highest priority queues execute first.
     */
    runQueue() {
        Object.keys(this.queues)
            .sort()
            .reverse()
            .forEach(key => {
                let k = parseInt(key);
                this.queues[k].forEach(qItem => qItem());
                delete this.queues[k];
            })
    }

    /**
     * Adds a legacy api call to a queue which gets executed when ramp is ready to receive them.
     *
     * @param {string} action       legacy api function name to be queued
     * @param {number} priority     the order in which this queued call will be executed, higher numbers go first
     * @param {...any} args         legacy api function parameters
     */
    queue(action: string, priority: number, ...args: any[]) {
        if (!this.deprecatedWarning) {
            console.error('This api is deprecated and will be removed in a future release. Please use the new api located at window.RAMP');
            this.deprecatedWarning = true;
        }

        // ramp has defined the legacy function, call immediately
        if (this.legacyFunctions[action]) {
            return new Promise(resolve => resolve(this.legacyFunctions[action](...args)));
        }

        // ramp is not yet ready, queue the function call
        this.queues[priority] = this.queues[priority] || [];

        return new Promise(resolve => {
            this.queues[priority].push(() => this.legacyFunctions[action] && resolve(this.legacyFunctions[action](...args)));
        });
    }

    setLanguage(...args: any[]) {
        return this.queue('setLanguage', 0, ...args);
    }

    panelVisibility(...args: any[]) {
        return this.queue('panelVisibility', 0, ...args);
    }

    getCurrentLang(...args: any[]) {
        return this.queue('getCurrentLang', 0, ...args);
    }

    loadRcsLayers(...args: any[]) {
        return this.queue('loadRcsLayers', 0, ...args);
    }

    getBookmark(...args: any[]) {
        return this.queue('getBookmark', 0, ...args);
    }

    centerAndZoom(...args: any[]) {
        return this.queue('centerAndZoom', 0, ...args);
    }

    setExtent(...args: any[]) {
        return this.queue('setExtent', 0, ...args);
    }

    useBookmark(...args: any[]) {
        return this.queue('useBookmark', 0, ...args);
    }

    getRcsLayerIDs(...args: any[]) {
        return this.queue('getRcsLayerIDs', 0, ...args);
    }

    appInfo(...args: any[]) {
        return this.queue('appInfo', 0, ...args);
    }

    northArrow(...args: any[]) {
        return this.queue('northArrow', 0, ...args);
    }

    mapCoordinates(...args: any[]) {
        return this.queue('mapCoordinates', 0, ...args);
    }

    getMapClickInfo(...args: any[]) {
        return this.queue('getMapClickInfo', 0, ...args);
    }

    convertDDToDMS(...args: any[]) {
        return this.queue('convertDDToDMS', 0, ...args);
    }

    setMapCursor(...args: any[]) {
        return this.queue('setMapCursor', 0, ...args);
    }

    projectGeometry(...args: any[]) {
        return this.queue('projectGeometry', 0, ...args);
    }

    toggleSideNav(...args: any[]) {
        return this.queue('toggleSideNav', 0, ...args);
    }

    reInitialize(...args: any[]) {
        return this.queue('reInitialize', 0, ...args);
    }

    getConfig(...args: any[]) {
        return this.queue('getConfig', 0, ...args);
    }

    initialBookmark(...args: any[]) {
        return this.queue('initialBookmark', 1, ...args);
    }

    restoreSession(...args: any[]) {
        return this.queue('restoreSession', 1, ...args);
    }

    start(...args: any[]) {
        return this.queue('start', 1, ...args);
    }
}

(<any>window).RV = {
    getMap: (id: string) => {
        (<any>mapInstances)[id] = (<any>mapInstances)[id] || new MapInstance(id);
        return (<any>mapInstances)[id];
    }
};

console.warn('The RAMP viewers legacy API is deprecated and will be removed in a future release.');