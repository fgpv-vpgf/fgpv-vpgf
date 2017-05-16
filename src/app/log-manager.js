/* global Logger */

/**
 * @description
 *
 * Improves the js-logger library so that logger instances form a tree allowing more fine grained control over log message output.
 * It does not add anything to the global scope, rather it wraps the Logger get and setLevel methods.
 *
 * Logger.get('app.ui.toc') will create three loggers: 'app', 'app.ui', and 'app.ui.toc'. So Logger.get('app').setLevel(Logger.WARN) will
 * propagate down to 'app.ui', and 'app.ui.toc' as well.
 *
 */

Logger.useDefaults();

Logger._get = Logger.get;
Logger.get = get;

/**
 * Sets the output level of the given instance and all its children
 *
 * @param   {Object}    instance - Logger instance
 * @param   {Object}    lvl - Logger level to set, can be:
 *                                Logger.DEBUG
 *                                Logger.INFO
 *                                Logger.TIME
 *                                Logger.WARN
 *                                Logger.ERROR
 *                                Logger.OFF
 */
function setLevel(instance, lvl) {
    instance._children.forEach(c => c.setLevel(lvl)); // call our setLevel function (recursive)
    instance._setLevel(lvl); // call Logger setLevel, note the difference here
}

/**
 * Fetchs a logger instance and wraps the setLevel function. If parent is provided the instance is placed as a child of the parent
 * @param   {String}    status - a value from `statuses` object
 * @return  {Object}    Viewer
 */
function get(name, index = 1, parent) {
    const splitAmount = name.split('.');
    const splitName = name.split('.', index);
    const lgrName = splitName.join('.');
    const lgr = Logger._get(lgrName);

    // if set do not reset!
    if (!lgr._setLevel) {
        lgr._setLevel = lgr.setLevel;
        lgr.setLevel = setLevel.bind(null, lgr); // bind the lgr instance so that setLevel continues to take one argument
        lgr._children = lgr._children ? lgr._children : [];
    }
    // only add child if not already added
    if (parent && !parent._children.find(l => l === lgr)) {
        parent._children.push(lgr);
    }
    // this is the logger we want to return
    if (splitAmount.length === splitName.length) {
        return lgr;
    }
    // continue recursing.
    return get(name, index + 1, lgr);
}
