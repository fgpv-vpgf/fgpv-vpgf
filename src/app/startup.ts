const domNodes = $('[is=rv-map]');
const customAttrs = ['config', 'langs', 'service-endpoint', 'restore-bookmark', 'wait', 'keys', 'fullpage-app'];

const nodeList: Array<Node> = [];

// Adds support for document.createTouch (deprecated and dropped on chrome 68+) where the browser supports window.Touch.
// ESRI has a createTouch dependency which has caused pan & zoom to stop working on touch and pen events.
if (!document.createTouch && (<any>window).Touch) {
    document.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY) {
        return new (<any>window).Touch({
            target: target,
            identifier: identifier,
            pageX: pageX,
            pageY: pageY,
            screenX: screenX,
            screenY: screenY
        });
    };
}

// Google tag manager loading
// opt-in by setting ramp-gtm on any map html element.
let gtmEnabled = false;
domNodes.each((i, node) => {
    gtmEnabled = (node.getAttribute('ramp-gtm') !== null) || gtmEnabled;
});
if (gtmEnabled) {
    (<any>window).dataLayer = (<any>window).dataLayer ? (<any>window).dataLayer : [];
    const gtmScript = document.createElement('script');
    gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=sX_2blCxbksFO5zU3FzkJA&gtm_preview=env-10&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-KQCZGMF');`;
    $('head').append(gtmScript);
}

domNodes.each((i, node) => {
    let appId = node.getAttribute('id') || 'rv-app-' + i;

    customAttrs.filter(attrName => node.getAttribute(`data-rv-${attrName}`)).forEach(attrName => {
        const dataRvName = node.getAttribute(`data-rv-${attrName}`);
        if (dataRvName) {
            node.setAttribute(`rv-${attrName}`, dataRvName); // getAttribute returns a string so data-rv-fullscreen-app="false" will copy correctly
        }
        node.removeAttribute(`data-rv-${attrName}`);
    });

    node.setAttribute('id', appId);
    node.setAttribute('rv-trap-focus', appId);

    // basic touch device detection; if detected set rv-touch class so that touch mode is on by default
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        node.className += ' rv-touch';
    }

    nodeList.push(node);
});

export const nodes = nodeList;
