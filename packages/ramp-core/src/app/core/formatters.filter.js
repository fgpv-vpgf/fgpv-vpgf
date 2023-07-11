/* global linkifyStr, linkifyHtml */

import linkifyStr from 'linkifyjs/string';
import linkifyHtml from 'linkifyjs/html';
const moment = window.moment;
import marked from 'marked';

/**
 * @name autolink
 * @constant
 * @memberof app.common
 * @description
 *
 * The autolink filter using https://github.com/SoapBox/linkifyjs.
 */
angular
    .module('app.core')
    .filter('autolink', autolink)
    .filter('dateTimeZone', dateTimeZone)
    .filter('picture', picture)
    .filter('markdown', markdown);

function dateTimeZone() {
    const userTimeZone = moment.tz.guess();

    return dateTimeZone;

    /**
     * Formats a given date with the users current timezone
     *
     * @function dateTimeZone
     * @param {Number} esriDate epoch time to convert
     * @param {String} [format=YYYY-MM-D H:mm:ssA z] moment format string for output date/time
     * @return {String} data/time adjusted to users timezone
     */
    function dateTimeZone(esriDate, format = 'YYYY-MM-D H:mm:ssA z') {
        if (esriDate) {
            const time = moment.tz(esriDate, userTimeZone).format(format);
            // if esriDate is not valid, assume it follows 'format'
            return time !== 'Invalid date' ? time : moment.tz(esriDate, format, userTimeZone).format(format);
        } else {
            // if field is blank or null, don't show 'invalid date', just leave it blank.
            return '';
        }
    }
}

function autolink() {
    const defaultOptions = {
        className: 'rv-linkified',
        ignoreTags: ['script'],
        target: '_blank',
        validate: {
            url: (value) => /^https?:\/\//.test(value), // before converting to a link, ensure that the domain name begins with http:// or https://.
        },
    };

    return autolink;

    /**
     * Autolinks strings; doesn't not modify the original.
     *
     * @function autolink
     * @param {Array|String} items array of strings or a single string to autolink
     * @param {Object} options [optional = {}] linkifyjs options object; the only default changed is classname (rv-linkified) for consistency
     * @return {Array|String} array or string of autolinked strings
     */
    function autolink(items, options = {}) {
        // item must be a string
        const results = Array.isArray(items) ? items.map(process) : process(items);

        return results;

        /**
         * Autolink helper function.
         *
         * @function process
         * @private
         * @param {String} item string to autolink
         * @return {String} autolinked string
         */
        function process(item) {
            // check if we need to use linkify html or linkify string
            const html = /<(?=.*? .*?\/ ?>|br|hr|input|!--|wbr)[a-z]+.*?>|<([a-z]+).*?<\/\1>/; // https://regex101.com/r/cX0eP2/1
            const opts = angular.extend(defaultOptions, options);
            return html.test(item)
                ? linkifyHtml((item || '').toString(), opts)
                : linkifyStr((item || '').toString(), opts);
        }
    }
}

function picture() {
    return picture;

    /**
     * Picture filter replace a href by image tag or/and lightbox open on click.
     *
     * @function picture
     * @param {Array|String} items array of strings or a single string to picture
     * @return {Array|String} array or string of picture strings
     */
    function picture(items) {
        // item must be a string
        if (Array.isArray(items)) {
            items = items.map(stringify);
        } else {
            items = stringify(items);

            // for a single item, if it is not a representation of an image file return
            if (typeof items === 'string' && !isPicture(items)) {
                return items;
            }
        }

        items = items.toString().split(';');
        const results = Array.isArray(items) ? items.map(process) : process(items);

        return results.join('');

        /**
         * Checks if `str` can be converted to a string; if not, returns an empty string
         * @param {Object} str
         * @return {Object|String} returns the original object if it can be converted to a string; '' otherwise
         */
        function stringify(str) {
            if (typeof str === 'undefined' || str === null) {
                return '';
            }

            return str;
        }

        /**
         * Picture helper function.
         *
         * @function process
         * @private
         * @param {String} item string to set picture
         * @return {String} picture element
         */
        function process(item) {
            return isPicture(item) ? `<a class="rv-picture-lightbox" href="${item}"><img src="${item}"></img></a>` : item;
        }

        /**
         * Checks if item is a picture
         * @param {String} item string
         * @return {Boolean} returns whether item is an image file that should be converted into an <img> element.
         */
        function isPicture(item) {
            return typeof item !== 'string' || /(.*?)\.(jpe?g|png|gif|bmp)$/.test(item.trim());
        }
    }
}

function markdown($sce) {
    const defaultOptions = {
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false,
    };

    return markdown;

    /**
     * Converts markdown into html.
     *
     * @function autolink
     * @param {String} text a text string containing markdown
     * @param {Object} [userOptions={}] options to override defaults
     * @return {String} html representing the original markdown text
     */
    function markdown(text, userOptions = {}) {
        const options = angular.extend({}, defaultOptions, userOptions);
        let markdownHtml = marked(text, options);

        // if sanitized is set to false, any html included with the markup is added as is
        if (!options.sanitize) {
            markdownHtml = $sce.trustAsHtml(markdownHtml);
        }

        return markdownHtml;
    }
}
