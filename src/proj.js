'use strict';
const proj4 = require('proj4');
const terraformer = require('terraformer');
const teraProj = require('terraformer-proj4js');

/**
 * Reproject a GeoJSON object in place.  This is a wrapper around terraformer-proj4js.
 * @param {Object} geojson the GeoJSON to be reprojected, this will be modified in place
 * @param {String|Number} outputSpatialReference the target spatial reference,
 * 'EPSG:4326' is used by default; if a number is suppied it will be used as an EPSG code
 * @param {String|Number} inputSpatialReference same rules as outputSpatialReference if suppied
 * if missing it will attempt to find it encoded in the GeoJSON
 */
function projectGeojson(geojson, outputSpatialReference, inputSpatialReference) {
    const converter = teraProj(terraformer, proj4);
    converter(geojson, outputSpatialReference, inputSpatialReference);
}

/**
 * Reproject an EsriExtent object on the client.  Does not require network
 * traffic, but may not handle conversion between projection types as well.
 * Internally it tests 8 points along each edge and takes the max extent
 * of the result.
 *
 * @param {EsriExtent} extent to reproject
 * @param {Object} sr is the target spatial reference (if a number it
 *                 will be treated as a WKID)
 * @returns {Object} an extent as an unstructured object
 */
function localProjectExtent(extent, sr) {

    // interpolates two points by splitting the line in half recursively
    function interpolate(p0, p1, steps) {
        if (steps === 0) { return [p0, p1]; }

        let mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        if (steps === 1) {
            return [p0, mid, p1];
        }
        if (steps > 1) {
            let i0 = interpolate(p0, mid, steps - 1);
            let i1 = interpolate(mid, p1, steps - 1);
            return i0.concat(i1.slice(1));
        }
    }

    const points = [[extent.xmin, extent.ymin], [extent.xmax, extent.ymin],
                    [extent.xmax, extent.ymax], [extent.xmin, extent.ymax],
                    [extent.xmin, extent.ymin]];
    let interpolatedPoly = [];
    let srcProj;

    // interpolate each edge by splitting it in half 3 times (since lines are not guaranteed to project to lines we need to consider
    // max / min points in the middle of line segments)
    [0, 1, 2, 3]
        .map(i => interpolate(points[i], points[i + 1], 3).slice(1))
        .forEach(seg => interpolatedPoly = interpolatedPoly.concat(seg));

    // find the source extent (either from wkid or wkt)
    if (extent.spatialReference.wkid) {
        srcProj = 'EPSG:' + extent.spatialReference.wkid;
    } else if (extent.spatialReference.wkt) {
        srcProj = extent.spatialReference.wkt;
    } else {
        throw new Error('No WKT or WKID specified on extent.spatialReference');
    }

    // find the destination extent
    let destProj = sr;
    if (typeof destProj === 'object') {
        destProj = 'EPSG:' + destProj.wkid;
    } else if (typeof destProj === 'number') {
        destProj = 'EPSG:' + destProj;
    }

    if (!proj4.defs(srcProj)) {
        throw new Error('Source projection not recognized by proj4 library');
    }
    const projConvert = proj4(srcProj, destProj);
    const transformed = interpolatedPoly.map(x => projConvert.forward(x));

    const xvals = transformed.map(x => x[0]);
    const yvals = transformed.map(x => x[1]);

    const x0 = Math.min.apply(null, xvals);
    const x1 = Math.max.apply(null, xvals);

    const y0 = Math.min.apply(null, yvals);
    const y1 = Math.max.apply(null, yvals);

    return { x0, y0, x1, y1, sr };
}

function projectEsriExtentBuilder(esriBundle) {
    return (extent, sr) => {
        const p = localProjectExtent(extent, sr);
        return new esriBundle.Extent(p.x0, p.y0, p.x1, p.y1, p.sr);
    };
}

function esriServiceBuilder(esriBundle) {
    /**
     * Reproject an esri geometry object on the server. Requires network traffic
     * to esri's Geometry Service, but may be slower than proj4 conversion.
     * Internally it tests 1 point and reprojects it to another spatial reference.
     *
     * @param {url} url for the ESRI Geometry Service
     * @param {geometries} geometries to be projected
     * @param {sr} sr is the target spatial reference
     * @returns {Promise} promise to return reprojected geometries
     */
    return (url, geometries, sr) => {
        return new Promise(
            (resolve, reject) => {
                const params = new esriBundle.ProjectParameters();

                // connect to esri server
                const gsvc = new esriBundle.GeometryService(url);

                params.geometries = geometries;
                params.outSR = sr;

                // call project function from esri server to do conversion
                gsvc.project(params,
                    projectedExtents => {
                        resolve(projectedExtents);
                    }, error => {
                        reject(error);
                    });
            });
    };
}

/**
* Checks if two spatial reference objects are equivalent.  Handles both wkid and wkt definitions
*
* @method isSpatialRefEqual
* @static
* @param {type} sr1 Esri Spatial Reference First to compare
* @param {type} sr2 Esri Spatial Reference Second to compare
* @return {Boolean} true if the two spatial references are equivalent.  False otherwise.
*/
function isSpatialRefEqual(sr1, sr2) {
    if ((sr1.wkid) && (sr2.wkid)) {
        // both SRs have wkids
        return sr1.wkid === sr2.wkid;
    } else if ((sr1.wkt) && (sr2.wkt)) {
        // both SRs have wkt's
        return sr1.wkt === sr2.wkt;
    } else {
        // not enough info provided or mismatch between wkid and wkt.
        return false;
    }
}

module.exports = function (esriBundle) {
    // TODO: Move Point and SpatialReference to its own (geometry) module

    // TODO consider moving this elsewhere.  state is bad, but these are common, and we have no service for esri defs
    proj4.defs('EPSG:3978', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 ' +
        '+lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:3979', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 ' +
        '+x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:54004', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 ' +
        '+datum=WGS84 +units=m +no_defs');
    proj4.defs('EPSG:102100', proj4.defs('EPSG:3857'));

    return {
        addProjection: proj4.defs, // straight passthrough at the moment, maybe add arg checking (two args)?
        getProjection: proj4.defs, // straight passthrough at the moment, maybe add arg checking (one arg)?
        esriServerProject: esriServiceBuilder(esriBundle),
        isSpatialRefEqual,
        localProjectExtent,
        projectGeojson,
        Point: esriBundle.Point,
        projectEsriExtent: projectEsriExtentBuilder(esriBundle),
        SpatialReference: esriBundle.SpatialReference
    };
};
