const templateUrl = require('./crosshairs.html');

angular.module('app.ui').directive('rvCrosshairs', rvCrosshairs);

/**
 * `rvCrosshairs` directive body. Displays the keyboard nav crossharis on the map.
 *
 * @return {object} directive body
 */
function rvCrosshairs($rootElement, events) {
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
        const [targetElmWidth, targetElmHeight] = [targetElement.outerWidth(), targetElement.outerHeight()];

        const jQwindow = $(window);

        let hoverElement;

        events.$on(events.rvExtentChange, (_, d) => {
            // if not in keyboard mode, do nothing
            if (!$rootElement.hasClass('rv-keyboard')) {
                return;
            }

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

            // TODO: if the tooltip is opened by crosshairs and the user moves the mouse cursor over the map, the tooltip will move and stay with the mouse cursor until the extent changes or the user hovers over a different feature
            // somehow detect such tooltip's desertion and hide it
        });
    }
}
