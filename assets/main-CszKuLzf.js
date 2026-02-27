(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function s(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(i){if(i.ep)return;i.ep=!0;const n=s(i);fetch(i.href,n)}})();function Me(){(()=>{const t=document.getElementById("scrollProgress");if(!t)return;const e=()=>{const s=document.documentElement.scrollHeight-window.innerHeight;t.style.width=s>0?window.scrollY/s*100+"%":"0%"};window.addEventListener("scroll",e,{passive:!0}),e()})(),(()=>{const t=document.querySelector('[aria-labelledby="work-label"]');if(!t)return;const e=t.querySelectorAll(".row"),s=new IntersectionObserver(r=>{r.forEach(i=>{i.isIntersecting&&(i.target.classList.add("row-stagger"),s.unobserve(i.target))})},{threshold:.1});e.forEach((r,i)=>{r.style.animationDelay=`${i*.06}s`,r.style.opacity="0",s.observe(r)})})(),(()=>{const t=document.getElementById("status-date");if(!t)return;const e=new Date,s=r=>String(r).padStart(2,"0");t.textContent=`${e.getFullYear()}-${s(e.getMonth()+1)}-${s(e.getDate())}`})(),(()=>{const t=document.getElementById("tw-text"),e=document.getElementById("tw-em"),s=document.getElementById("tw-cursor");if(!t||!e||!s)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.textContent="I build systems",e.style.visibility="visible",s.classList.add("cursor--animate");return}const r="I build systems";s.style.animation="none",s.style.opacity="1";let i=0;function n(){i<=r.length&&(t.textContent=r.slice(0,i),i++,i<=r.length?setTimeout(n,40):(e.style.visibility="visible",e.style.opacity="0",setTimeout(()=>{e.style.opacity="1"},60),setTimeout(()=>{s.style.animation="cursorBlink 0.5s steps(2, start) 2",s.addEventListener("animationend",()=>{s.style.animation="none",s.style.opacity="1"},{once:!0})},400)))}setTimeout(n,180)})(),(()=>{const t=document.getElementById("scroll-top");t&&(window.addEventListener("scroll",()=>{t.classList.toggle("visible",window.scrollY>300)},{passive:!0}),t.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})))})(),(()=>{const t=document.querySelectorAll(".section-reveal");if(!t.length)return;const e=new IntersectionObserver(s=>{s.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08});t.forEach(s=>e.observe(s))})()}const ee=globalThis,de=ee.ShadowRoot&&(ee.ShadyCSS===void 0||ee.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,pe=Symbol(),fe=new WeakMap;let Se=class{constructor(e,s,r){if(this._$cssResult$=!0,r!==pe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=s}get styleSheet(){let e=this.o;const s=this.t;if(de&&e===void 0){const r=s!==void 0&&s.length===1;r&&(e=fe.get(s)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&fe.set(s,e))}return e}toString(){return this.cssText}};const ze=t=>new Se(typeof t=="string"?t:t+"",void 0,pe),I=(t,...e)=>{const s=t.length===1?t[0]:e.reduce((r,i,n)=>r+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new Se(s,t,pe)},De=(t,e)=>{if(de)t.adoptedStyleSheets=e.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of e){const r=document.createElement("style"),i=ee.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=s.cssText,t.appendChild(r)}},me=de?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let s="";for(const r of e.cssRules)s+=r.cssText;return ze(s)})(t):t;const{is:Ne,defineProperty:Ue,getOwnPropertyDescriptor:Re,getOwnPropertyNames:je,getOwnPropertySymbols:He,getPrototypeOf:qe}=Object,$=globalThis,ge=$.trustedTypes,Be=ge?ge.emptyScript:"",Ve=$.reactiveElementPolyfillSupport,j=(t,e)=>t,se={toAttribute(t,e){switch(e){case Boolean:t=t?Be:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=t!==null;break;case Number:s=t===null?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch{s=null}}return s}},he=(t,e)=>!Ne(t,e),ve={attribute:!0,type:String,converter:se,reflect:!1,useDefault:!1,hasChanged:he};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),$.litPropertyMetadata??($.litPropertyMetadata=new WeakMap);let P=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,s=ve){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(e,s),!s.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(e,r,s);i!==void 0&&Ue(this.prototype,e,i)}}static getPropertyDescriptor(e,s,r){const{get:i,set:n}=Re(this.prototype,e)??{get(){return this[s]},set(a){this[s]=a}};return{get:i,set(a){const l=i?.call(this);n?.call(this,a),this.requestUpdate(e,l,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ve}static _$Ei(){if(this.hasOwnProperty(j("elementProperties")))return;const e=qe(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(j("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(j("properties"))){const s=this.properties,r=[...je(s),...He(s)];for(const i of r)this.createProperty(i,s[i])}const e=this[Symbol.metadata];if(e!==null){const s=litPropertyMetadata.get(e);if(s!==void 0)for(const[r,i]of s)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[s,r]of this.elementProperties){const i=this._$Eu(s,r);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const s=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const i of r)s.unshift(me(i))}else e!==void 0&&s.push(me(e));return s}static _$Eu(e,s){const r=s.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,s=this.constructor.elementProperties;for(const r of s.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return De(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,s,r){this._$AK(e,r)}_$ET(e,s){const r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){const n=(r.converter?.toAttribute!==void 0?r.converter:se).toAttribute(s,r.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,s){const r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const n=r.getPropertyOptions(i),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:se;this._$Em=i;const l=a.fromAttribute(s,n.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,s,r,i=!1,n){if(e!==void 0){const a=this.constructor;if(i===!1&&(n=this[e]),r??(r=a.getPropertyOptions(e)),!((r.hasChanged??he)(n,s)||r.useDefault&&r.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,r))))return;this.C(e,s,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,s,{useDefault:r,reflect:i,wrapped:n},a){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??s??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(s=void 0),this._$AL.set(e,s)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[i,n]of r){const{wrapped:a}=n,l=this[i];a!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,n,l)}}let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(s)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(s)}willUpdate(e){}_$AE(e){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(s=>this._$ET(s,this[s]))),this._$EM()}updated(e){}firstUpdated(e){}};P.elementStyles=[],P.shadowRootOptions={mode:"open"},P[j("elementProperties")]=new Map,P[j("finalized")]=new Map,Ve?.({ReactiveElement:P}),($.reactiveElementVersions??($.reactiveElementVersions=[])).push("2.1.2");const H=globalThis,be=t=>t,re=H.trustedTypes,ye=re?re.createPolicy("lit-html",{createHTML:t=>t}):void 0,Ie="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,Oe="?"+x,Fe=`<${Oe}>`,E=document,F=()=>E.createComment(""),K=t=>t===null||typeof t!="object"&&typeof t!="function",ue=Array.isArray,Ke=t=>ue(t)||typeof t?.[Symbol.iterator]=="function",le=`[ 	
\f\r]`,R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,xe=/-->/g,$e=/>/g,_=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),we=/'/g,ke=/"/g,Pe=/^(?:script|style|textarea|title)$/i,We=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),c=We(1),L=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),_e=new WeakMap,A=E.createTreeWalker(E,129);function Te(t,e){if(!ue(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return ye!==void 0?ye.createHTML(e):e}const Ye=(t,e)=>{const s=t.length-1,r=[];let i,n=e===2?"<svg>":e===3?"<math>":"",a=R;for(let l=0;l<s;l++){const o=t[l];let p,h,d=-1,b=0;for(;b<o.length&&(a.lastIndex=b,h=a.exec(o),h!==null);)b=a.lastIndex,a===R?h[1]==="!--"?a=xe:h[1]!==void 0?a=$e:h[2]!==void 0?(Pe.test(h[2])&&(i=RegExp("</"+h[2],"g")),a=_):h[3]!==void 0&&(a=_):a===_?h[0]===">"?(a=i??R,d=-1):h[1]===void 0?d=-2:(d=a.lastIndex-h[2].length,p=h[1],a=h[3]===void 0?_:h[3]==='"'?ke:we):a===ke||a===we?a=_:a===xe||a===$e?a=R:(a=_,i=void 0);const y=a===_&&t[l+1].startsWith("/>")?" ":"";n+=a===R?o+Fe:d>=0?(r.push(p),o.slice(0,d)+Ie+o.slice(d)+x+y):o+x+(d===-2?l:y)}return[Te(t,n+(t[s]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]};class W{constructor({strings:e,_$litType$:s},r){let i;this.parts=[];let n=0,a=0;const l=e.length-1,o=this.parts,[p,h]=Ye(e,s);if(this.el=W.createElement(p,r),A.currentNode=this.el.content,s===2||s===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=A.nextNode())!==null&&o.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const d of i.getAttributeNames())if(d.endsWith(Ie)){const b=h[a++],y=i.getAttribute(d).split(x),J=/([.?@])?(.*)/.exec(b);o.push({type:1,index:n,name:J[2],strings:y,ctor:J[1]==="."?Xe:J[1]==="?"?Je:J[1]==="@"?Ze:ie}),i.removeAttribute(d)}else d.startsWith(x)&&(o.push({type:6,index:n}),i.removeAttribute(d));if(Pe.test(i.tagName)){const d=i.textContent.split(x),b=d.length-1;if(b>0){i.textContent=re?re.emptyScript:"";for(let y=0;y<b;y++)i.append(d[y],F()),A.nextNode(),o.push({type:2,index:++n});i.append(d[b],F())}}}else if(i.nodeType===8)if(i.data===Oe)o.push({type:2,index:n});else{let d=-1;for(;(d=i.data.indexOf(x,d+1))!==-1;)o.push({type:7,index:n}),d+=x.length-1}n++}}static createElement(e,s){const r=E.createElement("template");return r.innerHTML=e,r}}function M(t,e,s=t,r){if(e===L)return e;let i=r!==void 0?s._$Co?.[r]:s._$Cl;const n=K(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(t),i._$AT(t,s,r)),r!==void 0?(s._$Co??(s._$Co=[]))[r]=i:s._$Cl=i),i!==void 0&&(e=M(t,i._$AS(t,e.values),i,r)),e}class Ge{constructor(e,s){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:s},parts:r}=this._$AD,i=(e?.creationScope??E).importNode(s,!0);A.currentNode=i;let n=A.nextNode(),a=0,l=0,o=r[0];for(;o!==void 0;){if(a===o.index){let p;o.type===2?p=new Y(n,n.nextSibling,this,e):o.type===1?p=new o.ctor(n,o.name,o.strings,this,e):o.type===6&&(p=new Qe(n,this,e)),this._$AV.push(p),o=r[++l]}a!==o?.index&&(n=A.nextNode(),a++)}return A.currentNode=E,i}p(e){let s=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,s),s+=r.strings.length-2):r._$AI(e[s])),s++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,s,r,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=e,this._$AB=s,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&e?.nodeType===11&&(e=s.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,s=this){e=M(this,e,s),K(e)?e===u||e==null||e===""?(this._$AH!==u&&this._$AR(),this._$AH=u):e!==this._$AH&&e!==L&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ke(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==u&&K(this._$AH)?this._$AA.nextSibling.data=e:this.T(E.createTextNode(e)),this._$AH=e}$(e){const{values:s,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=W.createElement(Te(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(s);else{const n=new Ge(i,this),a=n.u(this.options);n.p(s),this.T(a),this._$AH=n}}_$AC(e){let s=_e.get(e.strings);return s===void 0&&_e.set(e.strings,s=new W(e)),s}k(e){ue(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let r,i=0;for(const n of e)i===s.length?s.push(r=new Y(this.O(F()),this.O(F()),this,this.options)):r=s[i],r._$AI(n),i++;i<s.length&&(this._$AR(r&&r._$AB.nextSibling,i),s.length=i)}_$AR(e=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);e!==this._$AB;){const r=be(e).nextSibling;be(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class ie{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,s,r,i,n){this.type=1,this._$AH=u,this._$AN=void 0,this.element=e,this.name=s,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=u}_$AI(e,s=this,r,i){const n=this.strings;let a=!1;if(n===void 0)e=M(this,e,s,0),a=!K(e)||e!==this._$AH&&e!==L,a&&(this._$AH=e);else{const l=e;let o,p;for(e=n[0],o=0;o<n.length-1;o++)p=M(this,l[r+o],s,o),p===L&&(p=this._$AH[o]),a||(a=!K(p)||p!==this._$AH[o]),p===u?e=u:e!==u&&(e+=(p??"")+n[o+1]),this._$AH[o]=p}a&&!i&&this.j(e)}j(e){e===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Xe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===u?void 0:e}}class Je extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==u)}}class Ze extends ie{constructor(e,s,r,i,n){super(e,s,r,i,n),this.type=5}_$AI(e,s=this){if((e=M(this,e,s,0)??u)===L)return;const r=this._$AH,i=e===u&&r!==u||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==u&&(r===u||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Qe{constructor(e,s,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=s,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){M(this,e)}}const et=H.litHtmlPolyfillSupport;et?.(W,Y),(H.litHtmlVersions??(H.litHtmlVersions=[])).push("3.3.2");const tt=(t,e,s)=>{const r=s?.renderBefore??e;let i=r._$litPart$;if(i===void 0){const n=s?.renderBefore??null;r._$litPart$=i=new Y(e.insertBefore(F(),n),n,void 0,s??{})}return i._$AI(t),i};const q=globalThis;class g extends P{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var s;const e=super.createRenderRoot();return(s=this.renderOptions).renderBefore??(s.renderBefore=e.firstChild),e}update(e){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=tt(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return L}}g._$litElement$=!0,g.finalized=!0,q.litElementHydrateSupport?.({LitElement:g});const st=q.litElementPolyfillSupport;st?.({LitElement:g});(q.litElementVersions??(q.litElementVersions=[])).push("4.2.2");const O=t=>(e,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)};const rt={attribute:!0,type:String,converter:se,reflect:!1,hasChanged:he},it=(t=rt,e,s)=>{const{kind:r,metadata:i}=s;let n=globalThis.litPropertyMetadata.get(i);if(n===void 0&&globalThis.litPropertyMetadata.set(i,n=new Map),r==="setter"&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),r==="accessor"){const{name:a}=s;return{set(l){const o=e.get.call(this);e.set.call(this,l),this.requestUpdate(a,o,t,!0,l)},init(l){return l!==void 0&&this.C(a,void 0,t,l),l}}}if(r==="setter"){const{name:a}=s;return function(l){const o=this[a];e.call(this,l),this.requestUpdate(a,o,t,!0,l)}}throw Error("Unsupported decorator location: "+r)};function m(t){return(e,s)=>typeof s=="object"?it(t,e,s):((r,i,n)=>{const a=i.hasOwnProperty(n);return i.constructor.createProperty(n,r),a?Object.getOwnPropertyDescriptor(i,n):void 0})(t,e,s)}function f(t){return m({...t,state:!0,attribute:!1})}const nt="https://clanka-api.clankamode.workers.dev",at=15e3,Ae=new Map,ce=new Map;function ot(t){return`${nt}${t}`}async function Le(t,e=at){const s=ot(t),r=Ae.get(s),i=Date.now();if(r&&r.expiresAt>i)return r.data;const n=ce.get(s);if(n)return n;const a=(async()=>{const l=await fetch(s,{headers:{Accept:"application/json"}});if(!l.ok)throw new Error(`API ${l.status}`);const o=await l.json();return Ae.set(s,{data:o,expiresAt:Date.now()+e}),o})();ce.set(s,a);try{return await a}finally{ce.delete(s)}}function lt(){return Le("/now")}function ct(){return Le("/fleet/summary")}var dt=Object.defineProperty,pt=Object.getOwnPropertyDescriptor,U=(t,e,s,r)=>{for(var i=r>1?void 0:r?pt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&dt(e,s,i),i};let w=class extends g{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const t=await lt();this.current=typeof t.current=="string"?t.current:"active",this.status=typeof t.status=="string"?t.status:"operational",this.history=Array.isArray(t.history)?t.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:t}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const t=this.status.toLowerCase();return c`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${t==="thinking"?"thinking":""}" style=${t==="offline"?"opacity:.4":""}></span>
          ${this.loading?"SYNCING":this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading?c`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`:this.error?c`<span class="error"> ${this.error}</span>`:c` ${this.current}`}
      </div>
    `}};w.styles=I`
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
  `;U([f()],w.prototype,"current",2);U([f()],w.prototype,"status",2);U([f()],w.prototype,"history",2);U([f()],w.prototype,"loading",2);U([f()],w.prototype,"error",2);w=U([O("clanka-presence")],w);var ht=Object.defineProperty,ut=Object.getOwnPropertyDescriptor,ne=(t,e,s,r)=>{for(var i=r>1?void 0:r?ut(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&ht(e,s,i),i};let z=class extends g{constructor(){super(...arguments),this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.hasAttribute("tabindex")||(this.tabIndex=0)}formatDate(t){if(t===void 0)return"--";const e=new Date(t);return Number.isNaN(e.getTime())?"--":e.toLocaleDateString()}render(){return c`
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
          `:this.error?c`<div class="status-fallback">${this.error}</div>`:this.history.length===0?c`<div class="status-fallback">[ no activity ]</div>`:this.history.map(t=>c`
                  <div class="row" role="listitem">
                    <span class="row-name">[${(t.type??"event").toString()}] ${(t.desc??"update").toString()}</span>
                    <span class="row-meta">${this.formatDate(t.timestamp)}</span>
                  </div>
                `)}
    `}};z.styles=I`
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
  `;ne([m({type:Array})],z.prototype,"history",2);ne([m({type:Boolean})],z.prototype,"loading",2);ne([m({type:String})],z.prototype,"error",2);z=ne([O("clanka-activity")],z);var ft=Object.defineProperty,mt=Object.getOwnPropertyDescriptor,G=(t,e,s,r)=>{for(var i=r>1?void 0:r?mt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&ft(e,s,i),i};const Z=["ops","infra","core","quality","policy","template"];let C=class extends g{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const t=await ct(),e=this.extractRepos(t);if(!e.length)throw new Error("No fleet repos in payload");this.repos=e,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(t){const e=this.pickRepoArray(t);return e.length?e.map(s=>this.normalizeRepo(s)).filter(s=>s!==null).sort((s,r)=>{const i=Z.indexOf(s.tier)-Z.indexOf(r.tier);return i!==0?i:s.repo.localeCompare(r.repo)}):[]}pickRepoArray(t){if(!t||typeof t!="object")return[];const e=t;if(Array.isArray(e.repos))return e.repos;if(Array.isArray(e.fleet))return e.fleet;if(e.summary&&typeof e.summary=="object"){const s=e.summary;if(Array.isArray(s.repos))return s.repos;if(Array.isArray(s.fleet))return s.fleet}return[]}readOnlineState(t){if(typeof t.online=="boolean")return t.online;const e=String(t.status??t.state??"").trim().toLowerCase();return e?["offline","down","error","failed","degraded"].includes(e)?!1:(["online","up","ok","healthy","active"].includes(e),!0):!0}normalizeRepo(t){if(!t||typeof t!="object")return null;const e=t,s=String(e.repo??e.name??e.full_name??"").trim(),r=String(e.tier??"").trim().toLowerCase(),i=String(e.criticality??e.priority??"").trim().toLowerCase(),n=this.readOnlineState(e);return!s||!Z.includes(r)?null:["critical","high","medium"].includes(i)?{repo:s,tier:r,criticality:i,online:n}:{repo:s,tier:r,criticality:"medium",online:n}}shortName(t){return t.replace(/^clankamode\//,"")}render(){const t=Z.map(e=>({tier:e,repos:this.repos.filter(s=>s.tier===e)})).filter(e=>e.repos.length>0);return c`
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
          `:this.error?c`<div class="fallback">${this.error}</div>`:t.map(e=>c`
                <div class="tier-group">
                  <div class="tier-title">${e.tier}</div>
                  <div class="grid" role="list">
                    ${e.repos.map(s=>c`
                        <article class="card" role="listitem">
                          <div class="card-head">
                            <span class="repo">${this.shortName(s.repo)}</span>
                            <span class="status-pill ${s.online?"online":"offline"}">
                              ${s.online?"● online":"○ offline"}
                            </span>
                          </div>
                          <div class="tier-badge">${s.tier}</div>
                          <div class="criticality"><span class="dot ${s.criticality}" aria-hidden="true"></span>${s.criticality}</div>
                        </article>
                      `)}
                  </div>
                </div>
              `)}
    `}};C.styles=I`
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
  `;G([f()],C.prototype,"repos",2);G([f()],C.prototype,"live",2);G([f()],C.prototype,"loading",2);G([f()],C.prototype,"error",2);C=G([O("clanka-fleet")],C);var gt=Object.defineProperty,vt=Object.getOwnPropertyDescriptor,X=(t,e,s,r)=>{for(var i=r>1?void 0:r?vt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&gt(e,s,i),i};let S=class extends g{constructor(){super(...arguments),this.team={},this.recentActivity=[],this.loading=!0,this.error="",this.roles={orchestrator:"CLANKA",architect:"ARCHITECT",engineer:"ENGINEER",auditor:"AUDITOR",chronicler:"CHRONICLER"}}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Terminal readout"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(t){const e=(t??"idle").toLowerCase();return e==="active"?"active":e==="offline"?"offline":"idle"}traceLines(){return this.recentActivity.length?this.recentActivity.slice(0,3).map(t=>{const e=t?.timestamp??Date.now(),s=new Date(e),r=Number.isNaN(s.getTime())?"--:--:--":s.toLocaleTimeString([],{hour12:!1}),i=(t.desc??t.type??"event").toString();return`${r} ${i}`}):["boot: no recent activity records"]}renderTeamLines(){return Object.entries(this.roles).map(([t,e])=>{const s=this.team[t]??{status:"idle",task:"waiting_for_directive"},r=this.normalizeStatus(s.status),i=r==="active"?"[online]":r==="offline"?"[offline]":"[idle]",n=(s.task??"waiting_for_directive").toString();return c`<div class="line">${i} ${e.padEnd(11," ")} :: ${n}</div>`})}render(){return c`
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
                ${this.traceLines().map(t=>c`<div class="line dim">${t}</div>`)}
                <div class="line prompt">clanka@fleet:~$<span class="cursor" aria-hidden="true"></span></div>
              `}
      </div>
    `}};S.styles=I`
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
  `;X([m({type:Object})],S.prototype,"team",2);X([m({type:Array})],S.prototype,"recentActivity",2);X([m({type:Boolean})],S.prototype,"loading",2);X([m({type:String})],S.prototype,"error",2);S=X([O("clanka-terminal")],S);var bt=Object.defineProperty,yt=Object.getOwnPropertyDescriptor,k=(t,e,s,r)=>{for(var i=r>1?void 0:r?yt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&bt(e,s,i),i};const Ee=[{id:"ag-01",role:"CODEx",status:"ACTIVE",task:"analyzing PR diff in clanka-tools",sinceMs:Date.now()-42e3},{id:"ag-02",role:"CLAUDE",status:"IDLE",task:"waiting on deploy verification"},{id:"ag-03",role:"OPS",status:"DONE",task:"patching fleet config for edge failover",sinceMs:Date.now()-128e3},{id:"ag-04",role:"SCRIBE",status:"ACTIVE",task:"writing post 006: incident loops",sinceMs:Date.now()-17e3}];let v=class extends g{constructor(){super(...arguments),this.team={},this.nodes=[],this.loading=!0,this.error=!1,this.hasLiveData=!1,this.lastSyncMs=null,this.nowMs=Date.now()}connectedCallback(){super.connectedCallback(),this.tickId=window.setInterval(()=>{this.nowMs=Date.now()},1e3)}disconnectedCallback(){this.tickId&&window.clearInterval(this.tickId),super.disconnectedCallback()}async firstUpdated(){await this.fetchTeam()}updated(t){t.has("team")&&this.applyTeam(this.team,!0)}async fetchTeam(){this.loading=!0,this.error=!1;try{const t=await fetch("https://clanka-api.clankamode.workers.dev/now",{headers:{Accept:"application/json"}});if(!t.ok)throw new Error(`Agent fetch failed: ${t.status}`);const e=await t.json();this.applyTeam(this.extractTeam(e),!0)}catch(t){console.error("agent mesh fetch failed",t),this.error=!0,this.loading=!1,this.hasLiveData=!1,this.nodes=Ee}}extractTeam(t){const e=t.team;return e&&typeof e=="object"&&!Array.isArray(e)?e:{}}applyTeam(t,e){const s=this.normalizeTeam(t);if(s.length>0){this.nodes=s,this.hasLiveData=!0,this.error=!1,this.loading=!1,e&&(this.lastSyncMs=Date.now());return}this.hasLiveData=!1,this.loading=!1,this.nodes=Ee}normalizeTeam(t){return Object.entries(t).map(([e,s])=>this.normalizeAgent(e,s)).filter(e=>e!==null).sort((e,s)=>{const r=this.statusRank(e.status)-this.statusRank(s.status);return r!==0?r:e.id.localeCompare(s.id)})}normalizeAgent(t,e){if(!e||typeof e!="object")return null;const s=e,r=String(s.id??t).trim();if(!r)return null;const i=String(s.role??t).trim().toUpperCase(),n=String(s.task??s.currentTask??s.current_task??s.activity??"awaiting_task").trim(),a=this.normalizeStatus(s.status),l=this.parseTime(s.startedAt??s.started_at??s.since??s.updatedAt??s.updated_at);return{id:r,role:i,status:a,task:n||"awaiting_task",sinceMs:l??void 0}}normalizeStatus(t){const e=String(t??"").trim().toLowerCase();return["active","running","busy","working"].includes(e)?"ACTIVE":["done","completed","complete","success"].includes(e)?"DONE":"IDLE"}parseTime(t){if(typeof t=="number"&&Number.isFinite(t))return t>1e12?t:t*1e3;if(typeof t=="string"){const e=Number(t);if(Number.isFinite(e)&&t.trim()!=="")return e>1e12?e:e*1e3;const s=Date.parse(t);if(!Number.isNaN(s))return s}return null}statusRank(t){return t==="ACTIVE"?0:t==="IDLE"?1:2}elapsedLabel(t){if(!t.sinceMs)return"--:--";const e=Math.max(0,Math.floor((this.nowMs-t.sinceMs)/1e3)),s=Math.floor(e/60),r=e%60;return`${s.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`}syncLabel(){if(this.error)return"OFFLINE";if(!this.lastSyncMs)return this.hasLiveData?"LIVE":"CACHED";const t=Math.max(0,Math.floor((this.nowMs-this.lastSyncMs)/1e3));return t<8?"LIVE":`${t}s ago`}render(){return c`
      <div class="sec-header">
        <span class="sec-label">agent_mesh</span>
        <div class="sec-line"></div>
        <span class="sync ${this.hasLiveData&&!this.error?"live":""}">LAST SYNC ${this.syncLabel()}</span>
      </div>

      ${this.loading?c`<div class="status-line">[ initializing agent mesh... ]</div>`:this.error?c`<div class="status-line error">[ agent mesh offline ]</div>`:c``}

      <div class="grid">
        ${this.nodes.map(t=>{const e=t.status==="ACTIVE"?"active":t.status==="DONE"?"done":"";return c`
            <article class="node ${t.status==="ACTIVE"?"active":""}">
              <div class="node-head">
                <span class="agent-id">${t.id}</span>
                <span class="agent-role">${t.role}</span>
              </div>
              <div class="node-meta">
                <span class="node-status ${e}">
                  <span class="dot ${t.status==="ACTIVE"?"pulse":""}" aria-hidden="true"></span>
                  ${t.status}
                </span>
                <span class="elapsed">${this.elapsedLabel(t)}</span>
              </div>
              <div class="task">> ${t.task}</div>
            </article>
          `})}
      </div>
    `}};v.styles=I`
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
  `;k([m({type:Object})],v.prototype,"team",2);k([f()],v.prototype,"nodes",2);k([f()],v.prototype,"loading",2);k([f()],v.prototype,"error",2);k([f()],v.prototype,"hasLiveData",2);k([f()],v.prototype,"lastSyncMs",2);k([f()],v.prototype,"nowMs",2);v=k([O("clanka-agents")],v);var xt=Object.defineProperty,$t=Object.getOwnPropertyDescriptor,ae=(t,e,s,r)=>{for(var i=r>1?void 0:r?$t(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&xt(e,s,i),i};let D=class extends g{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(t){const e=(t??"todo").toLowerCase();return["todo","doing","done"].includes(e)?e:"todo"}render(){return c`
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
                  ${this.tasks.map(t=>c`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${this.normalizeStatus(t.status)}">${(t.status??"TODO").toString()}</div>
                        <div class="task-title">${(t.title??"untitled").toString()}</div>
                        <div class="task-meta">
                          <span>@${(t.assignee??"unassigned").toString()}</span>
                          <span>P${(t.priority??"?").toString()}</span>
                        </div>
                      </article>
                    `)}
                </div>
              `}
    `}};D.styles=I`
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
  `;ae([m({type:Array})],D.prototype,"tasks",2);ae([m({type:Boolean})],D.prototype,"loading",2);ae([m({type:String})],D.prototype,"error",2);D=ae([O("clanka-tasks")],D);var wt=Object.defineProperty,kt=Object.getOwnPropertyDescriptor,oe=(t,e,s,r)=>{for(var i=r>1?void 0:r?kt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(i=(r?a(e,s,i):a(i))||i);return r&&i&&wt(e,s,i),i};let N=class extends g{constructor(){super(...arguments),this.open=!1,this.query="",this.activeIndex=0,this.items=[],this.handleGlobalKey=t=>{(t.metaKey||t.ctrlKey)&&t.key==="k"&&(t.preventDefault(),this.toggle()),t.key==="Escape"&&this.open&&this.close()}}connectedCallback(){super.connectedCallback(),this.buildItems(),window.addEventListener("keydown",this.handleGlobalKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this.handleGlobalKey)}toggle(){this.open=!this.open,this.open&&(this.query="",this.activeIndex=0,this.updateComplete.then(()=>{this.shadowRoot?.querySelector("input")?.focus()}))}close(){this.open=!1,this.query=""}buildItems(){const t=[];t.push({label:"Logs",hint:"blog posts",href:"#logs-label",section:"navigate"}),t.push({label:"Work",hint:"projects",href:"#work-label",section:"navigate"}),t.push({label:"About",hint:"bio",href:"#about-label",section:"navigate"}),t.push({label:"Capabilities",hint:"skills",href:"#cap-label",section:"navigate"}),document.querySelectorAll(".featured-log, .row a").forEach(e=>{const r=(e.tagName==="A",e).getAttribute("href");if(!r||!r.includes("/posts/"))return;const i=e.classList.contains("featured-log")?e.querySelector(".featured-title")?.textContent?.trim()||"":e.textContent?.trim()||"";i&&t.push({label:i,hint:"post",href:r,section:"logs"})}),t.push({label:"GitHub",hint:"github.com/clankamode",href:"https://github.com/clankamode",section:"links"}),t.push({label:"RSS Feed",hint:"subscribe",href:"/feed.xml",section:"links"}),this.items=t}get filtered(){if(!this.query)return this.items;const t=this.query.toLowerCase();return this.items.filter(e=>e.label.toLowerCase().includes(t)||e.hint.toLowerCase().includes(t)||e.section.toLowerCase().includes(t))}navigate(t){this.close(),t.href.startsWith("http")?window.open(t.href,"_blank","noopener,noreferrer"):t.href.startsWith("#")?document.getElementById(t.href.slice(1))?.scrollIntoView({behavior:"smooth"}):window.location.href=t.href}handleInput(t){this.query=t.target.value,this.activeIndex=0}handleKeydown(t){const e=this.filtered;t.key==="ArrowDown"?(t.preventDefault(),this.activeIndex=Math.min(this.activeIndex+1,e.length-1)):t.key==="ArrowUp"?(t.preventDefault(),this.activeIndex=Math.max(this.activeIndex-1,0)):t.key==="Enter"&&e[this.activeIndex]&&(t.preventDefault(),this.navigate(e[this.activeIndex]))}highlightMatch(t){if(!this.query)return t;const e=this.query.toLowerCase(),s=t.toLowerCase().indexOf(e);if(s===-1)return t;const r=t.slice(0,s),i=t.slice(s,s+this.query.length),n=t.slice(s+this.query.length);return c`${r}<mark>${i}</mark>${n}`}renderItems(){const t=this.filtered;if(!t.length)return c`<div class="empty">no results for "${this.query}"</div>`;const e=new Map;for(const i of t){const n=e.get(i.section)||[];n.push(i),e.set(i.section,n)}const s=[];let r=0;for(const[i,n]of e){s.push(c`<div class="section-label">${i}</div>`);for(const a of n){const l=r++;s.push(c`
          <div
            class="item ${l===this.activeIndex?"active":""}"
            @click=${()=>this.navigate(a)}
            @mouseenter=${()=>{this.activeIndex=l}}
          >
            <span class="item-label">${this.highlightMatch(a.label)}</span>
            <span class="item-hint">${a.hint}</span>
          </div>
        `)}}return s}render(){return this.open?c`
      <div class="backdrop" @click=${this.close}></div>
      <div class="palette" @keydown=${this.handleKeydown}>
        <div class="input-row">
          <span class="input-icon">❯</span>
          <input
            type="text"
            placeholder="navigate to..."
            .value=${this.query}
            @input=${this.handleInput}
            spellcheck="false"
            autocomplete="off"
          />
          <span class="kbd">esc</span>
        </div>
        <div class="results">${this.renderItems()}</div>
        <div class="footer">
          <span class="footer-key"><kbd>↑↓</kbd> navigate</span>
          <span class="footer-key"><kbd>↵</kbd> open</span>
          <span class="footer-key"><kbd>esc</kbd> close</span>
        </div>
      </div>
    `:c``}};N.styles=I`
    :host {
      --bg: #070708;
      --surface: #0e0e10;
      --border: #1e1e22;
      --dim: #3a3a42;
      --muted: #6b6b78;
      --text: #d4d4dc;
      --bright: #f0f0f8;
      --accent: #c8f542;
      --mono: 'Space Mono', 'IBM Plex Mono', monospace;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: fadeIn 0.12s ease-out;
    }

    .palette {
      position: fixed;
      top: min(20vh, 160px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: min(560px, calc(100vw - 32px));
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(200, 245, 66, 0.06);
      overflow: hidden;
      animation: slideIn 0.14s ease-out;
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }

    .input-icon {
      color: var(--accent);
      font-size: 14px;
      opacity: 0.7;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--bright);
      font-family: var(--mono);
      font-size: 14px;
      caret-color: var(--accent);
    }

    input::placeholder {
      color: var(--dim);
    }

    .kbd {
      font-size: 10px;
      color: var(--dim);
      border: 1px solid var(--border);
      padding: 2px 6px;
      flex-shrink: 0;
    }

    .results {
      max-height: 340px;
      overflow-y: auto;
      padding: 6px 0;
    }

    .results::-webkit-scrollbar { width: 4px; }
    .results::-webkit-scrollbar-track { background: var(--surface); }
    .results::-webkit-scrollbar-thumb { background: var(--border); }

    .section-label {
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--dim);
      padding: 10px 16px 4px;
    }

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      cursor: pointer;
      transition: background 0.08s ease;
    }

    .item:hover,
    .item.active {
      background: rgba(200, 245, 66, 0.06);
    }

    .item.active {
      border-left: 2px solid var(--accent);
      padding-left: 14px;
    }

    .item-label {
      color: var(--text);
      font-size: 13px;
    }

    .item.active .item-label {
      color: var(--bright);
    }

    .item-hint {
      color: var(--dim);
      font-size: 11px;
      flex-shrink: 0;
    }

    .empty {
      text-align: center;
      padding: 28px 16px;
      color: var(--dim);
      font-size: 12px;
    }

    .footer {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--dim);
    }

    .footer-key {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .footer-key kbd {
      font-size: 9px;
      border: 1px solid var(--border);
      padding: 1px 4px;
      font-family: var(--mono);
      color: var(--muted);
    }

    mark {
      background: none;
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
  `;oe([f()],N.prototype,"open",2);oe([f()],N.prototype,"query",2);oe([f()],N.prototype,"activeIndex",2);N=oe([O("clanka-cmdk")],N);const Q=document.getElementById("presence"),B=document.getElementById("activity"),T=document.getElementById("terminal"),Ce=document.getElementById("agents"),V=document.getElementById("tasks"),te=({loading:t,error:e})=>{B&&(B.loading=t,B.error=e||""),T&&(T.loading=t,T.error=e||""),V&&(V.loading=t,V.error=e||"")};te({loading:!0,error:""});Q&&(Q.addEventListener("sync-state",t=>{const s=t.detail||{loading:!1,error:"[ api unreachable ]"};te(s)}),Q.addEventListener("sync-updated",t=>{const s=t.detail||{};B&&(B.history=s.history||[]),T&&(T.team=s.team||{},T.recentActivity=s.history||[]),Ce&&(Ce.team=s.team||{}),V&&(V.tasks=s.tasks||[]),te({loading:!1,error:""})}),Q.addEventListener("sync-error",t=>{const s=t.detail?.error||"[ api unreachable ]";te({loading:!1,error:s})}));(()=>{const t=document.querySelectorAll("main section");if(!t.length)return;const e=new IntersectionObserver(s=>{s.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08,rootMargin:"0px 0px -8% 0px"});t.forEach(s=>{s.classList.add("section-reveal"),e.observe(s)})})();(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t=document.querySelector(".hero-statement"),e=document.querySelector(".cursor");if(!t)return;const s="I build systems<br><em>that outlast me.</em>",[,r="",i=""]=s.match(/^(.*?)<br><em>(.*?)<\/em>$/)||[],n="<br><em>",a="</em>",l=40,o=d=>d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");if(!r||!i)return;t.innerHTML="";const p=(d=0)=>{if(d>r.length){window.setTimeout(()=>h(0),200);return}t.innerHTML=o(r.slice(0,d)),window.setTimeout(()=>p(d+1),l)},h=(d=0)=>{if(d>i.length){t.innerHTML=o(r)+n+o(i)+a,e&&window.setTimeout(()=>{e.style.opacity="0",e.style.pointerEvents="none"},2e3);return}t.innerHTML=o(r)+n+o(i.slice(0,d)),window.setTimeout(()=>h(d+1),l)};p(0)})();Me();
