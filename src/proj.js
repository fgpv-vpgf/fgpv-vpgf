'use strict';
const proj4 = require('proj4');

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
        return new esriBundle.EsriExtent(p.x0, p.y0, p.x1, p.y1, p.sr);
    };
}

module.exports = function (esriBundle) {
    return {
        localProjectExtent: localProjectExtent,
        projectEsriExtent: projectEsriExtentBuilder(esriBundle)
    };
};
