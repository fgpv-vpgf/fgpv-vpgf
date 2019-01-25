'use strict';

// functions related to spatial querying, attribute querying

const sqlParser = require('js-sql-parser');

function queryGeometryBuilder(esriBundle) {

    /**
     * Fetch attributes from a layer that intersects with the given geometry
     * Accepts the following options:
     *   - geometry: Required. geometry to intersect with the layer.
     *               Layers that are not hosted on an ArcGIS Server (e.g. file layers, WFS) can only use Extent geometries
     *   - url: Required if server based layer. Url to the map service layer to query against. Endpoint must support
     *          ESRI REST query interface. E.g. A feature layer endpoint.
     *   - featureLayer: Required if file based layer. Feature layer to query against
     *   - outFields: Optional. Array of strings containing field names to include in the results. Defaults to all fields.
     *   - where: Optional. A SQL where clause to filter results further. Useful when dealing with more results than the server can return.
     *            Cannot be used with layers that are not hosted on an ArcGIS Server (e.g. file layers, WFS)
     *   - returnGeometry: Optional. A boolean indicating if result geometery should be returned with results.  Defaults to false
     *   - outSpatialReference: Required if returnGeometry is true. The spatial reference the return geometry should be in.
     * @param {Object} options settings to determine the details and behaviors of the query.
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
            if (options.featureLayer) {
                throw new Error('Cannot use WHERE clauses in queries against non-ArcGIS Server based layers');
            }
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

// similar to queryGeometry, but only returns OIDs, allowing us to run more efficient web requests.
// specifically, we can ignore the result limit on the server. Also doesn't require a geomtery, can just be
// where clause
function queryIdsBuilder(esriBundle) {

    /**
     * Fetch the Object IDs of features from a layer that satisfies the options
     * Accepts the following options:
     *   - geometry: Optional. geometry to intersect with the layer.
     *               Layers that are not hosted on an ArcGIS Server (e.g. file layers, WFS) can only use Extent geometries
     *   - url: Required if server based layer. Url to the map service layer to query against. Endpoint must support
     *          ESRI REST query interface. E.g. A feature layer endpoint.
     *   - featureLayer: Required if file based layer. Feature layer to query against
     *   - where: Optional. A SQL where clause to filter results further. Useful when dealing with more results than the server can return,
     *            or if additional filters are active.
     *            Cannot be used with layers that are not hosted on an ArcGIS Server (e.g. file layers, WFS)
     * @param {Object} options settings to determine the details of the query
     * @return {Promise} resolves with an array of Object Ids that satisfy the query
     */
    return options => {
        // create and set the esri query parameters

        const query = new esriBundle.Query();
        query.returnGeometry = false;

        if (options.where) {
            if (options.featureLayer) {
                throw new Error('Cannot use WHERE clauses in queries against non-ArcGIS Server based layers');
            }
            query.where = options.where;
        }
        if (options.geometry) {
            query.geometry = options.geometry;
            query.spatialRelationship = esriBundle.Query.SPATIAL_REL_INTERSECTS; // esriSpatialRelIntersects
        }

        return new Promise((resolve, reject) => {
            // run the query. server based layers use a query task. file based layers use the layer's query function.
            if (options.url) {
                const queryTask = new esriBundle.QueryTask(options.url);

                // issue the map server query request
                queryTask.executeForIds(query,
                    oidArray => {
                        resolve(oidArray);
                    },
                    error => {
                        reject(error);
                    }
                );
            } else if (options.featureLayer) {
                // run the query on the layers internal data
                options.featureLayer.queryIds(query,
                    oidArray => {
                        resolve(oidArray);
                    },
                    error => {
                        reject(error);
                    }
                );
            }
        });
    };
}

// AQL classes.  Attribute Query Language is a cheap thing that allows you to evaluate a SQL where style clause
// against an attribute object (i.e. a key-value dictionary). Has limited support for basic query logic
// (can be expanded)

// for science. baseclass of all Aql classes. if we have a common property we can add here
class AqlRoot {
}

// baseclass for Aql classes that deal with one value
class AqlAtomic extends AqlRoot {
    constructor (val) {
        super();
        this.value = val;
    }
}

// baseclass for Aql classes that deal with two values
class AqlDiatomic extends AqlRoot {
    constructor (left, right) {
        super();
        this.left = left;
        this.right = right;
    }
}

// handles a literal (a constant). a string, a number, a boolean
class AqlLiteral extends AqlAtomic {
    // constructor param is the literal value

    evaluate () {
        return this.value;
    }
}

// handles an identifier. the name of an attribute property
class AqlIdentifier extends AqlAtomic {
    // constructor param is the property name of the attribute

    evaluate (attribute) {
        return attribute[this.value];
    }
}

// handles an array of values
class AqlArray extends AqlAtomic {
    // constructor param is the array

    evaluate () {
        return this.value;
    }
}

// handles an equals operator
class AqlEquals extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) === this.right.evaluate(attribute);
    }
}

// handles a not-equals operator
class AqlNotEquals extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) !== this.right.evaluate(attribute);
    }
}

// handles a greater-than-equals operator
class AqlGreaterEquals extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) >= this.right.evaluate(attribute);
    }
}

// handles a less-than-equals operator
class AqlLessEquals extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) <= this.right.evaluate(attribute);
    }
}

// handles a greater-than operator
class AqlGreater extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) > this.right.evaluate(attribute);
    }
}

// handles a less-than operator
class AqlLess extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) < this.right.evaluate(attribute);
    }
}

// handles an and operator
class AqlAnd extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) && this.right.evaluate(attribute);
    }
}

// handles an or operator
class AqlOr extends AqlDiatomic {
    evaluate (attribute) {
        return this.left.evaluate(attribute) || this.right.evaluate(attribute);
    }
}

// handles an in / not in operator
class AqlIn extends AqlDiatomic {
    constructor (left, right, hasNot) {
        super(left, right);
        this.hasNot = hasNot;
    }

    evaluate (attribute) {
        // we assume .right is an array (AqlArray)
        const result = this.right.evaluate(attribute).includes(this.left.evaluate(attribute));
        return this.hasNot ? !result : result;
    }
}

// handles a like operator
class AqlLike extends AqlDiatomic {
    constructor (left, right, hasNot) {
        super(left, right);
        this.hasNot = hasNot;
    }

    evaluate (attribute) {
        // we assume .right evaulates to a string
        const attVal = this.left.evaluate(attribute);
        let pattern = this.right.evaluate(attribute);

        // TODO basic wildcard search for now. may need to handle escaping special characters
        //      can steal codes from https://stackoverflow.com/questions/1314045/emulating-sql-like-in-javascript

        // convert % to *
        pattern = pattern.replace(/%/g, '.*');

        const result = RegExp(pattern).test(attVal);
        return this.hasNot ? !result : result;
    }
}

// handles a not operator
class AqlNot extends AqlAtomic {
    evaluate (attribute) {
        return !this.value.evaluate(attribute);
    }
}

// handles a set of parenthesis
class AqlParentheses extends AqlAtomic {
    evaluate (attribute) {
        // INTENSE
        return this.value.evaluate(attribute);
    }
}

// handles an inline function.
// can add functions as we find need to support them
class AqlFunctionCall extends AqlRoot {
    constructor (functionName, params) {
        super();
        this.params = params; // array of parameters for the function. can be none or many

        // get what function we are doing, check for support
        this.fName = functionName.toLowerCase();
        if (['upper', 'lower', 'date'].indexOf(this.fName) === -1) {
            throw new Error('Encountered unsupported sql function in filter. Unhandled function: ' + functionName);
        }
    }

    evaluate (attribute) {
        // call our named function. evaluate the parameters array then pass them as actual params to the function
        return this[this.fName](...this.params.map(p => p.evaluate(attribute)));
    }

    // assumes param will be a string
    upper (value) {
        return value.toUpperCase();
    }

    // assumes param will be a string
    lower (value) {
        return value.toLowerCase();
    }

    // assumes param will be something that can be cast to a date
    date (value) {
        // ESRI date fields are epoch dates (integers).
        const d = new Date(value);
        return d.getTime();
    }

}

// converts a tree node from our SQL parse output to the appropriate Aql object
function sqlNodeToAqlNode (node) {

    // TODO add support for datatype casting?

    const typeReactor = {
        AndExpression: n => {
            return new AqlAnd(sqlNodeToAqlNode(n.left), sqlNodeToAqlNode(n.right));
        },
        OrExpression: n => {
            return new AqlOr(sqlNodeToAqlNode(n.left), sqlNodeToAqlNode(n.right));
        },
        NotExpression: n => {
            return new AqlNot(sqlNodeToAqlNode(n.value));
        },
        InExpressionListPredicate: n => {
            return new AqlIn(sqlNodeToAqlNode(n.left), sqlNodeToAqlNode(n.right), !!n.hasNot);
        },
        LikePredicate: n => {
            return new AqlLike(sqlNodeToAqlNode(n.left), sqlNodeToAqlNode(n.right), !!n.hasNot);
        },
        ComparisonBooleanPrimary: n => {
            const operatorMap = {
                '=': AqlEquals,
                '==': AqlEquals,
                '===': AqlEquals,
                '>': AqlGreater,
                '>=': AqlGreaterEquals,
                '<': AqlLess,
                '<=': AqlLessEquals,
                '!=': AqlNotEquals,
                '!==': AqlNotEquals
            };

            const aqlClass = operatorMap[n.operator];
            if (!aqlClass) {
                throw new Error('Encountered unsupported operator in filter. Unhandled operator: ' + n.operator);
            }

            return new aqlClass(sqlNodeToAqlNode(n.left), sqlNodeToAqlNode(n.right));
        },
        FunctionCall:  n => {
            return new AqlFunctionCall(n.name, n.params.map(p => sqlNodeToAqlNode(p)));
        },
        Identifier: n => {
            return new AqlIdentifier(n.value);
        },
        Number: n => {
            // number in string form
            return new AqlLiteral(Number(n.value));
        },
        String: n => {
            // remove embedded quotes from string
            // TODO check if escaped double quote actually exists or was just part of the npm test page output display
            let s = n.value;
            if (s.startsWith('"') || s.startsWith(`'`)) {
                s = s.substring(1, s.length - 1);
            } else if (s.startsWith('\"')) {
                s = s.substring(2, s.length - 2);
            }
            return new AqlLiteral(s);
        },
        Boolean: n => {
            // node values are in all caps
            return new AqlLiteral(n.value.toLowerCase() === 'true');
        },
        ExpressionList: n => {
            // this code currently assumes that items in the expression list are literals.
            // if we need any dynamically generated stuff (i.e. checking against other attribute properties)
            // then this needs to change and the guts of AqlArray.evaluate needs to generate the array at
            // every call (way less efficient)
            return new AqlArray(n.value.map(nn => sqlNodeToAqlNode(nn).evaluate()));
        },
        SimpleExprParentheses: n => {
            // n.value here is an ExpressionList, but i've yet to see an instance where it has more than one element in the array.
            // for now we do a hack and hoist up the first element. This hack lets us pre-evaluate other expression lists
            // (i.e. ones used in IN commands) that are filled with constants.

            // TODO invest some time to try to find a case where there is > 1 element, and ensure the ExpressionList result
            //      formatting doesn't break the equation.
            // TODO there could be some minor optimization in removing the brackets from the expression list
            //      or conversly not adding brackets here.  Would want to be confident we know n.value is
            //      always an expression list. Not urgent, no harm in redundant brackets.

            if (n.value.type === 'ExpressionList') {
                if (n.value.value.length > 1) {
                    console.warn(`While converting SQL to AQL, encountered a parsed bracket containing an ExpressionList with more than one element`, n.value);
                }
                return new AqlParentheses(sqlNodeToAqlNode(n.value.value[0]));
            } else {
                // warn, and hail mary that we can just parse it
                console.warn(`While converting SQL to AQL, encountered a parsed bracket containing ${n.value.type} instead of ExpressionList`);
                return new AqlParentheses(sqlNodeToAqlNode(n.value));
            }
        }
    }

    if (!typeReactor[node.type]) {
        throw new Error('Encountered unsupported query in filter. Unhandled type: ' + node.type);
    } else {
        return typeReactor[node.type](node);
    }
}

// scans a where clause for any funny notation and attempts to convert to standard sql
// returns cleaned version.
function standardizeSql (sqlWhere) {

    // ESRI supports a non-standard approach to casting dates.
    // e.g. you can say `start_date < DATE '1-1-2001'`
    // our sql parser will die on this.
    // so we attempt to convert it to a function.

    // TODO this logic needs flushing out.
    //      can there be other delimiters? can they have escape characters?
    //      do we need to handle a date cast on an attribute name instead of a constant?
    //      can we rely on a space before/after DATE function?

    const findDate = sql => {
        return sql.toUpperCase().indexOf(' DATE ');
    };

    let nextDate = findDate(sqlWhere);

    while (nextDate > -1) {

        const firstDelim = sqlWhere.indexOf(`'`, nextDate);
        const lastDelim = sqlWhere.indexOf(`'`, firstDelim + 1);

        // put bracket before and after delimiters
        sqlWhere = sqlWhere.substring(0, nextDate) + ' DATE(' + sqlWhere.substring(firstDelim, lastDelim + 1) +
            ')' + sqlWhere.substring(lastDelim + 1);

        // see if we still have more DATE functions
        nextDate = findDate(sqlWhere);
    }

    return sqlWhere;

}

// converts a SQL where clause to an Aql object
function sqlToAql (sqlWhere) {

    const fakeSQL = 'SELECT muffins FROM pod WHERE ' + standardizeSql(sqlWhere);

    // the sqlParser will construct an object tree of the sql statement. we then crawl through the where clause tree
    // and convert each node to the equivalent aql object
    const queryTree = sqlParser.parse(fakeSQL);
    return sqlNodeToAqlNode(queryTree.value.where);
}

/**
 * Given an SQL WHERE condition, will search an array of attribute objects and return a filtered
 * array containing attributes that satisfy the WHERE condition.
 * Array can contain raw attribute objects, or objects with a propery `attributes` that contain
 * an attribute object.
 *
 * @function sqlAttributeFilter
 * @param {Array} attributeArray               array of attribute objects or objects with `attributes` property.
 * @param {String} sqlWhere                    a SQL WHERE clause (without the word `WHERE`) that has field names matching the attribute property names.
 * @param {Boolean} [attribAsProperty=false]    indicates if the attribute object resides in a propery called `attributes`. Set to false if array contains raw attribute objects.
 * @returns {Array} array of attribute objects that meet the conditions of the filter. the result objects will be in the same form as they were passed in
 */
function sqlAttributeFilter (attributeArray, sqlWhere, attribAsProperty = false) {
    // attribAsProperty means where the attribute lives in relation to the array
    // {att} is a standard key-value object of attributes
    // [ {att} , {att} ] would be the false case.  this is the format of attributes from the geoApi attribute loader
    // [ {attributes:{att}}, {attributes:{att}} ] would be the true case. this is the format of attributes sitting in the graphics array of a filebased layer

    // convert the sql where clause to an attribute query language tree, then
    // use that to evaluate against each attribute.

    const aql = sqlToAql(sqlWhere);

    // split in two to avoid doing boolean check at every iteration
    if (attribAsProperty) {
        return attributeArray.filter(a => {
            return aql.evaluate(a.attributes);
         });
    } else {
        return attributeArray.filter(a => {
            return aql.evaluate(a);
         });
    }
}

/**
 * Given an SQL WHERE condition, will search an array of Graphics adjust their visibility
 * based on if they satisfy the WHERE condition.
 *
 * @function sqlAttributeFilter
 * @param {Array} graphics          array of Graphics. 
 * @param {String} sqlWhere         a SQL WHERE clause (without the word `WHERE`) that has field names matching the attribute property names.
 * @returns {Array} array of attributes of visible features.
 */
function sqlGraphicsVisibility (graphics, sqlWhere) {
    // variant of sqlAttributeFilter.  customized for turning graphics visibility on and off.
    // since we need to turn off the items "not in the query", this saves us doing multiple iterations.
    // however it becomes limited in that it really needs arrays of Graphic objects.

    // convert the sql where clause to an attribute query language tree, then
    // use that to evaluate against each attribute.

    if (sqlWhere === '') {
        // no restrictions. show everything
        graphics.forEach(g => g.show());
        return graphics;
    } else if (sqlWhere === '1=2') {
        // everything off. hide everything
        // TODO layer should be invisible, so maybe this is irrelevant? or is it better to be safe, as something else could use this function.
        graphics.forEach(g => g.hide());
        return [];
    }

    // otherwise we have a sql query to evaluate
    const aql = sqlToAql(sqlWhere);
    const visibleAttributes = [];

    graphics.forEach(g => {
        if (aql.evaluate(g.attributes)) {
            g.show();
            visibleAttributes.push(g.attributes);
        } else {
            g.hide();
        }
     });

     return visibleAttributes;
}

module.exports = esriBundle => {
    return {
        queryGeometry: queryGeometryBuilder(esriBundle),
        queryIds: queryIdsBuilder(esriBundle),
        sqlAttributeFilter,
        sqlGraphicsVisibility
    };
};
