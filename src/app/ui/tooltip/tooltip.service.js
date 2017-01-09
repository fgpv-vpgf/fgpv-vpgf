(() => {

    /**
     * @module tooltipService
     * @memberof app.ui
     *
     * @description
     * The `tooltipService` service handles creating and positioning or maptips, anchor and hover ones.
     */
    angular
        .module('app.ui')
        .factory('tooltipService', tooltipService);

    function tooltipService($rootScope, $compile, $q, storageService, events) {

        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class Tooltip {
            /**
             *
             * Tooltip's origin point is generaly the position of the mouse cursor or clientX/Y of a mouse event.
             *
             * @function constructor
             * @param {Object} movementStrategy specifies how the tooltip moves on the screen
             * @param {String} content tooltips content
             * @param {Object} scope scope for the tooltip directive
             * @param {String} templateName [optional = 'hover'] the name of the tooltip outer template
             */
            constructor(movementStrategy, content, scope, templateName = 'hover') {
                this._movementStrategy = movementStrategy;
                this._templateName = templateName;

                this._scope = scope;
                this._scope.updateDimensions = this._updateDimensions.bind(this);

                this._node = $compile(`<rv-tooltip template="${this._templateName}">${content}</rv-tooltip>`)(scope);
                this._movementStrategy.register(this);

                this._width = this._height = 0;

                this._resetOffset();
            }

            /**
             * Reset the running offset of the tooltip node. Running offset is used by the movement strategy
             *
             * @function _resetOffset
             * @private
             */
            _resetOffset() {
                // reset running offset when manually repositioned
                this._runningOffset = { x: 0, y: 0 };
                this.offset(0, 0);
            }

            /**
             * Called by the tooltip directive when the size of the node changes. This will trigger repositioning of the tooltip so it holds its proper place relative to the tooltip origin point.
             *
             * @function _updateDimensions
             * @private
             */
            _updateDimensions(dimensions) {
                this._width = dimensions.width;
                this._height = dimensions.height;

                // reposition taking into the account new dimensions
                this.position(this._x, this._y, false);
            }

            /**
             * Tooltip's node.
             *
             * @property node
             * @return {Object} tolltip's node
             */
            get node() {
                return this._node;
            }

            /**
             * Offset the tooltip from its current/initial position
             *
             * @function offset
             * @param {Number} xOffset pixel offest on x
             * @param {Number} yOffset pixel offest on y
             */
            offset(xOffset, yOffset) {
                this._runningOffset.x += xOffset;
                this._runningOffset.y += yOffset;

                this._node.css('transform', `translate(${-this._runningOffset.x}px, ${-this._runningOffset.y}px)`);
            }

            /**
             * @function position
             * @param {Number} x x coordinate of the tooltip origin point
             * @param {Number} y y coordinate of the tooltip origin point
             * @param {Boolean} resetOffset [optional = true] resets the current tooltip offset used by the movement strategy
             */
            position(x = 0, y = 0, resetOffset = true) {

                this._x = x;
                this._y = y;

                this._node.css({
                    left: `${this._x - this._width / 2}px`,
                    top: `${this._y - this._height - 10}px`
                });

                if (resetOffset) {
                    this._resetOffset();
                }
            }

            /**
             * Removes tooltip from the DOM.
             *
             * @function destroy
             *
             */
            destroy() {
                this._movementStrategy.deRegister(this);
                this._node.remove();
            }
        }

        // movementStrategy
        class FollowStrategy {
            constructor () {}

            /**
             * Adds tooltip to the list of tooltips tracked by this strategy.
             *
             * @function register
             * @param {Object} item a tooltip object
             */
            register(item) {
                this._items.push(item);
            }

            /**
             * Removes tooltip from the list of tracked tooltips.
             *
             * @function deRegister
             * @param {Object} item a tooltip object
             */
            deRegister(item) {
                const index = this._items.indexOf(item);
                if (index > -1) {
                    this._items.splice(index, 1);
                }
            }
        }

        // movementStrategy
        class FollowMap extends FollowStrategy {
            /**
             * FollowMap strategy keeps tracked tooltips in place relative to the map. This should be used for anchor tooltips.
             *
             * @function constructor
             */
            constructor() {
                super();
                this._items = [];

                // TODO: need to track extent changes and zooms

                // tracks map pan
                $rootScope.$on(events.rvMapPan, (event, movementOffset) => {

                    this._items.forEach(item =>
                        item.offset(movementOffset.x, movementOffset.y));

                    console.log(movementOffset);
                });
            }

            /**
             * Adds tooltip to the list of tooltips tracked by this strategy.
             *
             * @function register
             * @param {Object} item a tooltip object
             */
            register(item) {
                super.register(item);
            }

            /**
             * Removes tooltip from the list of tracked tooltips.
             *
             * @function deRegister
             * @param {Object} item a tooltip object
             */
            deRegister(item) {
                super.deRegister(item);
            }
        }

        // movementStrategy
        class FollowMouse extends FollowStrategy {
            /**
             * FollowMap strategy keeps tracked tooltips in place relative to the mouse cursor over a specified target.
             *
             * @function constructor
             * @param {Object} target a DOM node over which mouse movements should be tracked
             */
            constructor(target) {
                super();
                this._items = [];
                this._target = target;

                this._previousPosition = null;

                this._mouseMoveHandler = event => {

                    if (this._previousPosition === null) {
                        this._previousPosition = { x: event.clientX, y: event.clientY };
                    }

                    this._items.forEach(item =>
                        item.offset(
                            this._previousPosition.x - event.clientX,
                            this._previousPosition.y - event.clientY));

                    this._previousPosition.x = event.clientX;
                    this._previousPosition.y = event.clientY;
                };
            }

            /**
             * Start tracking mouse movements.
             *
             * @function _start
             */
            _start() {
                this._target.on('mousemove', this._mouseMoveHandler);
            }

            /**
             * Stop tracking mouse movements.
             *
             * @function _stop
             */
            _stop() {
                this._target.off('mousemove', this._mouseMoveHandler);
                this._previousPosition = null;
            }

            /**
             * Adds tooltip to the list of tooltips tracked by this strategy.
             *
             * @function register
             * @param {Object} item a tooltip object
             */
            register(item) {
                super.register(item);

                // only track mouse movements if there is at least one item in the list
                if (this._items.length === 1) {
                    this._start();
                }
            }

            /**
             * Removes tooltip from the list of tracked tooltips.
             *
             * @function deRegister
             * @param {Object} item a tooltip object
             */
            deRegister(item) {
                super.deRegister(item);

                // stop tracking mouse movements if there is no tracked tooltips
                if (this._items.length === 0) {
                    this._stop();
                }
            }
        }
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const ref = {
            followMapStrategy: null,
            followMouseStrategy: null
        };

        const service = {
            addHoverTooltip
        };

        const deRegisterRVReady = $rootScope.$on(events.rvReady, init);

        return service;

        function init() {
            deRegisterRVReady();

            // create both tooltip movement strategies
            ref.followMapStrategy = new FollowMap();
            ref.followMouseStrategy = new FollowMouse(storageService.panels.shell);

            // test code, remove before deployment //
            const drink = angular.element('<div style="background: white; border: 1px solid black; position: absolute; top: 500px; left: 1000px; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">big white box</div>');
            storageService.panels.shell.append(drink);

            const ttcontent = `<div class="rv-tooltip-content">
                        <img src="http://lorempixel.com/24/24/technics/" style="width: 24px; height: 24px;" class="rv-tooltip-graphic"><span class="rv-tooltip-text">{{ self.name }}</span>
                    </div>`;

            const ttscope = $rootScope.$new();
            ttscope.self = {
                name: 'Amazing anchor tooltip!'
            };

            const tt = new Tooltip(ref.followMapStrategy, ttcontent, ttscope);
            storageService.panels.shell.append(tt.node);
            tt.position(600, 700);

            let hoverTooltip;

            drink.on('mouseover', event => {
                console.log(event);

                if (hoverTooltip) {
                    return;
                }

                const htcontent = `<div class="rv-tooltip-content">
                        <rv-svg class="rv-tooltip-graphic" src="self.svgcode"></rv-svg>
                        <span class="rv-tooltip-text">{{ self.name }}</span>
                    </div>`;

                const htself = {
                    name: 'Hover tooltip, equally as amazing!',
                    svgcode: RV.blah.svgcode
                };

                hoverTooltip = addHoverTooltip({ x: event.clientX, y: event.clientY }, htcontent, htself);
            });

            drink.on('mouseout', event => {
                console.log(event);

                if (event.relatedTarget === hoverTooltip.node[0]) {
                    return;
                }

                hoverTooltip.destroy();
                hoverTooltip = null;
            });
        }

        /**
         * @function addHoverTooltip
         * @param {Object} point tooltip origin point (x/y in pixels relative to the map node)
         * @param {String} content tooltip content
         * @param {Object} self a self object that will be available on the tooltip directive scope
         */
        function addHoverTooltip(point, content, self) {
            const tooltipScope = $rootScope.$new();
            tooltipScope.self = self;

            const tooltip = new Tooltip(ref.followMouseStrategy, content, tooltipScope);

            storageService.panels.shell.append(tooltip.node);

            tooltip.position(point.x, point.y);

            return tooltip;
        }
    }
})();
