/**
 * This file contains polyfills for features not supported by the polyfill.io service or are custom implementations for our use cases.
 * 
 * In general you should check that a feature is missing from the browser before polyfilling it. 
 */

var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

if (isIE11) {
    /**
     * A custom SVG serialization routine for IE11.
     * 
     * See: https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1272#issuecomment-255395614
     */
    function serializeSvgContent(e){for(var n="<"+e.nodeName,l=null,t=null,r=0;r<e.attributes.length;r++){var i=e.attributes[r],o=i.name||i.nodeName,a=(i.value||i.nodeValue).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");o===l&&a===t||(n+=" "+o+'="'+a+'"',l=o,t=a)}if(l=null,t=null,e.childNodes.length>0){for(n+=">",r=0;r<e.childNodes.length;r++){var d=e.childNodes[r];1===d.nodeType?n+=serializeSvgContent(d):3===d.nodeType&&(n+=d.nodeValue.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"))}n+="</"+e.nodeName+">"}else n+="/>";return n}function newSvg(e){var n=document.createElement("svg");if(!(e&&this instanceof SVG.Parent))return n.appendChild(e=document.createElement("svg")),this.writeDataToDom(),e.appendChild(this.node.cloneNode(!0)),serializeSvgContent(e).replace(/^<svg>/i,"").replace(/<\/svg>$/i,"");n.innerHTML="<svg>"+e.replace(/\n/,"").replace(/<(\w+)([^<]+?)\/>/g,"<$1$2></$1>")+"</svg>";for(var l=0,t=n.firstChild.childNodes.length;l<t;l++);return this.node.appendChild(n.firstChild.firstChild),this}Object.defineProperty(SVGElement.prototype,"outerHTML",{get:function(){return serializeSvgContent(this)},enumerable:!1,configurable:!0}),window.RV=window.RV?window.RV:{},window.RV._deferredPolyfills=window.RV._deferredPolyfills?window.RV._deferredPolyfills:[],window.RV._deferredPolyfills.push(function(){SVG.extend(SVG.Element,{svg:newSvg})});
}

// NodeList forEach support
window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=function(o,t){t=t||window;for(var i=0;i<this.length;i++)o.call(t,this[i],i,this)});

if(!window.TextEncoder) {
    window.TextEncoder = function (){}
    window.TextEncoder.prototype.encode=function(e){for(var o=[],t=e.length,r=0;r<t;){var n=e.codePointAt(r),c=0,f=0;for(n<=127?(c=0,f=0):n<=2047?(c=6,f=192):n<=65535?(c=12,f=224):n<=2097151&&(c=18,f=240),o.push(f|n>>c),c-=6;c>=0;)o.push(128|n>>c&63),c-=6;r+=n>=65536?2:1}return o};
}

if (!window.TextDecoder) {
    window.TextDecoder = function (){}
    window.TextDecoder.prototype.decode=function(e){for(var o="",t=0;t<e.length;){var r=e[t],n=0,c=0;if(r<=127?(n=0,c=255&r):r<=223?(n=1,c=31&r):r<=239?(n=2,c=15&r):r<=244&&(n=3,c=7&r),e.length-t-n>0)for(var f=0;f<n;)c=c<<6|63&(r=e[t+f+1]),f+=1;else c=65533,n=e.length-t;o+=String.fromCodePoint(c),t+=n+1}return o};
}

if(SVGElement.prototype.contains) {
    SVGElement.prototype.contains=function(e){if(!(0 in arguments))throw new TypeError("1 argument is required");do{if(this===e)return!0}while(e=e&&e.parentNode);return!1}
}

/**
 * Polyfill for "MouseEvent".
 * 
 * See: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent#Polyfill
 */
!function(e){try{return new t("test"),!1}catch(e){}var t=function(t,n){n=n||{bubbles:!1,cancelable:!1,clientX:0,clientY:0};var c=document.createEvent("MouseEvent");return c.initMouseEvent(t,n.bubbles,n.cancelable,e,0,0,0,n.clientX,n.clientY,!1,!1,!1,!1,0,null),c};t.prototype=Event.prototype,e.MouseEvent=t}(window);