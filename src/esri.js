'use strict';

function esriService(esriBundle, extent, sr) {
    const params = new esriBundle.ProjectParameters();
    const gsvc = new esriBundle.GeometryService('http://sncr01wbingsdv1.ncr.int.ec.gc.ca/' +
     'arcgis/rest/services/Utilities/Geometry/GeometryServer');

    params.geometries = extent;
    params.outSR = sr;

    gsvc.project(params, function (projectedExtents) {
        // return array returned from esriService
        return new esriBundle.EsriExtent(projectedExtents);
    });
}

module.exports = function (esriBundle) {
    return {
        esriBundle: esriBundle,
        esriService: esriService
    };
};
