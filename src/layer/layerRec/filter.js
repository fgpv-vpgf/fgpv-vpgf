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

        this.clearAll();
    }

    /**
     * Indicates if any filters are active
     *
     * @method isActive
     * @returns {Boolean} indicates if any filters are active
     */
    isActive () {
        return !!(this._symbolSql || this._apiSql || this._gridSql);
    }

    /**
     * Returns a SQL WHERE condition that is combination of any symbol and api filter statements that are active
     *
     * @method getCombinedNonGridSql
     * @returns {String} combination of any active symbol and/or api filter statements
     */
    getCombinedNonGridSql () {
        // puts all active layer-based sql statements into a single statement, ANDed
        if (this._symbolSql && this._apiSql) {
            return `${this._symbolSql} AND ${this._apiSql}`;
        } else {
            return this._symbolSql || this._apiSql;
        }
    }

    /**
     * Returns a SQL WHERE condition that is combination of any active filters.
     *
     * @method getCombinedSql
     * @returns {String} combination of any active symbol, api, and grid filter statements
     */
    getCombinedSql () {
        // puts all active sql statements into a single statement, ANDed
        const cSql = this.getCombinedNonGridSql();

        if (cSql && this._gridSql) {
            return `${cSql} AND ${this._gridSql}`;
        } else {
            return cSql || this._gridSql;
        }
    }

    /**
     * Tells what object ids are currently passing the layer's filters, but omits any influence from grid filters.
     *
     * @method getNonGridFilterOIDs
     * @param {Extent} [extent] if provided, the result list will only include features intersecting the extent
     * @returns {Promise} resolves with array of valid OIDs that layer is filtering (excluding grid filters). resolves with undefined if there is no filters being used
     */
    getNonGridFilterOIDs (extent) {
        return this._parent.getNonGridFilterOIDs(extent);
    }

    /**
     * Tells what object ids are currently passing the layer's filters.
     *
     * @method getFilterOIDs
     * @param {Extent} [extent] if provided, the result list will only include features intersecting the extent
     * @returns {Promise} resolves with array of valid OIDs that layer is filtering. resolves with undefined if there is no filters being used
     */
    getFilterOIDs (extent) {
        return this._parent.getFilterOIDs(extent);
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
     * Registers a new symbol filter clause and triggers filter change events.
     *
     * @method setSymbolSql
     * @param {String} whereClause clause defining the active filters on symbols. Use '' for no filter. Use '1=2' for everything filtered.
     */
    setSymbolSql (whereClause) {
        this._symbolSql = whereClause;

        // invalidate caches
        this.clearAllCaches();

        // tell the world
        this.eventRaiser(shared.filterType.SYMBOL);
    }

    /**
     * Registers a new grid filter clause and triggers filter change events.
     *
     * @method setGridSql
     * @param {String} whereClause clause defining the active filters on the grid. Use '' for no filter. Use '1=2' for everything filtered.
     */
    setGridSql (whereClause) {
        this._gridSql = whereClause;

        // clear caches that care about grid state.
        this._layerOID = undefined;
        this._layerExtentOID = undefined;

        // tell the world
        this.eventRaiser(shared.filterType.GRID);
    }

    /**
     * Registers a new API filter clause and triggers filter change events.
     *
     * @method setApiSql
     * @param {String} whereClause clause defining the active filters from the API. Use '' for no filter. Use '1=2' for everything filtered.
     */
    setApiSql (whereClause) {
        this._apiSql = whereClause;

        // invalidate caches
        this.clearAllCaches();

        // tell the world
        this.eventRaiser(shared.filterType.API);
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
            this._layerExtentOID = undefined;
            this._layerNoGridExtentOID = undefined;
        }
        
    }

    /**
     * Returns cache property depending on the situation we are in.
     * Values should align to properties of this class
     *
     * @method getCacheKey
     * @param {Boolean} includeGridFilter if the cache includes grid based filters
     * @param {Boolean} includeExtent if the cache includes extent based filters
     * @returns {String} the cache key to use
     */
    getCacheKey (includeGridFilter, includeExtent) {
        const key = `${includeGridFilter ? 'Y' : 'N'}${includeExtent ? 'Y' : 'N'}`;
        const resultMap = {
            YY: '_layerExtentOID',
            YN: '_layerOID',
            NY: '_layerNoGridExtentOID',
            NN: '_layerNoGridOID'
        };

        return resultMap[key];
    }

    /**
     * Resets all internal filter settings to have no filter applied. Does not trigger filter change events.
     *
     * @method clearAll
     */
    clearAll () {
        this._symbolSql = ''; // holds any symbol-filter sql string. '' means no filter active
        this._apiSql = '';  // holds any api-defined sql string. '' means no filter active
        this._gridSql = ''; // holds any grid sql string. '' means no filter active
        this._extent = undefined; 
        this.clearAllCaches();
    }

    /**
     * Resets all internal caches.
     *
     * @method clearAllCaches
     */
    clearAllCaches () {
        this._layerOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters that are active
        this._layerExtentOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters AND extent filters that are active
        this._layerNoGridOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters that are active except for grid filters
        this._layerNoGridExtentOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters (except for grid filters) AND extent filters that are active
    }

}

module.exports = () => ({
    Filter
});