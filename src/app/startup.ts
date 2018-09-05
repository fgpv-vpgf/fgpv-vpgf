const RV = ((<any>window).RV = (<any>window).RV ? (<any>window).RV : {});

const domNodes = $('[is=rv-map]');
const customAttrs = ['config', 'langs', 'service-endpoint', 'restore-bookmark', 'wait', 'keys', 'fullpage-app'];

const nIdList: Array<string> = (RV._nodeIdList = []);
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
(<any>window).dataLayer = (<any>window).dataLayer ? (<any>window).dataLayer : [];
const gtmScript = document.createElement('script');
gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=sX_2blCxbksFO5zU3FzkJA&gtm_preview=env-10&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KQCZGMF');`;
$('head').append(gtmScript);

// #region Polyfills

// Promise.finally polyfill as it's not supported by Safari 11 and some other browser versions
// https://github.com/tc39/proposal-promise-finally/blob/master/polyfill.js
if (typeof Promise !== 'function') {
    throw new TypeError('A global Promise is required');
}

if (typeof (<any>Promise.prototype).finally !== 'function') {
    var speciesConstructor = function(O: any, defaultConstructor: any) {
        if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
            throw new TypeError('Assertion failed: Type(O) is not Object');
        }
        var C = O.constructor;
        if (typeof C === 'undefined') {
            return defaultConstructor;
        }
        if (!C || (typeof C !== 'object' && typeof C !== 'function')) {
            throw new TypeError('O.constructor is not an Object');
        }
        var S = typeof Symbol === 'function' && typeof Symbol.species === 'symbol' ? C[Symbol.species] : undefined;
        if (S == null) {
            return defaultConstructor;
        }
        if (typeof S === 'function' && S.prototype) {
            return S;
        }
        throw new TypeError('no constructor found');
    };

    var shim = {
        finally(onFinally: any) {
            var promise = this;
            if (typeof promise !== 'object' || promise === null) {
                throw new TypeError('"this" value is not an Object');
            }
            var C = speciesConstructor(promise, Promise); // throws if SpeciesConstructor throws
            if (typeof onFinally !== 'function') {
                return Promise.prototype.then.call(promise, onFinally, onFinally);
            }
            return Promise.prototype.then.call(
                promise,
                (x: any) => new C((resolve: any) => resolve(onFinally())).then(() => x),
                (e: any) =>
                    new C((resolve: any) => resolve(onFinally())).then(() => {
                        throw e;
                    })
            );
        }
    };
    Object.defineProperty(Promise.prototype, 'finally', { configurable: true, writable: true, value: shim.finally });
}

// #endregion

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
    nIdList.push(appId);
});

export const nodes = nodeList;
