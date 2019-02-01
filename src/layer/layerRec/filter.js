const shared = require('./shared.js')();

/**
 * @class Filter
 */
class Filter {
    // handles state, result caches, and notifications for data filters on feature classes

    /**
     * @param {Object} parent        the FC object that this Filter belongs to
     */
    constructor (parent) {
        this._parent = parent;

        // dictionaries of potential values
        this._sql = {};
        this._cache = {};
    }

    // exposes enumeration of core types to the client
    get coreFilterTypes () { return shared.filterType; }

    /**
     * Returns list of filters that have active filters
     *
     * @method sqlActiveFilters
     * @param {Array} [exclusions] list of any filters to exclude from the result. omission includes all filters
     * @returns {Array} list of filters with active filter sql
     */
    sqlActiveFilters (exclusions = []) {
        const s = this._sql;
        const rawActive = Object.keys(s).filter(k => s[k]);
        if (exclusions.length === 0) {
            return rawActive;
        } else {
            return rawActive.filter(k => exclusions.indexOf(k) === -1);
        }
    }

    /**
     * Indicates if any filters are active
     *
     * @method isActive
     * @returns {Boolean} indicates if any filters are active
     */
    isActive () {
        return this.sqlActiveFilters().length > 0;
    }

    /**
     * Returns a SQL WHERE condition that is combination of active filters.
     *
     * @method getCombinedSql
     * @param {Array} [exclusions] list of any filters to exclude from the result. omission includes all filters
     * @returns {String} all non-excluded sql statements connected with AND operators.
     */
    getCombinedSql (exclusions = []) {
        // list of active, non-excluded filters
        const keys = this.sqlActiveFilters(exclusions);

        const l = keys.length;
        if (l === 0) {
            return '';
        } else if (l === 1) {
            // no need for fancy brackets
            return this._sql[keys[0]];
        } else {
            // wrap each nugget in bracket, connect with AND
            return keys.map(k => `(${this._sql[k]})`).join(' AND ');
        }
    }

    /**
     * Tells what object ids are currently passing the layer's filters.
     *
     * @method getFilterOIDs
     * @param {Array} [exclusions] list of any filters to exclude from the result. omission includes all filters
     * @param {Extent} [extent] if provided, the result list will only include features intersecting the extent
     * @returns {Promise} resolves with array of valid OIDs that layer is filtering. resolves with undefined if there is no filters being used
     */
    getFilterOIDs (exclusions = [], extent) {
        // TODO perhaps key-mapping here? figure out SQL here? meh
        return this._parent.getFilterOIDs(exclusions, extent);
    }

    /**
     * Helper method for raising filter events
     *
     * @method eventRaiser
     * @private
     * @param {String} filterType type of filter event being raised. Should be member of shared.filterType
     */
    eventRaiser (filterType) {
        const fcID = this._parent.fcID;
        this._parent._parent.raiseFilterEvent(fcID.layerId, fcID.layerIdx, filterType);
    }

    /**
     * Helper method generating IN SQL clauses against the OID field
     *
     * @method arrayToIn
     * @private
     * @param {Array} array an array of integers
     * @returns {String} a SQL IN clause that dictates the object id field must match a number in the input array
     */
    arrayToIn (array) {
        // TODO do we need empty array checks? caller should be smart enough to recognize prior to calling this
        return `${this._parent.oidField} IN (${array.join(',')})`
    }

    /**
     * Updates a SQL filter clause and triggers filter change events.
     *
     * @method setSql
     * @param {String} filterType name of the filter to update
     * @param {String} whereClause clause defining the active filters on symbols. Use '' for no filter. Use '1=2' for everything filtered.
     */
    setSql (filterType, whereClause) {
        this._sql[filterType] = whereClause;

        // invalidate affected caches
        this.clearCacheSet(filterType);

        // tell the world
        this.eventRaiser(filterType);
    }

    /**
     * Returns current SQL for a fitler type
     *
     * @method getSql
     * @param {String} filterType key string indicating what filter the sql belongs to
     * @returns {String} the SQL, if any, that matches the filter type
     */
    getSql (filterType) {
        return this._sql[filterType] || '';
    }

    /**
     * Registers a new extent for cache tracking.
     *
     * @method setExtent
     * @param {Extent} extent the extent to filter against
     */
    setExtent (extent) {
        // NOTE while technically we can support other geometries (for server based layers)
        //      only extent works for file layers. for now, limit to extent.
        //      we can add fancier things later when we need them

        // if our extent is different than our last request, clear the cache
        // and update our tracker
        if (!shared.areExtentsSame(extent, this._extent)) {
            this._extent = extent;

            // clear caches that care about extent.
            this.clearCacheSet(shared.filterType.EXTENT);

            // We don't raise an event here. EXTENT event is a map-level thing, so a layer should not be raising it
            // (we'd have each layer shooting off an event every pan if we did)
        }
    }

    /**
     * Returns cache key depending on the situation we are in.
     *
     * @method getCacheKey
     * @private
     * @param {Array} sqlFilters list of filters influencing this cache
     * @param {Boolean} includeExtent if the cache includes extent based filters
     * @returns {String} the cache key to use
     */
    getCacheKey (sqlFilters, includeExtent) {
        const sqlKey = sqlFilters.sort().join('$');
        return `_cache$${sqlKey}${includeExtent ? '$' + shared.filterType.EXTENT : ''}$`;
    }

    /**
     * Returns cache for a specific filtering scenario.
     *
     * @method getCache
     * @private
     * @param {Array} sqlFilters list of filters influencing this cache
     * @param {Boolean} includeExtent if the cache includes extent based filters
     * @returns {Promise} resolves in a filter result appropriate for the parameters. returns nothing if no cache exists.
     */
    getCache (sqlFilters, includeExtent) {
        const key = this.getCacheKey(sqlFilters, includeExtent);
        return this._cache[key];
    }

    /**
     * Sets a filter query in a cache, so repeated identical requests will only hit the server once
     *
     * @method setCache
     * @param {Promise} queryPromise the query we want to cache
     * @param {Array} sqlFilters list of filters influencing this cache
     * @param {Boolean} includeExtent if the cache includes extent based filters
     */
    setCache (queryPromise, sqlFilters, includeExtent) {
        const key = this.getCacheKey(sqlFilters, includeExtent);
        this._cache[key] = queryPromise;
    }

    /**
     * Returns list of cache keys that have caches
     *
     * @method cacheActiveKeys
     * @returns {Array} list of keys with active caches
     */
    cacheActiveKeys () {
        const c = this._cache;
        return Object.keys(c).filter(k => c[k]);
    }

    /**
     * Resets all internal caches.
     *
     * @method clearAllCaches
     */
    clearAllCaches () {
        // lol
        this._cache = {};
    }

    /**
     * Resets all internal caches related to a filter.
     *
     * @method clearCacheSet
     * @param {String} filterName filter that has changed and needs its caches wiped
     */
    clearCacheSet (filterName) {
        // the keys are wrapped in $ chars to avoid matching similarly named filter keys.
        // e.g. 'plugin' would also match 'plugin1' in an indexOf call, but '$plugin$' won't match '$plugin1$'
        this.cacheActiveKeys().forEach(c => {
            if (c.indexOf(`$${filterName}$`) > -1) {
                this._cache[c] = undefined;
            }
        });
    }

    /**
     * Resets all internal filter settings to have no filter applied. Does not trigger filter change events.
     *
     * @method clearAll
     */
    clearAll () {
        this._sql = {};
        this._extent = undefined; 
        this.clearAllCaches();
    }
}

module.exports = () => ({
    Filter
});