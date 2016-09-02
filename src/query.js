'use strict';

// functions related to spatial querying

function queryGeometryBuilder(esriBundle) {

    /**
    * Fetch attributes from a layer that intersects with the given geometry
    * Accepts the following options:
    *   - geometry: Required. geometry to intersect with the layer.
    *   - url: Required if server based layer. Url to the map service layer to query against. Endpoint must support
    *          ESRI REST query interface. E.g. A feature layer endpoint.
    *   - featureLayer: Required if file based layer. Feature layer to query against
    *   - outFields: Optional. Array of strings containing field names to include in the results. Defaults to all fields.
    *   - where: Optional. A SQL where clause to filter results further. Useful when dealing with more results than the server can return.
    *   - returnGeometry: Optional. A boolean indicating if result geometery should be returned with results.  Defaults to false
    *   - outSpatialReference: Required if returnGeometry is true. The spatial reference the return geometry should be in.
    * @param {Object} options settings to determine if sub layers or certain attributes should be skipped.
    * @return {Promise} resolves with a feature set of features that satisfy the query
    */
    return options => {
        // create and set the esri query parameters

        const query = new esriBundle.Query();

        query.returnGeometry = options.returnGeometry || false;
        if (options.returnGeometry) {
            query.outSpatialReference = options.outSpatialReference;
        }
        if (options.outFields) {
            query.outFields = options.outFields;
        } else {
            query.outFields = ['*'];
        }
        if (options.where) {
            query.where = options.where;
        }
        query.geometry = options.geometry;
        query.spatialRelationship = esriBundle.Query.SPATIAL_REL_INTERSECTS; // esriSpatialRelIntersects

        return new Promise((resolve, reject) => {
            // run the query. server based layers use a query task. file based layers use the layer's query function.
            if (options.url) {
                const queryTask = new esriBundle.QueryTask(options.url);

                // issue the map server query request
                queryTask.execute(query,
                    featureSet => {
                        resolve(featureSet);
                    },
                    error => {
                        reject(error);
                    }
                );
            } else if (options.featureLayer) {
                // run the query on the layers internal data
                options.featureLayer.queryFeatures(query,
                    featureSet => {
                        resolve(featureSet);
                    },
                    error => {
                        reject(error);
                    }
                );
            }
        });
    };
}

module.exports = esriBundle => {
    return {
        queryGeometry: queryGeometryBuilder(esriBundle)
    };
};
