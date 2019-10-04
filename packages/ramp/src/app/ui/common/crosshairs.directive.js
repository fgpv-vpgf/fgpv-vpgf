const templateUrl = require('./crosshairs.html');

angular.module('app.ui').directive('rvCrosshairs', rvCrosshairs);

/**
 * `rvCrosshairs` directive body. Displays the keyboard nav crossharis on the map.
 *
 * @param {object} $rootElement app root element
 * @param {object} events events service
 * @param {object} tooltipService tooltip service
 * @return {object} directive body
 */
function rvCrosshairs($rootElement, events, tooltipService) {
    const directive = {
        restrict: 'E',
        link,
        templateUrl,
        scope: {},
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope, element) {
        const self = scope.self;

        const targetElement = element.find('.rv-target');

        // the size of the crosshairs element will be 24x24 until its svg image is rendered
        // deffer getting the crosshairs dimensions
        let targetElmWidth;
        let targetElmHeight;

        const jQwindow = $(window);

        // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
        let isCrosshairsActive = false;
        let hoverElement;

        // if the tooltip is opened by crosshairs and the user moves the mouse cursor over the map, the tooltip will move and stay with the mouse cursor until the extent changes or the user hovers over a different feature
        // this removes the tooltip when the mouse movements are detected in the keyboard-mode
        // rvMouseMove `does not fire for movement over panels or other map controls`; have to use listen to direct events
        $rootElement.on('mousemove', () => {
            // do nothing if the keyboard mode if not enabled or the last action was already compeleted using a mouse
            if (!isCrosshairsActive || !$rootElement.hasClass('rv-keyboard')) {
                return;
            }
            isCrosshairsActive = false;
            tooltipService.removeHoverTooltip();
        });

        events.$on(events.rvExtentChange, (_, d) => {
            // if not in keyboard mode, do nothing
            if (!$rootElement.hasClass('rv-keyboard')) {
                return;
            }

            // get the crosshairs dimensions if not yet defined
            if (!targetElmWidth) {
                [targetElmWidth, targetElmHeight] = [targetElement.outerWidth(), targetElement.outerHeight()];
            }

            isCrosshairsActive = true;

            // get position of the crosshairs center point relative to the visible viewport
            let { left: x, top: y } = targetElement.offset();
            x += -jQwindow.scrollLeft() + targetElmWidth / 2;
            y += -jQwindow.scrollTop() + targetElmHeight / 2;

            // get an html element underneath the crosshairs
            const newHoverElement = document.elementFromPoint(x, y);

            // if the element is the same as from the previous execution, do nothing
            if (hoverElement === newHoverElement) {
                return;
            }

            // hide tooltips for the previous hover element if defined by firing a `mouseout` event
            if (hoverElement) {
                const outEvt = new MouseEvent('mouseout', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                hoverElement.dispatchEvent(outEvt);
            }

            // if the new hover element is not defined for some reason, do nothing
            if (!newHoverElement) {
                return;
            }

            hoverElement = newHoverElement;

            // fire a `mosueover` event for the new hover element to trigger tooltip creation
            const overEvt = new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y - 60 // offset the tooltip above the crosshairs
            });
            hoverElement.dispatchEvent(overEvt);
        });
    }
}
