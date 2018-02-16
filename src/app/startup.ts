const RV = (<any>window).RV = (<any>window).RV ? (<any>window).RV : {};

const domNodes = $('[is=rv-map]');
const customAttrs = ['config', 'langs', 'service-endpoint', 'restore-bookmark', 'wait', 'keys', 'fullpage-app'];

const nIdList: Array<string> = RV._nodeIdList = [];
const nodeList: Array<Node> = [];

domNodes.each((i, node) => {
    let appId = node.getAttribute('id') || 'rv-app-' + i;

    customAttrs
        .filter(attrName => node.getAttribute(`data-rv-${attrName}`))
        .forEach(attrName => {
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