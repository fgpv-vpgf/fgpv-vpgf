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
     * @method getCombinedSql
     * @returns {String} combination of any active symbol and/or api filter statements
     */
    getCombinedSql () {
        // puts all active layer-based sql statements into a single statement, ANDed
        if (this._symbolSql && this._apiSql) {
            return `${this._symbolSql} AND ${this._apiSql}`;
        } else {
            return this._symbolSql || this._apiSql;
        }
    }

    /**
     * Returns a SQL WHERE condition that is combination of any symbol and api filter statements that are active
     * and also includes a condition that restricts against any active grid filter
     *
     * @method getSqlPlusGrid
     * @returns {String} combination of any active symbol, api, and grid filter statements
     */
    getSqlPlusGrid () {
        // puts all active sql statements into a single statement, ANDed
        const cSql = this.getCombinedSql();

        if (cSql && this._gridSql) {
            return `${cSql} AND ${this._gridSql}`;
        } else {
            return cSql || this._gridSql;
        }
    }

    /**
     * Tells what object ids are currently passing the layer-specific filters.
     *
     * @method getLayerFilterOIDs
     * @param {Extent} [extent] if provided, the result list will only include features intersecting the extent
     * @returns {Promise} resolves with array of valid OIDs that layer is filtering. resolves with undefined if there is no filters being used
     */
    getLayerFilterOIDs (extent) {
        return this._parent.getLayerFilterOIDs(extent);
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
        this._layerExtentOID = undefined;
        this._layerSqlOID = undefined;

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
        this._layerExtentOID = undefined;
        this._layerSqlOID = undefined;

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
            this._layerExtentOID = undefined;
        }
        
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
        this._layerSqlOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters that are active
        this._layerExtentOID = undefined; // promise.  resolves with list of OIDs that pass any SQL filters AND extent filters that are active
    }

}

module.exports = () => ({
    Filter
});