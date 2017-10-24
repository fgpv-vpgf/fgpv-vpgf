/**
 * A `YX` instance is a geographic point in decial degrees.
 */
export default class YX {
    private _x: number;
    private _y: number;

    constructor(y: number, x: number) {
        this._y = y;
        this._x = x;
    }

    /**
     * Returns true iff both `x` and `y` properties of both instances are equal.
     *
     * @param otherYX - The other `YX` instance to compare to
     */
    equals(otherYX: YX): boolean {
        return this.x === otherYX.x && this.y === otherYX.y;
    }

    /**
     * Returns a string of the form `y,x` for the current values of x and y.
     *
     * @param precision - The amount of decimal places for rounding, default is 6.
     */
    urlValue(precision: number = 6): string {
        return `${this.y.toFixed(precision)},${this.x.toFixed(precision)}`;
    };

    /**
     * Returns a string of the form `y,x` for the current values of x and y, rounded to 6 decimal places.
     */
    toString(): string {
        return this.urlValue();
    }

    /**
     * Returns longitude in decimal degrees.
     */
    get x(): number { return this._x; }

    /**
     * Returns latitude in deciamal degrees.
     */
    get y(): number { return this._y; }
}