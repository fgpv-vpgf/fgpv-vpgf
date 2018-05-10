/**
 * A copy of https://github.com/briancherne/jquery-hoverIntent with minor changes to keep our linter happy. The original library is not ES6 module loader friendly.
 * 
 * Attempts to determine the user's intent... like a crystal ball, only with mouse movement! It is similar to jQuery's hover method. 
 * However, instead of calling the handlerIn function immediately, hoverIntent waits until the user's mouse slows down enough before making the call.
 * 
 * Not to be confused with our intention/extension system, hence the name fancyHover.
 */

const _cfg = {
    interval: 100,
    sensitivity: 6,
    timeout: 0
};

// counter used to generate an ID for each instance
let INSTANCE_COUNT = 0;

// current X and Y position of mouse, updated during mousemove tracking (shared across instances)
let cX;
let cY;

// saves the current pointer position coordinates based on the given mousemove event
const track = function(ev) {
    cX = ev.pageX;
    cY = ev.pageY;
};

// compares current and previous mouse positions
const compare = function(ev,$el,s,cfg) {
    // compare mouse positions to see if pointer has slowed enough to trigger `over` function
    if ( Math.sqrt( (s.pX-cX)*(s.pX-cX) + (s.pY-cY)*(s.pY-cY) ) < cfg.sensitivity ) {
        $el.off(s.event,track);
        delete s.timeoutId;
        // set hoverIntent state as active for this element (permits `out` handler to trigger)
        s.isActive = true;
        // overwrite old mouseenter event coordinates with most recent pointer position
        ev.pageX = cX; ev.pageY = cY;
        // clear coordinate data from state object
        delete s.pX; delete s.pY;
        return cfg.over.apply($el[0],[ev]);
    } else {
        // set previous coordinates for next comparison
        s.pX = cX; s.pY = cY;
        // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
        s.timeoutId = setTimeout( function(){compare(ev, $el, s, cfg);} , cfg.interval );
    }
};

// triggers given `out` function at configured `timeout` after a mouseleave and clears state
const delay = function(ev,$el,s,out) {
    delete $el.data('hoverIntent')[s.id];
    return out.apply($el[0],[ev]);
};

$.fn.hoverIntent = function(handlerIn,handlerOut,selector) {
    // instance ID, used as a key to store and retrieve state information on an element
    const instanceId = INSTANCE_COUNT++;

    // extend the default configuration and parse parameters
    let cfg = $.extend({}, _cfg);
    if ( $.isPlainObject(handlerIn) ) {
        cfg = $.extend(cfg, handlerIn);
        if ( !$.isFunction(cfg.out) ) {
            cfg.out = cfg.over;
        }
    } else if ( $.isFunction(handlerOut) ) {
        cfg = $.extend(cfg, { over: handlerIn, out: handlerOut, selector: selector } );
    } else {
        cfg = $.extend(cfg, { over: handlerIn, out: handlerIn, selector: handlerOut } );
    }

    // A private function for handling mouse 'hovering'
    const handleHover = function(e) {
        // cloned event to pass to handlers (copy required for event object to be passed in IE)
        const ev = $.extend({},e);

        // the current target of the mouse event, wrapped in a jQuery object
        const $el = $(this);

        // read hoverIntent data from element (or initialize if not present)
        let hoverIntentData = $el.data('hoverIntent');
        if (!hoverIntentData) { $el.data('hoverIntent', (hoverIntentData = {})); }

        // read per-instance state from element (or initialize if not present)
        let state = hoverIntentData[instanceId];
        if (!state) { hoverIntentData[instanceId] = state = { id: instanceId }; }

        // state properties:
        // id = instance ID, used to clean up data
        // timeoutId = timeout ID, reused for tracking mouse position and delaying "out" handler
        // isActive = plugin state, true after `over` is called just until `out` is called
        // pX, pY = previously-measured pointer coordinates, updated at each polling interval
        // event = string representing the namespaced event used for mouse tracking

        // clear any existing timeout
        if (state.timeoutId) { state.timeoutId = clearTimeout(state.timeoutId); }

        // namespaced event used to register and unregister mousemove tracking
        const mousemove = state.event = 'mousemove.hoverIntent.hoverIntent'+instanceId;

        // handle the event, based on its type
        if (e.type === 'mouseenter') {
            // do nothing if already active
            if (state.isActive) { return; }
            // set "previous" X and Y position based on initial entry point
            state.pX = ev.pageX; state.pY = ev.pageY;
            // update "current" X and Y position based on mousemove
            $el.off(mousemove,track).on(mousemove,track);
            // start polling interval (self-calling timeout) to compare mouse coordinates over time
            state.timeoutId = setTimeout( function(){compare(ev,$el,state,cfg);} , cfg.interval );
        } else { // "mouseleave"
            // do nothing if not already active
            if (!state.isActive) { return; }
            // unbind expensive mousemove event
            $el.off(mousemove,track);
            // if hoverIntent state is true, then call the mouseOut function after the specified delay
            state.timeoutId = setTimeout( function(){delay(ev,$el,state,cfg.out);} , cfg.timeout );
        }
    };

    // listen for mouseenter and mouseleave
    return this.on({'mouseenter.hoverIntent':handleHover,'mouseleave.hoverIntent':handleHover}, cfg.selector);
}