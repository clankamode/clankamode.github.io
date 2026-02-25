(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(i){if(i.ep)return;i.ep=!0;const a=t(i);fetch(i.href,a)}})();const Q=globalThis,le=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ce=Symbol(),he=new WeakMap;let Ee=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==ce)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(le&&e===void 0){const r=t!==void 0&&t.length===1;r&&(e=he.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&he.set(t,e))}return e}toString(){return this.cssText}};const Le=s=>new Ee(typeof s=="string"?s:s+"",void 0,ce),D=(s,...e)=>{const t=s.length===1?s[0]:e.reduce((r,i,a)=>r+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[a+1],s[0]);return new Ee(t,s,ce)},Me=(s,e)=>{if(le)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const r=document.createElement("style"),i=Q.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},ue=le?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(const r of e.cssRules)t+=r.cssText;return Le(t)})(s):s;const{is:Ne,defineProperty:De,getOwnPropertyDescriptor:ze,getOwnPropertyNames:Ie,getOwnPropertySymbols:Ue,getPrototypeOf:Re}=Object,x=globalThis,fe=x.trustedTypes,je=fe?fe.emptyScript:"",He=x.reactiveElementPolyfillSupport,R=(s,e)=>s,te={toAttribute(s,e){switch(e){case Boolean:s=s?je:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},de=(s,e)=>!Ne(s,e),me={attribute:!0,type:String,converter:te,reflect:!1,useDefault:!1,hasChanged:de};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),x.litPropertyMetadata??(x.litPropertyMetadata=new WeakMap);let O=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=me){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&De(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){const{get:i,set:a}=ze(this.prototype,e)??{get(){return this[t]},set(n){this[t]=n}};return{get:i,set(n){const l=i?.call(this);a?.call(this,n),this.requestUpdate(e,l,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??me}static _$Ei(){if(this.hasOwnProperty(R("elementProperties")))return;const e=Re(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(R("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(R("properties"))){const t=this.properties,r=[...Ie(t),...Ue(t)];for(const i of r)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[t,r]of this.elementProperties){const i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const i of r)t.unshift(ue(i))}else e!==void 0&&t.push(ue(e));return t}static _$Eu(e,t){const r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Me(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){const r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){const a=(r.converter?.toAttribute!==void 0?r.converter:te).toAttribute(t,r.type);this._$Em=e,a==null?this.removeAttribute(i):this.setAttribute(i,a),this._$Em=null}}_$AK(e,t){const r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const a=r.getPropertyOptions(i),n=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:te;this._$Em=i;const l=n.fromAttribute(t,a.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,t,r,i=!1,a){if(e!==void 0){const n=this.constructor;if(i===!1&&(a=this[e]),r??(r=n.getPropertyOptions(e)),!((r.hasChanged??de)(a,t)||r.useDefault&&r.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:a},n){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,n??t??this[e]),a!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,a]of this._$Ep)this[i]=a;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[i,a]of r){const{wrapped:n}=a,l=this[i];n!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,a,l)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};O.elementStyles=[],O.shadowRootOptions={mode:"open"},O[R("elementProperties")]=new Map,O[R("finalized")]=new Map,He?.({ReactiveElement:O}),(x.reactiveElementVersions??(x.reactiveElementVersions=[])).push("2.1.2");const j=globalThis,ge=s=>s,se=j.trustedTypes,ve=se?se.createPolicy("lit-html",{createHTML:s=>s}):void 0,Se="$lit$",$=`lit$${Math.random().toFixed(9).slice(2)}$`,Ce="?"+$,Be=`<${Ce}>`,E=document,q=()=>E.createComment(""),F=s=>s===null||typeof s!="object"&&typeof s!="function",pe=Array.isArray,Ve=s=>pe(s)||typeof s?.[Symbol.iterator]=="function",ne=`[ 	
\f\r]`,U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,be=/-->/g,ye=/>/g,w=RegExp(`>|${ne}(?:([^\\s"'>=/]+)(${ne}*=${ne}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),$e=/'/g,xe=/"/g,Oe=/^(?:script|style|textarea|title)$/i,qe=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),c=qe(1),T=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),_e=new WeakMap,k=E.createTreeWalker(E,129);function Pe(s,e){if(!pe(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return ve!==void 0?ve.createHTML(e):e}const Fe=(s,e)=>{const t=s.length-1,r=[];let i,a=e===2?"<svg>":e===3?"<math>":"",n=U;for(let l=0;l<t;l++){const o=s[l];let p,h,d=-1,b=0;for(;b<o.length&&(n.lastIndex=b,h=n.exec(o),h!==null);)b=n.lastIndex,n===U?h[1]==="!--"?n=be:h[1]!==void 0?n=ye:h[2]!==void 0?(Oe.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=w):h[3]!==void 0&&(n=w):n===w?h[0]===">"?(n=i??U,d=-1):h[1]===void 0?d=-2:(d=n.lastIndex-h[2].length,p=h[1],n=h[3]===void 0?w:h[3]==='"'?xe:$e):n===xe||n===$e?n=w:n===be||n===ye?n=U:(n=w,i=void 0);const y=n===w&&s[l+1].startsWith("/>")?" ":"";a+=n===U?o+Be:d>=0?(r.push(p),o.slice(0,d)+Se+o.slice(d)+$+y):o+$+(d===-2?l:y)}return[Pe(s,a+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]};class W{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let a=0,n=0;const l=e.length-1,o=this.parts,[p,h]=Fe(e,t);if(this.el=W.createElement(p,r),k.currentNode=this.el.content,t===2||t===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=k.nextNode())!==null&&o.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const d of i.getAttributeNames())if(d.endsWith(Se)){const b=h[n++],y=i.getAttribute(d).split($),J=/([.?@])?(.*)/.exec(b);o.push({type:1,index:a,name:J[2],strings:y,ctor:J[1]==="."?Ke:J[1]==="?"?Ye:J[1]==="@"?Ge:re}),i.removeAttribute(d)}else d.startsWith($)&&(o.push({type:6,index:a}),i.removeAttribute(d));if(Oe.test(i.tagName)){const d=i.textContent.split($),b=d.length-1;if(b>0){i.textContent=se?se.emptyScript:"";for(let y=0;y<b;y++)i.append(d[y],q()),k.nextNode(),o.push({type:2,index:++a});i.append(d[b],q())}}}else if(i.nodeType===8)if(i.data===Ce)o.push({type:2,index:a});else{let d=-1;for(;(d=i.data.indexOf($,d+1))!==-1;)o.push({type:7,index:a}),d+=$.length-1}a++}}static createElement(e,t){const r=E.createElement("template");return r.innerHTML=e,r}}function L(s,e,t=s,r){if(e===T)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl;const a=F(e)?void 0:e._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??(t._$Co=[]))[r]=i:t._$Cl=i),i!==void 0&&(e=L(s,i._$AS(s,e.values),i,r)),e}class We{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??E).importNode(t,!0);k.currentNode=i;let a=k.nextNode(),n=0,l=0,o=r[0];for(;o!==void 0;){if(n===o.index){let p;o.type===2?p=new K(a,a.nextSibling,this,e):o.type===1?p=new o.ctor(a,o.name,o.strings,this,e):o.type===6&&(p=new Je(a,this,e)),this._$AV.push(p),o=r[++l]}n!==o?.index&&(a=k.nextNode(),n++)}return k.currentNode=E,i}p(e){let t=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}}class K{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=L(this,e,t),F(e)?e===u||e==null||e===""?(this._$AH!==u&&this._$AR(),this._$AH=u):e!==this._$AH&&e!==T&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ve(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==u&&F(this._$AH)?this._$AA.nextSibling.data=e:this.T(E.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=W.createElement(Pe(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{const a=new We(i,this),n=a.u(this.options);a.p(t),this.T(n),this._$AH=a}}_$AC(e){let t=_e.get(e.strings);return t===void 0&&_e.set(e.strings,t=new W(e)),t}k(e){pe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let r,i=0;for(const a of e)i===t.length?t.push(r=new K(this.O(q()),this.O(q()),this,this.options)):r=t[i],r._$AI(a),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const r=ge(e).nextSibling;ge(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class re{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,a){this.type=1,this._$AH=u,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=a,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=u}_$AI(e,t=this,r,i){const a=this.strings;let n=!1;if(a===void 0)e=L(this,e,t,0),n=!F(e)||e!==this._$AH&&e!==T,n&&(this._$AH=e);else{const l=e;let o,p;for(e=a[0],o=0;o<a.length-1;o++)p=L(this,l[r+o],t,o),p===T&&(p=this._$AH[o]),n||(n=!F(p)||p!==this._$AH[o]),p===u?e=u:e!==u&&(e+=(p??"")+a[o+1]),this._$AH[o]=p}n&&!i&&this.j(e)}j(e){e===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Ke extends re{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===u?void 0:e}}class Ye extends re{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==u)}}class Ge extends re{constructor(e,t,r,i,a){super(e,t,r,i,a),this.type=5}_$AI(e,t=this){if((e=L(this,e,t,0)??u)===T)return;const r=this._$AH,i=e===u&&r!==u||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,a=e!==u&&(r===u||i);i&&this.element.removeEventListener(this.name,this,r),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Je{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){L(this,e)}}const Ze=j.litHtmlPolyfillSupport;Ze?.(W,K),(j.litHtmlVersions??(j.litHtmlVersions=[])).push("3.3.2");const Xe=(s,e,t)=>{const r=t?.renderBefore??e;let i=r._$litPart$;if(i===void 0){const a=t?.renderBefore??null;r._$litPart$=i=new K(e.insertBefore(q(),a),a,void 0,t??{})}return i._$AI(s),i};const H=globalThis;class g extends O{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Xe(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return T}}g._$litElement$=!0,g.finalized=!0,H.litElementHydrateSupport?.({LitElement:g});const Qe=H.litElementPolyfillSupport;Qe?.({LitElement:g});(H.litElementVersions??(H.litElementVersions=[])).push("4.2.2");const z=s=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(s,e)}):customElements.define(s,e)};const et={attribute:!0,type:String,converter:te,reflect:!1,hasChanged:de},tt=(s=et,e,t)=>{const{kind:r,metadata:i}=t;let a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r==="setter"&&((s=Object.create(s)).wrapped=!0),a.set(t.name,s),r==="accessor"){const{name:n}=t;return{set(l){const o=e.get.call(this);e.set.call(this,l),this.requestUpdate(n,o,s,!0,l)},init(l){return l!==void 0&&this.C(n,void 0,s,l),l}}}if(r==="setter"){const{name:n}=t;return function(l){const o=this[n];e.call(this,l),this.requestUpdate(n,o,s,!0,l)}}throw Error("Unsupported decorator location: "+r)};function m(s){return(e,t)=>typeof t=="object"?tt(s,e,t):((r,i,a)=>{const n=i.hasOwnProperty(a);return i.constructor.createProperty(a,r),n?Object.getOwnPropertyDescriptor(i,a):void 0})(s,e,t)}function f(s){return m({...s,state:!0,attribute:!1})}const st="https://clanka-api.clankamode.workers.dev",rt=15e3,Ae=new Map,oe=new Map;function it(s){return`${st}${s}`}async function Te(s,e=rt){const t=it(s),r=Ae.get(t),i=Date.now();if(r&&r.expiresAt>i)return r.data;const a=oe.get(t);if(a)return a;const n=(async()=>{const l=await fetch(t,{headers:{Accept:"application/json"}});if(!l.ok)throw new Error(`API ${l.status}`);const o=await l.json();return Ae.set(t,{data:o,expiresAt:Date.now()+e}),o})();oe.set(t,n);try{return await n}finally{oe.delete(t)}}function at(){return Te("/now")}function nt(){return Te("/fleet/summary")}var ot=Object.defineProperty,lt=Object.getOwnPropertyDescriptor,I=(s,e,t,r)=>{for(var i=r>1?void 0:r?lt(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&ot(e,t,i),i};let _=class extends g{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const s=await at();this.current=typeof s.current=="string"?s.current:"active",this.status=typeof s.status=="string"?s.status:"operational",this.history=Array.isArray(s.history)?s.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:s}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const s=this.status.toLowerCase();return c`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${s==="thinking"?"thinking":""}" style=${s==="offline"?"opacity:.4":""}></span>
          ${this.loading?"SYNCING":this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading?c`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`:this.error?c`<span class="error"> ${this.error}</span>`:c` ${this.current}`}
      </div>
    `}};_.styles=D`
    :host {
      display: block;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --accent: #c8f542;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
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
    .loading,
    .error {
      color: var(--accent);
      animation: pulse 1.4s ease-in-out infinite;
    }
    .error {
      color: var(--muted);
      animation: none;
    }
    .skeleton {
      height: 12px;
      margin-top: 6px;
      width: min(380px, 80%);
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface) 90%, var(--border) 10%) 0%,
        color-mix(in srgb, var(--surface) 60%, var(--accent) 40%) 50%,
        color-mix(in srgb, var(--surface) 90%, var(--border) 10%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s linear infinite;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
  `;I([f()],_.prototype,"current",2);I([f()],_.prototype,"status",2);I([f()],_.prototype,"history",2);I([f()],_.prototype,"loading",2);I([f()],_.prototype,"error",2);_=I([z("clanka-presence")],_);var ct=Object.defineProperty,dt=Object.getOwnPropertyDescriptor,ie=(s,e,t,r)=>{for(var i=r>1?void 0:r?dt(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&ct(e,t,i),i};let M=class extends g{constructor(){super(...arguments),this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.hasAttribute("tabindex")||(this.tabIndex=0)}formatDate(s){if(s===void 0)return"--";const e=new Date(s);return Number.isNaN(e.getTime())?"--":e.toLocaleDateString()}render(){return c`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?c`
            <div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>
            ${Array.from({length:3}).map(()=>c`<div class="skeleton-row" aria-hidden="true">
                <span class="skeleton-line"></span>
                <span class="skeleton-line short"></span>
              </div>`)}
          `:this.error?c`<div class="status-fallback">${this.error}</div>`:this.history.length===0?c`<div class="status-fallback">[ no activity ]</div>`:this.history.map(s=>c`
                  <div class="row" role="listitem">
                    <span class="row-name">[${(s.type??"event").toString()}] ${(s.desc??"update").toString()}</span>
                    <span class="row-meta">${this.formatDate(s.timestamp)}</span>
                  </div>
                `)}
    `}};M.styles=D`
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
      border-left: 2px solid transparent;
      transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
    }
    .row:hover {
      border-left-color: var(--accent, #c8f542);
      transform: translateX(2px);
      background: color-mix(in srgb, var(--surface, #0e0e10) 84%, var(--accent, #c8f542) 16%);
      padding-left: 10px;
      padding-right: 10px;
      margin: 0 -10px;
    }
    .row-name {
      color: var(--text, #d4d4dc);
      font-size: 13px;
    }
    .row-meta {
      color: var(--dim, #3a3a42);
      font-size: 11px;
      text-align: right;
    }
    .loading-text {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .status-fallback {
      font-size: 12px;
      color: var(--muted, #6b6b78);
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .skeleton-row {
      display: grid;
      grid-template-columns: 1fr 72px;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border, #1e1e22);
    }
    .skeleton-line {
      height: 11px;
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 0%,
        color-mix(in srgb, var(--surface, #0e0e10) 70%, var(--accent, #c8f542) 30%) 50%,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.8s linear infinite;
    }
    .skeleton-line.short {
      width: 72px;
      justify-self: end;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.4; }
    }
  `;ie([m({type:Array})],M.prototype,"history",2);ie([m({type:Boolean})],M.prototype,"loading",2);ie([m({type:String})],M.prototype,"error",2);M=ie([z("clanka-activity")],M);var pt=Object.defineProperty,ht=Object.getOwnPropertyDescriptor,Y=(s,e,t,r)=>{for(var i=r>1?void 0:r?ht(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&pt(e,t,i),i};const Z=["ops","infra","core","quality","policy","template"];let S=class extends g{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const s=await nt(),e=this.extractRepos(s);if(!e.length)throw new Error("No fleet repos in payload");this.repos=e,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(s){const e=this.pickRepoArray(s);return e.length?e.map(t=>this.normalizeRepo(t)).filter(t=>t!==null).sort((t,r)=>{const i=Z.indexOf(t.tier)-Z.indexOf(r.tier);return i!==0?i:t.repo.localeCompare(r.repo)}):[]}pickRepoArray(s){if(!s||typeof s!="object")return[];const e=s;if(Array.isArray(e.repos))return e.repos;if(Array.isArray(e.fleet))return e.fleet;if(e.summary&&typeof e.summary=="object"){const t=e.summary;if(Array.isArray(t.repos))return t.repos;if(Array.isArray(t.fleet))return t.fleet}return[]}readOnlineState(s){if(typeof s.online=="boolean")return s.online;const e=String(s.status??s.state??"").trim().toLowerCase();return e?["offline","down","error","failed","degraded"].includes(e)?!1:(["online","up","ok","healthy","active"].includes(e),!0):!0}normalizeRepo(s){if(!s||typeof s!="object")return null;const e=s,t=String(e.repo??e.name??e.full_name??"").trim(),r=String(e.tier??"").trim().toLowerCase(),i=String(e.criticality??e.priority??"").trim().toLowerCase(),a=this.readOnlineState(e);return!t||!Z.includes(r)?null:["critical","high","medium"].includes(i)?{repo:t,tier:r,criticality:i,online:a}:{repo:t,tier:r,criticality:"medium",online:a}}shortName(s){return s.replace(/^clankamode\//,"")}render(){const s=Z.map(e=>({tier:e,repos:this.repos.filter(t=>t.tier===e)})).filter(e=>e.repos.length>0);return c`
      <div class="sec-header">
        <span class="sec-label">fleet</span>
        <div class="sec-line"></div>
        <span class="sync ${this.live?"live":""}">
          ${this.loading?"SYNCING":this.live?"LIVE":"OFFLINE"}
        </span>
      </div>

      ${this.loading?c`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid" aria-hidden="true">
              ${Array.from({length:6}).map(()=>c`<div class="skeleton-card">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>`)}
            </div>
          `:this.error?c`<div class="fallback">${this.error}</div>`:s.map(e=>c`
                <div class="tier-group">
                  <div class="tier-title">${e.tier}</div>
                  <div class="grid" role="list">
                    ${e.repos.map(t=>c`
                        <article class="card" role="listitem">
                          <div class="card-head">
                            <span class="repo">${this.shortName(t.repo)}</span>
                            <span class="status-pill ${t.online?"online":"offline"}">
                              ${t.online?"● online":"○ offline"}
                            </span>
                          </div>
                          <div class="tier-badge">${t.tier}</div>
                          <div class="criticality"><span class="dot ${t.criticality}" aria-hidden="true"></span>${t.criticality}</div>
                        </article>
                      `)}
                  </div>
                </div>
              `)}
    `}};S.styles=D`
    :host {
      display: block;
      margin-bottom: 64px;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --accent: #c8f542;
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
    .sync {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted, #6b6b78);
    }
    .sync.live {
      color: var(--accent, #c8f542);
    }
    .tier-group {
      margin-bottom: 18px;
    }
    .tier-title {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--dim, #3a3a42);
      margin-bottom: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .card {
      background: var(--bg, #070708);
      padding: 12px 16px;
      transition: background 0.12s ease;
      min-height: 64px;
    }
    .card:hover {
      background: var(--surface, #0e0e10);
    }
    .card-head {
      margin-bottom: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .repo {
      font-size: 12px;
      color: var(--text, #d4d4dc);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tier-badge {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--dim, #3a3a42);
    }
    .criticality {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted, #6b6b78);
    }
    .status-pill {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .status-pill.online {
      color: var(--accent, #c8f542);
    }
    .status-pill.offline {
      color: var(--muted, #6b6b78);
      opacity: 0.65;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .critical { background: var(--accent, #c8f542); }
    .high { background: #f5a623; }
    .medium { background: var(--muted, #6b6b78); }
    .fallback {
      padding: 12px 16px;
      border: 1px solid var(--border, #1e1e22);
      background: var(--surface, #0e0e10);
      color: var(--muted, #6b6b78);
      font-size: 12px;
    }
    .loading {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton-card {
      background: var(--bg, #070708);
      padding: 12px 16px;
      min-height: 64px;
    }
    .skeleton-line {
      height: 10px;
      border-radius: 2px;
      margin-bottom: 9px;
      width: 80%;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 0%,
        color-mix(in srgb, var(--surface, #0e0e10) 70%, var(--accent, #c8f542) 30%) 50%,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.8s linear infinite;
    }
    .skeleton-line.short {
      width: 52%;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.4; }
    }
  `;Y([f()],S.prototype,"repos",2);Y([f()],S.prototype,"live",2);Y([f()],S.prototype,"loading",2);Y([f()],S.prototype,"error",2);S=Y([z("clanka-fleet")],S);var ut=Object.defineProperty,ft=Object.getOwnPropertyDescriptor,G=(s,e,t,r)=>{for(var i=r>1?void 0:r?ft(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&ut(e,t,i),i};let C=class extends g{constructor(){super(...arguments),this.team={},this.recentActivity=[],this.loading=!0,this.error="",this.roles={orchestrator:"CLANKA",architect:"ARCHITECT",engineer:"ENGINEER",auditor:"AUDITOR",chronicler:"CHRONICLER"}}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Terminal readout"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(s){const e=(s??"idle").toLowerCase();return e==="active"?"active":e==="offline"?"offline":"idle"}traceLines(){return this.recentActivity.length?this.recentActivity.slice(0,3).map(s=>{const e=s?.timestamp??Date.now(),t=new Date(e),r=Number.isNaN(t.getTime())?"--:--:--":t.toLocaleTimeString([],{hour12:!1}),i=(s.desc??s.type??"event").toString();return`${r} ${i}`}):["boot: no recent activity records"]}renderTeamLines(){return Object.entries(this.roles).map(([s,e])=>{const t=this.team[s]??{status:"idle",task:"waiting_for_directive"},r=this.normalizeStatus(t.status),i=r==="active"?"[online]":r==="offline"?"[offline]":"[idle]",a=(t.task??"waiting_for_directive").toString();return c`<div class="line">${i} ${e.padEnd(11," ")} :: ${a}</div>`})}render(){return c`
      <div class="sec-header">
        <span class="sec-label">terminal_view</span>
        <div class="sec-line"></div>
      </div>

      <div class="terminal" role="log" aria-live="polite" aria-atomic="false">
        ${this.loading?c`
              <div class="line">clanka@fleet:~$ <span>[ loading... ]</span></div>
              ${Array.from({length:5}).map(()=>c`<div class="skeleton" aria-hidden="true"></div>`)}
              <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
            `:this.error?c`
                <div class="line prompt">clanka@fleet:~$ status</div>
                <div class="line error">${this.error}</div>
                <div class="line dim">fallback mode: cached UI only</div>
                <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
              `:c`
                <div class="line prompt">clanka@fleet:~$ agents --status</div>
                ${this.renderTeamLines()}
                <div class="line dim">---</div>
                <div class="line prompt">clanka@fleet:~$ tail -n 3 /var/log/activity.log</div>
                ${this.traceLines().map(s=>c`<div class="line dim">${s}</div>`)}
                <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
              `}
      </div>
    `}};C.styles=D`
    :host {
      display: block;
      margin-bottom: 28px;
      font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
      --accent: #c8f542;
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
    .terminal {
      border: 1px solid var(--border, #1e1e22);
      background: radial-gradient(circle at top, #0f1110 0%, #070708 68%);
      padding: 14px;
      color: var(--accent, #c8f542);
      font-size: 11px;
      line-height: 1.55;
      overflow-x: auto;
    }
    .line {
      white-space: pre;
      color: color-mix(in srgb, var(--accent, #c8f542) 92%, #111 8%);
    }
    .line.dim {
      color: var(--muted, #6b6b78);
    }
    .line.error {
      color: #af8f8f;
    }
    .line.prompt {
      color: var(--bright, #f0f0f8);
    }
    .cursor {
      display: inline-block;
      width: 8px;
      height: 1em;
      background: var(--accent, #c8f542);
      transform: translateY(2px);
      margin-left: 3px;
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton {
      height: 10px;
      border-radius: 2px;
      width: 82%;
      margin: 8px 0;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, #0f1110 90%, var(--border, #1e1e22) 10%) 0%,
        color-mix(in srgb, #0f1110 72%, var(--accent, #c8f542) 28%) 50%,
        color-mix(in srgb, #0f1110 90%, var(--border, #1e1e22) 10%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.7s linear infinite;
    }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.2; }
    }
    @media (prefers-reduced-motion: reduce) {
      .cursor {
        animation: none;
      }
      .skeleton {
        animation: none;
      }
    }
  `;G([m({type:Object})],C.prototype,"team",2);G([m({type:Array})],C.prototype,"recentActivity",2);G([m({type:Boolean})],C.prototype,"loading",2);G([m({type:String})],C.prototype,"error",2);C=G([z("clanka-terminal")],C);var mt=Object.defineProperty,gt=Object.getOwnPropertyDescriptor,A=(s,e,t,r)=>{for(var i=r>1?void 0:r?gt(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&mt(e,t,i),i};const we=[{id:"ag-01",role:"CODEx",status:"ACTIVE",task:"analyzing PR diff in clanka-tools",sinceMs:Date.now()-42e3},{id:"ag-02",role:"CLAUDE",status:"IDLE",task:"waiting on deploy verification"},{id:"ag-03",role:"OPS",status:"DONE",task:"patching fleet config for edge failover",sinceMs:Date.now()-128e3},{id:"ag-04",role:"SCRIBE",status:"ACTIVE",task:"writing post 006: incident loops",sinceMs:Date.now()-17e3}];let v=class extends g{constructor(){super(...arguments),this.team={},this.nodes=[],this.loading=!0,this.error=!1,this.hasLiveData=!1,this.lastSyncMs=null,this.nowMs=Date.now()}connectedCallback(){super.connectedCallback(),this.tickId=window.setInterval(()=>{this.nowMs=Date.now()},1e3)}disconnectedCallback(){this.tickId&&window.clearInterval(this.tickId),super.disconnectedCallback()}async firstUpdated(){await this.fetchTeam()}updated(s){s.has("team")&&this.applyTeam(this.team,!0)}async fetchTeam(){this.loading=!0,this.error=!1;try{const s=await fetch("https://clanka-api.clankamode.workers.dev/now",{headers:{Accept:"application/json"}});if(!s.ok)throw new Error(`Agent fetch failed: ${s.status}`);const e=await s.json();this.applyTeam(this.extractTeam(e),!0)}catch(s){console.error("agent mesh fetch failed",s),this.error=!0,this.loading=!1,this.hasLiveData=!1,this.nodes=we}}extractTeam(s){const e=s.team;return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}applyTeam(s,e){const t=this.normalizeTeam(s);if(t.length>0){this.nodes=t,this.hasLiveData=!0,this.error=!1,this.loading=!1,e&&(this.lastSyncMs=Date.now());return}this.hasLiveData=!1,this.loading=!1,this.nodes=we}normalizeTeam(s){return Object.entries(s).map(([e,t])=>this.normalizeAgent(e,t)).filter(e=>e!==null).sort((e,t)=>{const r=this.statusRank(e.status)-this.statusRank(t.status);return r!==0?r:e.id.localeCompare(t.id)})}normalizeAgent(s,e){if(!e||typeof e!="object")return null;const t=e,r=String(t.id??s).trim();if(!r)return null;const i=String(t.role??s).trim().toUpperCase(),a=String(t.task??t.currentTask??t.current_task??t.activity??"awaiting_task").trim(),n=this.normalizeStatus(t.status),l=this.parseTime(t.startedAt??t.started_at??t.since??t.updatedAt??t.updated_at);return{id:r,role:i,status:n,task:a||"awaiting_task",sinceMs:l??void 0}}normalizeStatus(s){const e=String(s??"").trim().toLowerCase();return["active","running","busy","working"].includes(e)?"ACTIVE":["done","completed","complete","success"].includes(e)?"DONE":"IDLE"}parseTime(s){if(typeof s=="number"&&Number.isFinite(s))return s>1e12?s:s*1e3;if(typeof s=="string"){const e=Number(s);if(Number.isFinite(e)&&s.trim()!=="")return e>1e12?e:e*1e3;const t=Date.parse(s);if(!Number.isNaN(t))return t}return null}statusRank(s){return s==="ACTIVE"?0:s==="IDLE"?1:2}elapsedLabel(s){if(!s.sinceMs)return"--:--";const e=Math.max(0,Math.floor((this.nowMs-s.sinceMs)/1e3)),t=Math.floor(e/60),r=e%60;return`${t.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`}syncLabel(){if(this.error)return"OFFLINE";if(!this.lastSyncMs)return this.hasLiveData?"LIVE":"CACHED";const s=Math.max(0,Math.floor((this.nowMs-this.lastSyncMs)/1e3));return s<8?"LIVE":`${s}s ago`}render(){return c`
      <div class="sec-header">
        <span class="sec-label">agent_mesh</span>
        <div class="sec-line"></div>
        <span class="sync ${this.hasLiveData&&!this.error?"live":""}">LAST SYNC ${this.syncLabel()}</span>
      </div>

      ${this.loading?c`<div class="status-line">[ initializing agent mesh... ]</div>`:this.error?c`<div class="status-line error">[ agent mesh offline ]</div>`:c``}

      <div class="grid">
        ${this.nodes.map(s=>{const e=s.status==="ACTIVE"?"active":s.status==="DONE"?"done":"";return c`
            <article class="node ${s.status==="ACTIVE"?"active":""}">
              <div class="node-head">
                <span class="agent-id">${s.id}</span>
                <span class="agent-role">${s.role}</span>
              </div>
              <div class="node-meta">
                <span class="node-status ${e}">
                  <span class="dot ${s.status==="ACTIVE"?"pulse":""}" aria-hidden="true"></span>
                  ${s.status}
                </span>
                <span class="elapsed">${this.elapsedLabel(s)}</span>
              </div>
              <div class="task">> ${s.task}</div>
            </article>
          `})}
      </div>
    `}};v.styles=D`
    :host {
      display: block;
      margin-bottom: 64px;
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
      --accent: #c8f542;
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
    .sync {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--muted, #6b6b78);
      min-width: 62px;
      text-align: right;
    }
    .sync.live {
      color: var(--accent, #c8f542);
    }
    .status-line {
      margin-bottom: 14px;
      font-size: 12px;
      color: var(--accent, #c8f542);
      letter-spacing: 0.08em;
      text-transform: lowercase;
    }
    .status-line.error {
      color: var(--muted, #6b6b78);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1px;
      background: var(--border, #1e1e22);
      border: 1px solid var(--border, #1e1e22);
    }
    .node {
      min-height: 80px;
      padding: 12px;
      background: var(--bg, #070708);
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid transparent;
      transition: background 0.12s ease;
    }
    .node:hover {
      background: var(--surface, #0e0e10);
    }
    .node.active {
      border-color: color-mix(in srgb, var(--accent, #c8f542) 22%, transparent);
      box-shadow: 0 0 12px rgba(200, 245, 66, 0.15);
    }
    .node-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .agent-id {
      color: var(--bright, #f0f0f8);
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.02em;
    }
    .agent-role {
      color: var(--muted, #6b6b78);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .node-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .node-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted, #6b6b78);
    }
    .node-status.active {
      color: var(--accent, #c8f542);
    }
    .node-status.done {
      color: var(--text, #d4d4dc);
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.9;
    }
    .dot.pulse {
      animation: pulse 1.15s ease-in-out infinite;
      box-shadow: 0 0 8px currentColor;
    }
    .elapsed {
      color: var(--muted, #6b6b78);
      font-size: 9px;
    }
    .task {
      color: var(--muted, #6b6b78);
      font-size: 11px;
      line-height: 1.35;
      word-break: break-word;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot.pulse {
        animation: none;
      }
    }
  `;A([m({type:Object})],v.prototype,"team",2);A([f()],v.prototype,"nodes",2);A([f()],v.prototype,"loading",2);A([f()],v.prototype,"error",2);A([f()],v.prototype,"hasLiveData",2);A([f()],v.prototype,"lastSyncMs",2);A([f()],v.prototype,"nowMs",2);v=A([z("clanka-agents")],v);var vt=Object.defineProperty,bt=Object.getOwnPropertyDescriptor,ae=(s,e,t,r)=>{for(var i=r>1?void 0:r?bt(e,t):e,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&vt(e,t,i),i};let N=class extends g{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(s){const e=(s??"todo").toLowerCase();return["todo","doing","done"].includes(e)?e:"todo"}render(){return c`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?c`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:3}).map(()=>c`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?c`<div class="fallback">${this.error}</div>`:this.tasks.length===0?c`<div class="fallback">[ no tasks ]</div>`:c`
                <div class="grid" role="list">
                  ${this.tasks.map(s=>c`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${this.normalizeStatus(s.status)}">${(s.status??"TODO").toString()}</div>
                        <div class="task-title">${(s.title??"untitled").toString()}</div>
                        <div class="task-meta">
                          <span>@${(s.assignee??"unassigned").toString()}</span>
                          <span>P${(s.priority??"?").toString()}</span>
                        </div>
                      </article>
                    `)}
                </div>
              `}
    `}};N.styles=D`
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
      min-height: 92px;
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
    .fallback {
      font-size: 12px;
      color: var(--muted, #6b6b78);
      border: 1px solid var(--border, #1e1e22);
      background: var(--surface, #0e0e10);
      padding: 12px 16px;
    }
    .loading {
      color: var(--accent, #c8f542);
      animation: blink 1s steps(2, start) infinite;
    }
    .skeleton {
      height: 11px;
      border-radius: 2px;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 0%,
        color-mix(in srgb, var(--surface, #0e0e10) 70%, var(--accent, #c8f542) 30%) 50%,
        color-mix(in srgb, var(--surface, #0e0e10) 88%, var(--border, #1e1e22) 12%) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.8s linear infinite;
    }
    .skeleton.status { width: 88px; margin-bottom: 8px; }
    .skeleton.title { width: 75%; margin-bottom: 10px; }
    .skeleton.meta { width: 60%; }
    :host(:focus-visible) {
      outline: 1px solid var(--accent, #c8f542);
      outline-offset: 4px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.4; }
    }
  `;ae([m({type:Array})],N.prototype,"tasks",2);ae([m({type:Boolean})],N.prototype,"loading",2);ae([m({type:String})],N.prototype,"error",2);N=ae([z("clanka-tasks")],N);const X=document.getElementById("presence"),B=document.getElementById("activity"),P=document.getElementById("terminal"),ke=document.getElementById("agents"),V=document.getElementById("tasks"),ee=({loading:s,error:e})=>{B&&(B.loading=s,B.error=e||""),P&&(P.loading=s,P.error=e||""),V&&(V.loading=s,V.error=e||"")};ee({loading:!0,error:""});X&&(X.addEventListener("sync-state",s=>{const t=s.detail||{loading:!1,error:"[ api unreachable ]"};ee(t)}),X.addEventListener("sync-updated",s=>{const t=s.detail||{};B&&(B.history=t.history||[]),P&&(P.team=t.team||{},P.recentActivity=t.history||[]),ke&&(ke.team=t.team||{}),V&&(V.tasks=t.tasks||[]),ee({loading:!1,error:""})}),X.addEventListener("sync-error",s=>{const t=s.detail?.error||"[ api unreachable ]";ee({loading:!1,error:t})}));(()=>{const s=document.querySelectorAll("main section");if(!s.length)return;const e=new IntersectionObserver(t=>{t.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08,rootMargin:"0px 0px -8% 0px"});s.forEach(t=>{t.classList.add("section-reveal"),e.observe(t)})})();(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const s=document.querySelector(".hero-statement"),e=document.querySelector(".cursor");if(!s)return;const t="I orchestrate agent fleets.<br><em>Cyber-Lobster mode.</em>",[,r="",i=""]=t.match(/^(.*?)<br><em>(.*?)<\/em>$/)||[],a="<br><em>",n="</em>",l=40,o=d=>d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");if(!r||!i)return;s.innerHTML="";const p=(d=0)=>{if(d>r.length){window.setTimeout(()=>h(0),200);return}s.innerHTML=o(r.slice(0,d)),window.setTimeout(()=>p(d+1),l)},h=(d=0)=>{if(d>i.length){s.innerHTML=o(r)+a+o(i)+n,e&&window.setTimeout(()=>{e.style.opacity="0",e.style.pointerEvents="none"},2e3);return}s.innerHTML=o(r)+a+o(i.slice(0,d)),window.setTimeout(()=>h(d+1),l)};p(0)})();
