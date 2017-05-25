// jscs doesn't like enhanced object notation
// jscs:disable requireSpacesInAnonymousFunctionExpression
class ExportSize {
    /**
     * @param {String} name option name
     * @param {Number} widthHeightRatio width to height ratio for the export size option
     * @param {Number} height [optional] size's height
     */
    constructor(name, widthHeightRatio, height = null) {
        this.widthHeightRatio = widthHeightRatio;
        this._name = name;

        if (angular.isNumber(height)) {
            this.height = height;
        } else {
            // set both to null so the dimensions returns an empty string
            this._height = this._width = height;
        }
    }

    get name() {
        return this._name;
    }

    set widthHeightRatio(value) {
        // ration cannot be 0
        this._widthHeightRatio = value !== 0 ? value : 1;

        // update values
        this.height = this._height;
    }

    get widthHeightRatio() {
        return this._widthHeightRatio;
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;

        if (angular.isNumber(value)) {
            this._height = Math.round(this._width / this._widthHeightRatio);
        } else {
            this._height = null;
        }

    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;

        if (angular.isNumber(value)) {
            this._width = Math.round(this._height * this._widthHeightRatio);
        } else {
            this._width = null;
        }
    }

    get dimensions() {
        // returns a text description of the size in the form of `(width x height)`
        if (!this.isValid()) {
            return '';
        } else {
            return `(${this._width} x ${this._height})`;
        }
    }

    /**
     * Checks if this export size is valid (dimensions are defined)
     *
     * @function isValid
     * @return {Boolean} true if width and height are defined; false otherwise
     */
    isValid() {
        return this._height !== null && this._width !== null;
    }
}
// jscs:enable requireSpacesInAnonymousFunctionExpression

/**
 * @module ExportSize
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `ExportSize` returns `ExportSize` class used to populate the size selector in the export map dialog.
 *
 */
angular
    .module('app.ui')
    .factory('ExportSize', () => ExportSize);
