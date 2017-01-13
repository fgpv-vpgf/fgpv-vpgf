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
        /**
         * Tooltip's origin point is generally the position of the initial mouse cursor or clientX/Y of a mouse event when the tooltip was first created.
         * Movement and Collision strategies are defined in the TooltipService on initialization and then passed to Tooltip instances.
         * It's responsibility of the code creating a Tooltip to add it to the proper DOM node (this node is considered to be Tooltip's parent container).
         * @class Tooltip
         */
        class Tooltip {
            /**
             * Creates an Tooltip instance by compiling a Tooltip directive along with provided content, scope, and templateName.
             *
             * @function constructor
             * @param {Object} movementStrategy specifies how the tooltip moves on the screen;
             * @param {Object} collisionStrategy specified how the tooltip reacts to collisions;
             * @param {String} content tooltips content that will be transcluded by the tooltip directive; should be valid HTML
             * @param {Object} scope scope for the tooltip directive; this scope is also available on the content template
             * @param {String} templateName [optional = 'hover'] the name of the tooltip outer template
             */
            constructor(movementStrategy, collisionStrategy, content, scope, templateName = 'hover') {
                this._movementStrategy = movementStrategy;
                this._collisionStrategy = collisionStrategy;
                this._templateName = templateName;

                this._scope = scope;
                this._scope.updateDimensions = this._updateDimensions.bind(this);

                this._node = $compile(`<rv-tooltip template="${this._templateName}">${content}</rv-tooltip>`)(scope);
                this._movementStrategy.register(this);

                this._mouseGap = 10;

                this._originPoint = { x: 0, y: 0 };
                this._collisionOffset = { x: 0, y: 0 };
                this._dimensions = { width: 0, height: 0 };

                this._resetOffset();
            }

            /**
             * Reset the running offset of the tooltip node. Running offset is used by the movement strategy.
             *
             * @function _resetOffset
             * @private
             */
            _resetOffset() {
                this._runningOffset = { x: 0, y: 0 };
            }

            /**
             * Called by the tooltip directive when the size of the node changes. This will trigger repositioning of the tooltip so it holds its proper place relative to the tooltip origin point.
             *
             * @function _updateDimensions
             * @private
             */
            _updateDimensions(dimensions) {
                this._dimensions.width = dimensions.width;
                this._dimensions.height = dimensions.height;

                // reposition taking into the account new dimensions
                this.position(this._originPoint.x, this._originPoint.y, false);
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
             * Returns origin point (mouse point) of the tooltip relative to its parent container.
             *
             * @function getOriginPoint
             * @param {Boolean} includeRunningOffset if set, returns tooltip origin point including the running offset
             * @return {Object} object in the form of { x: <Number>, y: <Number> } representing the tooltip's origin point
             */
            getOriginPoint(includeRunningOffset = true) {
                const result = angular.copy(this._originPoint);

                if (includeRunningOffset) {
                    result.x -= this._runningOffset.x;
                    result.y -= this._runningOffset.y;
                }

                return result;
            }

            /**
             * Returns bounds of the tooltip node relative to its parent container.
             *
             * @function getBounds
             * @param {Boolean} includeRunningOffset if set, returns tooltip bounds including the running offset
             */
            getBounds(includeRunningOffset = true) {
                const result = {
                    width: this._dimensions.width,
                    height: this._dimensions.height,
                    left: this._originPoint.x - this._dimensions.width / 2,
                    right: this._originPoint.x + this._dimensions.width / 2,
                    top: this._originPoint.y - this._dimensions.height - this._mouseGap,
                    bottom: this._originPoint.y - this._mouseGap
                };

                if (includeRunningOffset) {
                    result.left -= this._runningOffset.x;
                    result.right -= this._runningOffset.x;
                    result.top -= this._runningOffset.y;
                    result.bottom -= this._runningOffset.y;
                }

                return result;
            }

            /**
             * Offset the tooltip from its current/initial position. This is typically called by the movement strategy, although the code holding a tooltip reference may call this as well.
             *
             * @function offset
             * @param {Number} xOffset pixel offest on x
             * @param {Number} yOffset pixel offest on y
             */
            offset(xOffset, yOffset) {
                this._runningOffset.x += xOffset;
                this._runningOffset.y += yOffset;

                const collisionOffset = this._collisionStrategy.checkCollisions(this);

                // flip the tooltip when it hits the ceiling
                if (collisionOffset.y > 0) {
                    collisionOffset.y = this._dimensions.height + this._mouseGap * 2;
                }

                this._node.css('transform', `translate(
                    ${-this._runningOffset.x + collisionOffset.x}px,
                    ${-this._runningOffset.y + collisionOffset.y}px)`);

            }

            /**
             * Positions the tooltips at specified coordinates relative to its parent container. This will reset any relative offset of the tooltip.
             * This function should be called when initially placing a Tooltip or to reposition it to a different target. All other tooltip movements are handled by its Movement strategy through the `offset` function.
             *
             * @function position
             * @param {Number} x x coordinate of the tooltip origin point
             * @param {Number} y y coordinate of the tooltip origin point
             * @param {Boolean} resetOffset [optional = true] resets the current tooltip offset used by the movement strategy
             */
            position(x = 0, y = 0, resetOffset = true) {
                this._originPoint.x = x;
                this._originPoint.y = y;

                // get bounds with the running offset
                const bounds = this.getBounds(false);

                this._node.css({
                    left: `${ bounds.left }px`,
                    top: `${ bounds.top }px`
                });

                if (resetOffset) {
                    this._resetOffset();
                }

                // apply the current running offset and check for collisions
                this.offset(0, 0);
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

        /**
         * This is a Collision strategy for Tooltips to keep them inside a specified target container. If a Tooltip is positioned so a part of it intersects the boundary of the target container, the Tooltip is offset to be fully contained.
         *
         * @class ContainInside
         */
        class ContainInside {
            /**
             * Creates an instance of ContainInside Collision strategy.
             * @param {Object} targetContainer a target container the tooltip should be kept inside of (at the moment this should be tooltips parent container)
             */
            constructor (targetContainer) {
                this._targetContainer = targetContainer;
            }

            /**
             * Checks if there is any collision between the supplied item and the target container. Returns a vector to prevent collision.
             *
             * @function checkCollisions
             * @param {Object} item a tooltip object
             * @return {Object} { x: <Number>, y: <Number> } displacement vector to avoid collision between the item and the target container
             */
            checkCollisions(item) {
                // need to get bounds every time; scrolling the page or resizing the browser will change the bound
                const targetContainerBounds = this._targetContainer[0].getBoundingClientRect();
                const itemBounds = item.getBounds();

                const collisionOffset = {
                    x: Math.min(0, targetContainerBounds.width - itemBounds.right) ||
                        Math.max(0, 0 - itemBounds.left),
                    y: Math.min(0, targetContainerBounds.height - itemBounds.bottom) ||
                        Math.max(0, 0 - itemBounds.top)
                };

                // tooltip direction
                // const direction = 'top';

                return collisionOffset;
            }
        }

        /**
         * This is a base Tooltip movement strategy.
         *
         * @class TooltipStrategy
         */
        class TooltipStrategy {
            /**
             * Creates an TooltipStrategy instance.
             * @function constructor
             */
            constructor () {
                this._items = [];
            }

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

        /**
         * FollowMap strategy keeps tracked tooltips in place relative to the map. This should be used for anchor tooltips.
         *
         * @class FollowMap
         */
        class FollowMap extends TooltipStrategy {
            /**
             * Creates an FollowMap instance.
             *
             * @function constructor
             */
            constructor() {
                super();
                // TODO: need to track extent changes and zooms

                // tracks map pan
                $rootScope.$on(events.rvMapPan, (event, movementOffset) => {

                    this._items.forEach(item =>
                        item.offset(movementOffset.x, movementOffset.y));

                    console.log(movementOffset);
                });
            }
        }

        /**
         * FollowMap strategy keeps tracked tooltips in place relative to the mouse cursor over a specified target.
         *
         * @class FollowMouse
         */
        class FollowMouse extends TooltipStrategy {
            /**
             * Creates an FollowMap FollowMouse.
             *
             * @function constructor
             * @param {Object} targetContainer a DOM node over which mouse movements should be tracked
             */
            constructor (targetContainer) {
                super();

                this._targetContainer = targetContainer;
            }

            /**
             * Start tracking mouse movements.
             *
             * @function _start
             */
            _start() {
                this._targetContainer.on('mousemove', this._mouseMoveHandler.bind(this));
            }

            /**
             * Stop tracking mouse movements.
             *
             * @function _stop
             */
            _stop() {
                this._targetContainer.off('mousemove', this._mouseMoveHandler.bind(this));
                this._previousPosition = null;
            }

            /**
             * Calculates by how much a tooltip should be offset based on the mouse movement, tooltip original position, and its running offset.
             *
             * @function _mouseMoveHandler
             * @private
             * @param {Object} event mousemove event
             */
            _mouseMoveHandler(event) {
                const targetContainerBounds = this._targetContainer[0].getBoundingClientRect();

                this._items.forEach(item => {
                    const itemOriginPoint = item.getOriginPoint();

                    item.offset(
                        itemOriginPoint.x - (event.clientX - targetContainerBounds.left),
                        itemOriginPoint.y - (event.clientY - targetContainerBounds.top));
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
            hoverTooltip: null, // there can only be one hoverTooltip
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
            ref.containInsideStrategy = new ContainInside(storageService.panels.shell);
        }

        /**
         * @function addHoverTooltip
         * @param {Object} point tooltip origin point (x/y in pixels relative to the map node)
         * @param {String} content tooltips content that will be transcluded by the tooltip directive; should be valid HTML
         * @param {Object} self a self object that will be available on the tooltip directive scope
         * @return {Object} a Tooltip instance
         */
        function addHoverTooltip(point, content, self) {
            const tooltipScope = $rootScope.$new();
            tooltipScope.self = self;

            // destroy the previous hover tooltip since there shouldn't be more than one at the same time
            if (ref.hoverTooltip) {
                ref.hoverTooltip.destroy();
            }

            ref.hoverTooltip = new Tooltip(ref.followMouseStrategy, ref.containInsideStrategy, content, tooltipScope);
            storageService.panels.shell.append(ref.hoverTooltip.node);

            ref.hoverTooltip.position(point.x, point.y);

            return ref.hoverTooltip;
        }
    }
})();
