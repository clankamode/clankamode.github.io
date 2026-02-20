var Zt=Object.create;var X=Object.defineProperty;var Ft=Object.getOwnPropertyDescriptor;var mt=(r,t)=>(t=Symbol[r])?t:Symbol.for("Symbol."+r),T=r=>{throw TypeError(r)};var gt=(r,t,e)=>t in r?X(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var ut=(r,t)=>X(r,"name",{value:t,configurable:!0});var V=r=>[,,,Zt(r?.[mt("metadata")]??null)],_t=["class","method","getter","setter","accessor","field","value","get","set"],R=r=>r!==void 0&&typeof r!="function"?T("Function expected"):r,Jt=(r,t,e,s,i)=>({kind:_t[r],name:t,metadata:s,addInitializer:n=>e._?T("Already initialized"):i.push(R(n||null))}),Gt=(r,t)=>gt(t,mt("metadata"),r[3]),f=(r,t,e,s)=>{for(var i=0,n=r[t>>1],o=n&&n.length;i<o;i++)t&1?n[i].call(e):s=n[i].call(e,s);return s},v=(r,t,e,s,i,n)=>{var o,c,h,l,d,a=t&7,$=!!(t&8),p=!!(t&16),A=a>3?r.length+1:a?$?1:2:0,dt=_t[a+5],pt=a>3&&(r[A-1]=[]),Kt=r[A]||(r[A]=[]),_=a&&(!p&&!$&&(i=i.prototype),a<5&&(a>3||!p)&&Ft(a<4?i:{get[e](){return ft(this,n)},set[e](m){return $t(this,n,m)}},e));a?p&&a<4&&ut(n,(a>2?"set ":a>1?"get ":"")+e):ut(i,e);for(var G=s.length-1;G>=0;G--)l=Jt(a,e,h={},r[3],Kt),a&&(l.static=$,l.private=p,d=l.access={has:p?m=>Qt(i,m):m=>e in m},a^3&&(d.get=p?m=>(a^1?ft:Xt)(m,i,a^4?n:_.get):m=>m[e]),a>2&&(d.set=p?(m,Q)=>$t(m,i,Q,a^4?n:_.set):(m,Q)=>m[e]=Q)),c=(0,s[G])(a?a<4?p?n:_[dt]:a>4?void 0:{get:_.get,set:_.set}:i,l),h._=1,a^4||c===void 0?R(c)&&(a>4?pt.unshift(c):a?p?n=c:_[dt]=c:i=c):typeof c!="object"||c===null?T("Object expected"):(R(o=c.get)&&(_.get=o),R(o=c.set)&&(_.set=o),R(o=c.init)&&pt.unshift(o));return a||Gt(r,i),_&&X(i,e,_),p?a^4?n:_:i},y=(r,t,e)=>gt(r,typeof t!="symbol"?t+"":t,e),Y=(r,t,e)=>t.has(r)||T("Cannot "+e),Qt=(r,t)=>Object(t)!==t?T('Cannot use the "in" operator on this value'):r.has(t),ft=(r,t,e)=>(Y(r,t,"read from private field"),e?e.call(r):t.get(r));var $t=(r,t,e,s)=>(Y(r,t,"write to private field"),s?s.call(r,e):t.set(r,e),e),Xt=(r,t,e)=>(Y(r,t,"access private method"),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();const W=globalThis,st=W.ShadowRoot&&(W.ShadyCSS===void 0||W.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,it=Symbol(),yt=new WeakMap;let Dt=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==it)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(st&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=yt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&yt.set(e,t))}return t}toString(){return this.cssText}};const Yt=r=>new Dt(typeof r=="string"?r:r+"",void 0,it),rt=(r,...t)=>{const e=r.length===1?r[0]:t.reduce((s,i,n)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[n+1],r[0]);return new Dt(e,r,it)},te=(r,t)=>{if(st)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),i=W.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},vt=st?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return Yt(e)})(r):r;const{is:ee,defineProperty:se,getOwnPropertyDescriptor:ie,getOwnPropertyNames:re,getOwnPropertySymbols:ne,getPrototypeOf:oe}=Object,F=globalThis,At=F.trustedTypes,ae=At?At.emptyScript:"",ce=F.reactiveElementPolyfillSupport,I=(r,t)=>r,K={toAttribute(r,t){switch(t){case Boolean:r=r?ae:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},nt=(r,t)=>!ee(r,t),bt={attribute:!0,type:String,converter:K,reflect:!1,useDefault:!1,hasChanged:nt};Symbol.metadata??=Symbol("metadata"),F.litPropertyMetadata??=new WeakMap;let U=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=bt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&se(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=ie(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:i,set(o){const c=i?.call(this);n?.call(this,o),this.requestUpdate(t,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??bt}static _$Ei(){if(this.hasOwnProperty(I("elementProperties")))return;const t=oe(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(I("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(I("properties"))){const e=this.properties,s=[...re(e),...ne(e)];for(const i of s)this.createProperty(i,e[i])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)e.unshift(vt(i))}else t!==void 0&&e.push(vt(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return te(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:K).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const n=s.getPropertyOptions(i),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:K;this._$Em=i;const c=o.fromAttribute(e,n.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){if(t!==void 0){const o=this.constructor;if(i===!1&&(n=this[t]),s??=o.getPropertyOptions(t),!((s.hasChanged??nt)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),n!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,n]of s){const{wrapped:o}=n,c=this[i];o!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,n,c)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};U.elementStyles=[],U.shadowRootOptions={mode:"open"},U[I("elementProperties")]=new Map,U[I("finalized")]=new Map,ce?.({ReactiveElement:U}),(F.reactiveElementVersions??=[]).push("2.1.2");const ot=globalThis,Et=r=>r,Z=ot.trustedTypes,xt=Z?Z.createPolicy("lit-html",{createHTML:r=>r}):void 0,Bt="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,qt="?"+b,he=`<${qt}>`,P=document,j=()=>P.createComment(""),D=r=>r===null||typeof r!="object"&&typeof r!="function",at=Array.isArray,le=r=>at(r)||typeof r?.[Symbol.iterator]=="function",tt=`[ 	
\f\r]`,k=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,wt=/-->/g,St=/>/g,E=RegExp(`>|${tt}(?:([^\\s"'>=/]+)(${tt}*=${tt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Pt=/'/g,Ct=/"/g,Vt=/^(?:script|style|textarea|title)$/i,de=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),N=de(1),H=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Ot=new WeakMap,w=P.createTreeWalker(P,129);function Wt(r,t){if(!at(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return xt!==void 0?xt.createHTML(t):t}const pe=(r,t)=>{const e=r.length-1,s=[];let i,n=t===2?"<svg>":t===3?"<math>":"",o=k;for(let c=0;c<e;c++){const h=r[c];let l,d,a=-1,$=0;for(;$<h.length&&(o.lastIndex=$,d=o.exec(h),d!==null);)$=o.lastIndex,o===k?d[1]==="!--"?o=wt:d[1]!==void 0?o=St:d[2]!==void 0?(Vt.test(d[2])&&(i=RegExp("</"+d[2],"g")),o=E):d[3]!==void 0&&(o=E):o===E?d[0]===">"?(o=i??k,a=-1):d[1]===void 0?a=-2:(a=o.lastIndex-d[2].length,l=d[1],o=d[3]===void 0?E:d[3]==='"'?Ct:Pt):o===Ct||o===Pt?o=E:o===wt||o===St?o=k:(o=E,i=void 0);const p=o===E&&r[c+1].startsWith("/>")?" ":"";n+=o===k?h+he:a>=0?(s.push(l),h.slice(0,a)+Bt+h.slice(a)+b+p):h+b+(a===-2?c:p)}return[Wt(r,n+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class B{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,o=0;const c=t.length-1,h=this.parts,[l,d]=pe(t,e);if(this.el=B.createElement(l,s),w.currentNode=this.el.content,e===2||e===3){const a=this.el.content.firstChild;a.replaceWith(...a.childNodes)}for(;(i=w.nextNode())!==null&&h.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(const a of i.getAttributeNames())if(a.endsWith(Bt)){const $=d[o++],p=i.getAttribute(a).split(b),A=/([.?@])?(.*)/.exec($);h.push({type:1,index:n,name:A[2],strings:p,ctor:A[1]==="."?fe:A[1]==="?"?$e:A[1]==="@"?me:J}),i.removeAttribute(a)}else a.startsWith(b)&&(h.push({type:6,index:n}),i.removeAttribute(a));if(Vt.test(i.tagName)){const a=i.textContent.split(b),$=a.length-1;if($>0){i.textContent=Z?Z.emptyScript:"";for(let p=0;p<$;p++)i.append(a[p],j()),w.nextNode(),h.push({type:2,index:++n});i.append(a[$],j())}}}else if(i.nodeType===8)if(i.data===qt)h.push({type:2,index:n});else{let a=-1;for(;(a=i.data.indexOf(b,a+1))!==-1;)h.push({type:7,index:n}),a+=b.length-1}n++}}static createElement(t,e){const s=P.createElement("template");return s.innerHTML=t,s}}function M(r,t,e=r,s){if(t===H)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl;const n=D(t)?void 0:t._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=M(r,i._$AS(r,t.values),i,s)),t}class ue{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??P).importNode(e,!0);w.currentNode=i;let n=w.nextNode(),o=0,c=0,h=s[0];for(;h!==void 0;){if(o===h.index){let l;h.type===2?l=new q(n,n.nextSibling,this,t):h.type===1?l=new h.ctor(n,h.name,h.strings,this,t):h.type===6&&(l=new ge(n,this,t)),this._$AV.push(l),h=s[++c]}o!==h?.index&&(n=w.nextNode(),o++)}return w.currentNode=P,i}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=M(this,t,e),D(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==H&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):le(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==u&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=B.createElement(Wt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const n=new ue(i,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(t){let e=Ot.get(t.strings);return e===void 0&&Ot.set(t.strings,e=new B(t)),e}k(t){at(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new q(this.O(j()),this.O(j()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const s=Et(t).nextSibling;Et(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class J{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=u}_$AI(t,e=this,s,i){const n=this.strings;let o=!1;if(n===void 0)t=M(this,t,e,0),o=!D(t)||t!==this._$AH&&t!==H,o&&(this._$AH=t);else{const c=t;let h,l;for(t=n[0],h=0;h<n.length-1;h++)l=M(this,c[s+h],e,h),l===H&&(l=this._$AH[h]),o||=!D(l)||l!==this._$AH[h],l===u?t=u:t!==u&&(t+=(l??"")+n[h+1]),this._$AH[h]=l}o&&!i&&this.j(t)}j(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class fe extends J{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===u?void 0:t}}class $e extends J{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==u)}}class me extends J{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=M(this,t,e,0)??u)===H)return;const s=this._$AH,i=t===u&&s!==u||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==u&&(s===u||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ge{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t)}}const _e=ot.litHtmlPolyfillSupport;_e?.(B,q),(ot.litHtmlVersions??=[]).push("3.3.2");const ye=(r,t,e)=>{const s=e?.renderBefore??t;let i=s._$litPart$;if(i===void 0){const n=e?.renderBefore??null;s._$litPart$=i=new q(t.insertBefore(j(),n),n,void 0,e??{})}return i._$AI(r),i};const ct=globalThis;class S extends U{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ye(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return H}}S._$litElement$=!0,S.finalized=!0,ct.litElementHydrateSupport?.({LitElement:S});const ve=ct.litElementPolyfillSupport;ve?.({LitElement:S});(ct.litElementVersions??=[]).push("4.2.2");const ht=r=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(r,t)}):customElements.define(r,t)};const Ae={attribute:!0,type:String,converter:K,reflect:!1,hasChanged:nt},be=(r=Ae,t,e)=>{const{kind:s,metadata:i}=e;let n=globalThis.litPropertyMetadata.get(i);if(n===void 0&&globalThis.litPropertyMetadata.set(i,n=new Map),s==="setter"&&((r=Object.create(r)).wrapped=!0),n.set(e.name,r),s==="accessor"){const{name:o}=e;return{set(c){const h=t.get.call(this);t.set.call(this,c),this.requestUpdate(o,h,r,!0,c)},init(c){return c!==void 0&&this.C(o,void 0,r,c),c}}}if(s==="setter"){const{name:o}=e;return function(c){const h=this[o];t.call(this,c),this.requestUpdate(o,h,r,!0,c)}}throw Error("Unsupported decorator location: "+s)};function lt(r){return(t,e)=>typeof e=="object"?be(r,t,e):((s,i,n)=>{const o=i.hasOwnProperty(n);return i.constructor.createProperty(n,s),o?Object.getOwnPropertyDescriptor(i,n):void 0})(r,t,e)}function et(r){return lt({...r,state:!0,attribute:!1})}var Ut,Nt,Ht,Mt,Rt,g;Rt=[ht("clanka-presence")];class x extends(Mt=S,Ht=[et()],Nt=[et()],Ut=[et()],Mt){constructor(){super(...arguments);y(this,"current",f(g,8,this,"...")),f(g,11,this);y(this,"status",f(g,12,this,"OPERATIONAL")),f(g,15,this);y(this,"history",f(g,16,this,[])),f(g,19,this)}async firstUpdated(){await this.updatePresence(),setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){try{const s=await(await fetch("https://clanka-api.clankamode.workers.dev/now")).json();this.current=s.current,this.status=s.status,this.history=s.history||[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:s}))}catch{console.error("Presence fetch failed")}}render(){return N`
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
    `}}g=V(Mt),v(g,5,"current",Ht,x),v(g,5,"status",Nt,x),v(g,5,"history",Ut,x),x=v(g,0,"ClankaPresence",Rt,x),y(x,"styles",rt`
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
  `),f(g,1,x);var Tt,kt,Lt,C;Lt=[ht("clanka-activity")];class L extends(kt=S,Tt=[lt({type:Array})],kt){constructor(){super(...arguments);y(this,"history",f(C,8,this,[])),f(C,11,this)}render(){return!this.history||this.history.length===0?N``:N`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.history.map(e=>N`
        <div class="row">
          <span class="row-name">[${e.type}] ${e.desc}</span>
          <span class="row-meta">${new Date(e.timestamp).toLocaleDateString()}</span>
        </div>
      `)}
    `}}C=V(kt),v(C,5,"history",Tt,L),L=v(C,0,"ClankaActivity",Lt,L),y(L,"styles",rt`
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
  `),f(C,1,L);var zt,It,jt,O;jt=[ht("clanka-terminal")];class z extends(It=S,zt=[lt({type:Object})],It){constructor(){super(...arguments);y(this,"team",f(O,8,this,{})),f(O,11,this);y(this,"roles",{orchestrator:"CLANKA",architect:"ARCHITECT",engineer:"ENGINEER",auditor:"AUDITOR",chronicler:"CHRONICLER"})}render(){return N`
      <div class="sec-header">
        <span class="sec-label">terminal_view</span>
        <div class="sec-line"></div>
      </div>
      <div class="grid">
        ${Object.entries(this.roles).map(([e,s])=>{const i=this.team[e]||{status:"idle",task:"waiting_for_directive"},n=i.status==="active";return N`
            <div class="node">
              <div class="node-id">${e}</div>
              <div class="node-role">${s}</div>
              <div class="node-status ${n?"status-active":"status-idle"}">
                <span class="indicator"></span>
                ${i.status.toUpperCase()}
              </div>
              <div class="node-task">> ${i.task}</div>
            </div>
          `})}
      </div>
    `}}O=V(It),v(O,5,"team",zt,z),z=v(O,0,"ClankaTerminal",jt,z),y(z,"styles",rt`
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
  `),f(O,1,z);const Ee=document.getElementById("presence"),xe=document.getElementById("activity"),we=document.getElementById("terminal");Ee.addEventListener("sync-updated",r=>{const t=r.detail;xe.history=t.history,we.team=t.team||{}});
