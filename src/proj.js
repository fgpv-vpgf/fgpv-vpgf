let proj4 = require('proj4');
proj4 = proj4.default ? proj4.default : proj4;

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
 * Convert a projection to an string that is compatible with proj4.  If it is an ESRI SpatialReference or an integer it will be converted.
 * @param {Object|Integer|String} proj an ESRI SpatialReference, integer or string.  Strings will be unchanged and unchecked,
 * ints and SpatialReference objects will be converted.
 * @return {String} A string in the form EPSG:####
 * @private
 */
function normalizeProj(proj) {
    if (typeof proj === 'object') {
        if (proj.wkid) {
            return 'EPSG:' + proj.wkid;
        } else if (proj.wkt) {
            return proj.wkt;
        }
    } else if (typeof proj === 'number') {
        return 'EPSG:' + proj;
    } else if (typeof proj === 'string') {
        return proj;
    }
    throw new Error('Bad argument type, please provide a string, integer or SpatialReference object.');
}

/**
 * Project a single point.
 * @param {Object|Integer|String} srcProj the spatial reference of the point (as ESRI SpatialReference, integer WKID or an EPSG string)
 * @param {Object|Integer|String} destProj the spatial reference of the result (as ESRI SpatialReference, integer WKID or an EPSG string)
 * @param {Array|Object} point a 2d array or object with {x,y} props containing the coordinates to Reproject
 * @return {Array|Object} a 2d array or object containing the projected point
 */
function localProjectPoint(srcProj, destProj, point) {
    return proj4(normalizeProj(srcProj), normalizeProj(destProj), point);
}

/**
 * Project a single point.
 * @param {Object|Integer|String} destProj the spatial reference of the result (as ESRI SpatialReference, integer WKID or an EPSG string)
 * @param {Object} geometry an object conforming to ESRI Geometry object standards containing the coordinates to Reproject
 * @return {Object} an object conforming to ESRI Geomtery object standards containing the input geometry in the destination projection
 */
function localProjectGeometry(destProj, geometry) {
    // FIXME we seem to be really dependant on wkid. ideally enhance to handle all SR types

    // HACK >:'(
    // terraformer has this undesired behavior where, if your input geometry is in WKID 102100, it will magically
    // project all your co-ordinates to lat/long when converting between ESRI and GeoJSON formats.
    // to stop it from ruining us, we temporarily set the spatial reference to nonsense so it will leave it alone
    const realSR = geometry.spatialReference;
    geometry.spatialReference = { wkid: 8888 }; // nonsense!
    const grGeoJ = terraformer.ArcGIS.parse(geometry, { sr: 8888 });
    geometry.spatialReference = realSR;

    // project json
    projectGeojson(grGeoJ, normalizeProj(destProj), normalizeProj(realSR));

    // back to esri format
    const grEsri = terraformer.ArcGIS.convert(grGeoJ);

    // doing this because .convert likes to attach a lat/long spatial reference for fun.
    grEsri.spatialReference = destProj;

    return grEsri;
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
    let destProj = normalizeProj(sr);

    if (extent.spatialReference.wkid && !proj4.defs(srcProj)) {
        throw new Error('Source projection WKID not recognized by proj4 library');
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

/**
 * Check whether or not a spatialReference is supported by proj4 library.
 *
 * @param {Object} spatialReference to be checked to see if it's supported by proj4. Can be ESRI SR object or a EPSG string.
 * @param {Function} epsgLookup an optional lookup function for EPSG codes which are not loaded
 * in the proj4 definitions, the function should take a numeric EPSG code and return a Promise
 * resolving with a proj4 style definition string
 * @returns {Object} with the structure {
 *  foundProj: (bool) indicates if the projection was found without a web lookup,
 *  message: (string) provides a reason why the projection was not found,
 *  lookupPromise: (Promise) an promise resolving after any web lookups. Resolves with true or false overall success.
 * }
 */
function checkProj(spatialReference, epsgLookup) {
    let srcProj;
    let latestProj;
    let epsgKey = true; // indicates we are dealing with an EPSG key
    const res = {
        foundProj: false,
        message: 'Source projection OK',
        lookupPromise: Promise.resolve(true)
    };

    const addCode = idnum => {
        return `EPSG:${idnum}`;
    };

    // determine what our parameter is
    if (spatialReference.wkid) {
        // esri SR with wkid.  also check if it has a latestWkid
        srcProj = addCode(spatialReference.wkid);
        if (spatialReference.latestWkid) {
            latestProj = addCode(spatialReference.latestWkid);
        }

    } else if (spatialReference.wkt) {
        // esri SR with wkt. it is good to go.
        res.foundProj = true;
        epsgKey = false;
    } else if (typeof spatialReference === 'string') {
        srcProj = spatialReference;
    } else if (typeof spatialReference === 'number') {
        srcProj = addCode(String(spatialReference));
    } else {
        // dont know what we got.
        res.message = 'No WKT, WKID, or EPSG code specified on input';
        res.lookupPromise = Promise.resolve(false);
        epsgKey = false;
    }

    if (epsgKey) {
        // dealing with an epsg key. check for a definition

        // worker function. if we had to get latest wkid from internet,
        // need to also map that result to the normal wkid. but only
        // if the two wkids are different.
        const applyLatest = (latestDef, normalDef) => {
            if (latestDef !== normalDef) {
                proj4.defs(normalDef, proj4.defs(latestDef));
            }
        };

        if (proj4.defs(srcProj)) {
            // already defined in proj4. good.
            res.foundProj = true;
        } else {
            // we currently don't have this in proj4
            if (latestProj && proj4.defs(latestProj)) {
                // we have the latestWkid projection defined.
                applyLatest(latestProj, srcProj);
                res.foundProj = true;
            } else {
                // need to find a definition

                if (epsgLookup) {
                    res.message = 'Attempting to lookup WKID';

                    // function to execute a lookup & store result if success
                    const doLookup = epsgStr => {
                        return epsgLookup(epsgStr).then(def => {
                            if (def === null) {
                                return false;
                            }
                            proj4.defs(epsgStr, def);
                            return true;
                        });
                    };

                    // check the latestWkid first, if it exists (as that wkid is usally the EPSG friendly one)
                    // otherwise make a dummy promise that will just cause the standard wkid promise to run.
                    const latestLookup = latestProj ? doLookup(latestProj) : Promise.resolve(false);

                    res.lookupPromise = latestLookup.then(latestSuccess => {
                        if (latestSuccess) {
                            // found the latestWkid code
                            applyLatest(latestProj, srcProj);
                            return true;
                        } else {
                            // no luck with latestWkid, so lookup on normal code
                            return doLookup(srcProj);
                        }
                    });

                } else {
                    // no lookup function. no projections for you.
                    res.lookupPromise = Promise.resolve(false);
                    res.message = 'Source projection not recognized by proj4 library';
                }
            }
        }
    }

    return res;
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
 * Checks if two spatial reference objects are equivalent.  Handles both wkid and wkt definitions.
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
    // TODO some of the hardcoded 102### projections might be removed after https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2234
    // TODO consider moving this elsewhere.  state is bad, but these are common, and we have no service for esri defs
    proj4.defs('EPSG:3978', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 ' +
        '+lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:3979', '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 ' +
        '+x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:54004', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 ' +
        '+datum=WGS84 +units=m +no_defs');
    proj4.defs('EPSG:102100', proj4.defs('EPSG:3857'));
    proj4.defs('EPSG:102187', '+proj=tmerc +lat_0=0 +lon_0=-114 +k=0.9999 +x_0=0 +y_0=0 ' +
        '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
    proj4.defs('EPSG:102190', '+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 ' +
        '+x_0=1000000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

    // add UTM projections
    let utm = 1;
    while (utm <= 60) {
        let zone = utm < 10 ? `0${utm}` : utm;
        proj4.defs(`EPSG:326${zone}`, `+proj=utm +zone=${utm} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`);
        utm++;
    }

    return {
        addProjection: proj4.defs, // straight passthrough at the moment, maybe add arg checking (two args)?
        checkProj,
        getProjection: proj4.defs, // straight passthrough at the moment, maybe add arg checking (one arg)?
        esriServerProject: esriServiceBuilder(esriBundle),
        Graphic: esriBundle.Graphic,
        graphicsUtils: esriBundle.graphicsUtils,
        isSpatialRefEqual,
        localProjectExtent,
        localProjectPoint,
        localProjectGeometry,
        projectGeojson,
        Point: esriBundle.Point,
        projectEsriExtent: projectEsriExtentBuilder(esriBundle),
        SpatialReference: esriBundle.SpatialReference
    };
};
