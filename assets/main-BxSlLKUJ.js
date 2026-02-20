var Xt=Object.create;var it=Object.defineProperty;var Yt=Object.getOwnPropertyDescriptor;var vt=(r,t)=>(t=Symbol[r])?t:Symbol.for("Symbol."+r),T=r=>{throw TypeError(r)};var yt=(r,t,e)=>t in r?it(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var $t=(r,t)=>it(r,"name",{value:t,configurable:!0});var z=r=>[,,,Xt(r?.[vt("metadata")]??null)],_t=["class","method","getter","setter","accessor","field","value","get","set"],R=r=>r!==void 0&&typeof r!="function"?T("Function expected"):r,te=(r,t,e,s,i)=>({kind:_t[r],name:t,metadata:s,addInitializer:o=>e._?T("Already initialized"):i.push(R(o||null))}),ee=(r,t)=>yt(t,vt("metadata"),r[3]),f=(r,t,e,s)=>{for(var i=0,o=r[t>>1],n=o&&o.length;i<n;i++)t&1?o[i].call(e):s=o[i].call(e,s);return s},_=(r,t,e,s,i,o)=>{var n,c,l,h,d,a=t&7,$=!!(t&8),p=!!(t&16),A=a>3?r.length+1:a?$?1:2:0,ut=_t[a+5],ft=a>3&&(r[A-1]=[]),Qt=r[A]||(r[A]=[]),y=a&&(!p&&!$&&(i=i.prototype),a<5&&(a>3||!p)&&Yt(a<4?i:{get[e](){return mt(this,o)},set[e](m){return gt(this,o,m)}},e));a?p&&a<4&&$t(o,(a>2?"set ":a>1?"get ":"")+e):$t(i,e);for(var et=s.length-1;et>=0;et--)h=te(a,e,l={},r[3],Qt),a&&(h.static=$,h.private=p,d=h.access={has:p?m=>se(i,m):m=>e in m},a^3&&(d.get=p?m=>(a^1?mt:ie)(m,i,a^4?o:y.get):m=>m[e]),a>2&&(d.set=p?(m,st)=>gt(m,i,st,a^4?o:y.set):(m,st)=>m[e]=st)),c=(0,s[et])(a?a<4?p?o:y[ut]:a>4?void 0:{get:y.get,set:y.set}:i,h),l._=1,a^4||c===void 0?R(c)&&(a>4?ft.unshift(c):a?p?o=c:y[ut]=c:i=c):typeof c!="object"||c===null?T("Object expected"):(R(n=c.get)&&(y.get=n),R(n=c.set)&&(y.set=n),R(n=c.init)&&ft.unshift(n));return a||ee(r,i),y&&it(i,e,y),p?a^4?o:y:i},g=(r,t,e)=>yt(r,typeof t!="symbol"?t+"":t,e),rt=(r,t,e)=>t.has(r)||T("Cannot "+e),se=(r,t)=>Object(t)!==t?T('Cannot use the "in" operator on this value'):r.has(t),mt=(r,t,e)=>(rt(r,t,"read from private field"),e?e.call(r):t.get(r));var gt=(r,t,e,s)=>(rt(r,t,"write to private field"),s?s.call(r,e):t.set(r,e),e),ie=(r,t,e)=>(rt(r,t,"access private method"),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();const Z=globalThis,at=Z.ShadowRoot&&(Z.ShadyCSS===void 0||Z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ct=Symbol(),bt=new WeakMap;let Kt=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==ct)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(at&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=bt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&bt.set(e,t))}return t}toString(){return this.cssText}};const re=r=>new Kt(typeof r=="string"?r:r+"",void 0,ct),G=(r,...t)=>{const e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new Kt(e,r,ct)},oe=(r,t)=>{if(at)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),i=Z.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},At=at?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return re(e)})(r):r;const{is:ne,defineProperty:ae,getOwnPropertyDescriptor:ce,getOwnPropertyNames:le,getOwnPropertySymbols:he,getPrototypeOf:de}=Object,Q=globalThis,xt=Q.trustedTypes,pe=xt?xt.emptyScript:"",ue=Q.reactiveElementPolyfillSupport,B=(r,t)=>r,F={toAttribute(r,t){switch(t){case Boolean:r=r?pe:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},lt=(r,t)=>!ne(r,t),Et={attribute:!0,type:String,converter:F,reflect:!1,useDefault:!1,hasChanged:lt};Symbol.metadata??=Symbol("metadata"),Q.litPropertyMetadata??=new WeakMap;let H=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Et){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&ae(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:o}=ce(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:i,set(n){const c=i?.call(this);o?.call(this,n),this.requestUpdate(t,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Et}static _$Ei(){if(this.hasOwnProperty(B("elementProperties")))return;const t=de(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(B("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(B("properties"))){const e=this.properties,s=[...le(e),...he(e)];for(const i of s)this.createProperty(i,e[i])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)e.unshift(At(i))}else t!==void 0&&e.push(At(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return oe(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const o=(s.converter?.toAttribute!==void 0?s.converter:F).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const o=s.getPropertyOptions(i),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:F;this._$Em=i;const c=n.fromAttribute(e,o.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){if(t!==void 0){const n=this.constructor;if(i===!1&&(o=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??lt)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,o]of s){const{wrapped:n}=o,c=this[i];n!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,o,c)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[B("elementProperties")]=new Map,H[B("finalized")]=new Map,ue?.({ReactiveElement:H}),(Q.reactiveElementVersions??=[]).push("2.1.2");const ht=globalThis,wt=r=>r,J=ht.trustedTypes,St=J?J.createPolicy("lit-html",{createHTML:r=>r}):void 0,Zt="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,Ft="?"+x,fe=`<${Ft}>`,O=document,q=()=>O.createComment(""),V=r=>r===null||typeof r!="object"&&typeof r!="function",dt=Array.isArray,$e=r=>dt(r)||typeof r?.[Symbol.iterator]=="function",ot=`[ 	
\f\r]`,L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Pt=/-->/g,Ot=/>/g,w=RegExp(`>|${ot}(?:([^\\s"'>=/]+)(${ot}*=${ot}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ct=/'/g,Ut=/"/g,Jt=/^(?:script|style|textarea|title)$/i,me=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),b=me(1),M=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Nt=new WeakMap,P=O.createTreeWalker(O,129);function Gt(r,t){if(!dt(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return St!==void 0?St.createHTML(t):t}const ge=(r,t)=>{const e=r.length-1,s=[];let i,o=t===2?"<svg>":t===3?"<math>":"",n=L;for(let c=0;c<e;c++){const l=r[c];let h,d,a=-1,$=0;for(;$<l.length&&(n.lastIndex=$,d=n.exec(l),d!==null);)$=n.lastIndex,n===L?d[1]==="!--"?n=Pt:d[1]!==void 0?n=Ot:d[2]!==void 0?(Jt.test(d[2])&&(i=RegExp("</"+d[2],"g")),n=w):d[3]!==void 0&&(n=w):n===w?d[0]===">"?(n=i??L,a=-1):d[1]===void 0?a=-2:(a=n.lastIndex-d[2].length,h=d[1],n=d[3]===void 0?w:d[3]==='"'?Ut:Ct):n===Ut||n===Ct?n=w:n===Pt||n===Ot?n=L:(n=w,i=void 0);const p=n===w&&r[c+1].startsWith("/>")?" ":"";o+=n===L?l+fe:a>=0?(s.push(h),l.slice(0,a)+Zt+l.slice(a)+x+p):l+x+(a===-2?c:p)}return[Gt(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class W{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0;const c=t.length-1,l=this.parts,[h,d]=ge(t,e);if(this.el=W.createElement(h,s),P.currentNode=this.el.content,e===2||e===3){const a=this.el.content.firstChild;a.replaceWith(...a.childNodes)}for(;(i=P.nextNode())!==null&&l.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(const a of i.getAttributeNames())if(a.endsWith(Zt)){const $=d[n++],p=i.getAttribute(a).split(x),A=/([.?@])?(.*)/.exec($);l.push({type:1,index:o,name:A[2],strings:p,ctor:A[1]==="."?ye:A[1]==="?"?_e:A[1]==="@"?be:X}),i.removeAttribute(a)}else a.startsWith(x)&&(l.push({type:6,index:o}),i.removeAttribute(a));if(Jt.test(i.tagName)){const a=i.textContent.split(x),$=a.length-1;if($>0){i.textContent=J?J.emptyScript:"";for(let p=0;p<$;p++)i.append(a[p],q()),P.nextNode(),l.push({type:2,index:++o});i.append(a[$],q())}}}else if(i.nodeType===8)if(i.data===Ft)l.push({type:2,index:o});else{let a=-1;for(;(a=i.data.indexOf(x,a+1))!==-1;)l.push({type:7,index:o}),a+=x.length-1}o++}}static createElement(t,e){const s=O.createElement("template");return s.innerHTML=t,s}}function k(r,t,e=r,s){if(t===M)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl;const o=V(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=k(r,i._$AS(r,t.values),i,s)),t}class ve{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??O).importNode(e,!0);P.currentNode=i;let o=P.nextNode(),n=0,c=0,l=s[0];for(;l!==void 0;){if(n===l.index){let h;l.type===2?h=new K(o,o.nextSibling,this,t):l.type===1?h=new l.ctor(o,l.name,l.strings,this,t):l.type===6&&(h=new Ae(o,this,t)),this._$AV.push(h),l=s[++c]}n!==l?.index&&(o=P.nextNode(),n++)}return P.currentNode=O,i}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class K{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=k(this,t,e),V(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==M&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):$e(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==u&&V(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=W.createElement(Gt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const o=new ve(i,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=Nt.get(t.strings);return e===void 0&&Nt.set(t.strings,e=new W(t)),e}k(t){dt(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const o of t)i===e.length?e.push(s=new K(this.O(q()),this.O(q()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const s=wt(t).nextSibling;wt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=u}_$AI(t,e=this,s,i){const o=this.strings;let n=!1;if(o===void 0)t=k(this,t,e,0),n=!V(t)||t!==this._$AH&&t!==M,n&&(this._$AH=t);else{const c=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=k(this,c[s+l],e,l),h===M&&(h=this._$AH[l]),n||=!V(h)||h!==this._$AH[l],h===u?t=u:t!==u&&(t+=(h??"")+o[l+1]),this._$AH[l]=h}n&&!i&&this.j(t)}j(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ye extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===u?void 0:t}}class _e extends X{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==u)}}class be extends X{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=k(this,t,e,0)??u)===M)return;const s=this._$AH,i=t===u&&s!==u||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==u&&(s===u||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Ae{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){k(this,t)}}const xe=ht.litHtmlPolyfillSupport;xe?.(W,K),(ht.litHtmlVersions??=[]).push("3.3.2");const Ee=(r,t,e)=>{const s=e?.renderBefore??t;let i=s._$litPart$;if(i===void 0){const o=e?.renderBefore??null;s._$litPart$=i=new K(t.insertBefore(q(),o),o,void 0,e??{})}return i._$AI(r),i};const pt=globalThis;class E extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Ee(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return M}}E._$litElement$=!0,E.finalized=!0,pt.litElementHydrateSupport?.({LitElement:E});const we=pt.litElementPolyfillSupport;we?.({LitElement:E});(pt.litElementVersions??=[]).push("4.2.2");const Y=r=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(r,t)}):customElements.define(r,t)};const Se={attribute:!0,type:String,converter:F,reflect:!1,hasChanged:lt},Pe=(r=Se,t,e)=>{const{kind:s,metadata:i}=e;let o=globalThis.litPropertyMetadata.get(i);if(o===void 0&&globalThis.litPropertyMetadata.set(i,o=new Map),s==="setter"&&((r=Object.create(r)).wrapped=!0),o.set(e.name,r),s==="accessor"){const{name:n}=e;return{set(c){const l=t.get.call(this);t.set.call(this,c),this.requestUpdate(n,l,r,!0,c)},init(c){return c!==void 0&&this.C(n,void 0,r,c),c}}}if(s==="setter"){const{name:n}=e;return function(c){const l=this[n];t.call(this,c),this.requestUpdate(n,l,r,!0,c)}}throw Error("Unsupported decorator location: "+s)};function tt(r){return(t,e)=>typeof e=="object"?Pe(r,t,e):((s,i,o)=>{const n=i.hasOwnProperty(o);return i.constructor.createProperty(o,s),n?Object.getOwnPropertyDescriptor(i,o):void 0})(r,t,e)}function nt(r){return tt({...r,state:!0,attribute:!1})}var Ht,Mt,kt,Rt,Tt,v;Tt=[Y("clanka-presence")];class S extends(Rt=E,kt=[nt()],Mt=[nt()],Ht=[nt()],Rt){constructor(){super(...arguments);g(this,"current",f(v,8,this,"...")),f(v,11,this);g(this,"status",f(v,12,this,"OPERATIONAL")),f(v,15,this);g(this,"history",f(v,16,this,[])),f(v,19,this)}async firstUpdated(){await this.updatePresence(),setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){try{const s=await(await fetch("https://clanka-api.clankamode.workers.dev/now")).json();this.current=s.current,this.status=s.status,this.history=s.history||[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:s}))}catch{console.error("Presence fetch failed")}}render(){return b`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${this.status==="thinking"?"thinking":""}"></span>
          ${this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span> ${this.current}
      </div>
    `}}v=z(Rt),_(v,5,"current",kt,S),_(v,5,"status",Mt,S),_(v,5,"history",Ht,S),S=_(v,0,"ClankaPresence",Tt,S),g(S,"styles",G`
    :host {
      display: block;
      --accent: #c8f542;
      --muted: #6b6b78;
      --dim: #3a3a42;
    }
    .hd {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid var(--border, #1e1e22);
      padding-bottom: 24px;
      margin-bottom: 64px;
    }
    .hd-name {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: bold;
    }
    .hd-status {
      font-size: 11px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      display: inline-block;
      animation: pulse 2s ease-in-out infinite;
    }
    .dot.thinking {
      background: #f5d442;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .presence-block {
      margin-top: 32px;
      font-size: 11px;
      color: var(--muted);
    }
    .presence-label {
      color: var(--dim);
    }
  `),f(v,1,S);var zt,Lt,It,C;It=[Y("clanka-activity")];class I extends(Lt=E,zt=[tt({type:Array})],Lt){constructor(){super(...arguments);g(this,"history",f(C,8,this,[])),f(C,11,this)}render(){return!this.history||this.history.length===0?b``:b`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.history.map(e=>b`
        <div class="row">
          <span class="row-name">[${e.type}] ${e.desc}</span>
          <span class="row-meta">${new Date(e.timestamp).toLocaleDateString()}</span>
        </div>
      `)}
    `}}C=z(Lt),_(C,5,"history",zt,I),I=_(C,0,"ClankaActivity",It,I),g(I,"styles",G`
    :host {
      display: block;
      margin-bottom: 64px;
    }
    .sec-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .sec-label {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--muted, #6b6b78);
    }
    .sec-line {
      flex: 1;
      height: 1px;
      background: var(--border, #1e1e22);
    }
    .row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: baseline;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .row-name { color: var(--text, #d4d4dc); font-size: 13px; }
    .row-meta { color: var(--dim, #3a3a42); font-size: 11px; text-align: right; }
  `),f(C,1,I);var jt,Dt,Bt,U;Bt=[Y("clanka-terminal")];class j extends(Dt=E,jt=[tt({type:Object})],Dt){constructor(){super(...arguments);g(this,"team",f(U,8,this,{})),f(U,11,this);g(this,"roles",{orchestrator:"CLANKA",architect:"ARCHITECT",engineer:"ENGINEER",auditor:"AUDITOR",chronicler:"CHRONICLER"})}render(){return b`
      <div class="sec-header">
        <span class="sec-label">terminal_view</span>
        <div class="sec-line"></div>
      </div>
      <div class="grid">
        ${Object.entries(this.roles).map(([e,s])=>{const i=this.team[e]||{status:"idle",task:"waiting_for_directive"},o=i.status==="active";return b`
            <div class="node">
              <div class="node-id">${e}</div>
              <div class="node-role">${s}</div>
              <div class="node-status ${o?"status-active":"status-idle"}">
                <span class="indicator"></span>
                ${i.status.toUpperCase()}
              </div>
              <div class="node-task">> ${i.task}</div>
            </div>
          `})}
      </div>
    `}}U=z(Dt),_(U,5,"team",jt,j),j=_(U,0,"ClankaTerminal",Bt,j),g(j,"styles",G`
    :host {
      display: block;
      margin-bottom: 64px;
      font-family: 'Courier New', Courier, monospace;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .node {
      background: var(--bg, #070708);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .node-id {
      font-size: 10px;
      color: var(--dim, #3a3a42);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .node-role {
      font-size: 12px;
      color: var(--bright, #f0f0f8);
      font-weight: bold;
    }
    .node-status {
      font-size: 9px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .indicator {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    .status-idle { color: var(--muted, #6b6b78); }
    .status-idle .indicator { background: var(--muted, #6b6b78); }
    
    .status-active { color: var(--accent, #c8f542); }
    .status-active .indicator { 
      background: var(--accent, #c8f542);
      box-shadow: 0 0 8px var(--accent, #c8f542);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .node-task {
      font-size: 10px;
      color: var(--muted, #6b6b78);
      line-height: 1.4;
      margin-top: 4px;
      min-height: 2.8em;
    }
  `),f(U,1,j);var qt,Vt,Wt,N;Wt=[Y("clanka-tasks")];class D extends(Vt=E,qt=[tt({type:Array})],Vt){constructor(){super(...arguments);g(this,"tasks",f(N,8,this,[])),f(N,11,this)}render(){return!this.tasks||this.tasks.length===0?b``:b`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>
      <div class="grid">
        ${this.tasks.map(e=>b`
          <div class="task-card">
            <div class="task-status status-${e.status.toLowerCase()}">${e.status}</div>
            <div class="task-title">${e.title}</div>
            <div class="task-meta">
              <span>@${e.assignee}</span>
              <span>P${e.priority}</span>
            </div>
          </div>
        `)}
      </div>
    `}}N=z(Vt),_(N,5,"tasks",qt,D),D=_(N,0,"ClankaTasks",Wt,D),g(D,"styles",G`
    :host {
      display: block;
      margin-bottom: 64px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .task-card {
      background: var(--surface, #0e0e10);
      border: 1px solid var(--border, #1e1e22);
      padding: 16px;
      position: relative;
    }
    .task-status {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .status-todo { color: var(--muted, #6b6b78); }
    .status-doing { color: var(--accent, #c8f542); }
    .status-done { color: #42f59e; opacity: 0.6; }
    
    .task-title {
      font-size: 13px;
      color: var(--bright, #f0f0f8);
      font-weight: bold;
      margin-bottom: 8px;
    }
    .task-meta {
      font-size: 10px;
      color: var(--dim, #3a3a42);
      display: flex;
      justify-content: space-between;
    }
  `),f(N,1,D);const Oe=document.getElementById("presence"),Ce=document.getElementById("activity"),Ue=document.getElementById("terminal"),Ne=document.getElementById("tasks");Oe.addEventListener("sync-updated",r=>{const t=r.detail;Ce.history=t.history,Ue.team=t.team||{},Ne.tasks=t.tasks||[]});
