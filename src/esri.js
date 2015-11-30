'use strict';
const GeometryService = require('esri/tasks/GeometryService');
const ProjectParameters = require('esri/tasks/ProjectParameters');

function esriService(extent, sr) {
    const params = new ProjectParameters();
    const gsvc = new GeometryService('http://sncr01wbingsdv1.ncr.int.ec.gc.ca/arcgis/rest/' +
     'services/Utilities/Geometry/GeometryServer');

    params.geometries = extent;
    params.outSR = sr;

    gsvc.project(params, function (projectedExtents) {
        // return array returned from esriService
        return projectedExtents;
    });
}

function projectEsriExtentBuilder(esriBundle) {
    return (extent, sr) => {
        let projectedExtents = esriService(extent, sr);
        return new esriBundle.esriExtent(projectedExtents);
    };
}

module.exports = function (esriBundle) {
    return {
        localProjectExtent: esriService,
        projectEsriExtent: projectEsriExtentBuilder(esriBundle)
    };
};
