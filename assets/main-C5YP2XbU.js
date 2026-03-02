(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();function He(){(()=>{const s=document.getElementById("scrollProgress");if(!s)return;const e=()=>{const t=document.documentElement.scrollHeight-window.innerHeight;s.style.width=t>0?window.scrollY/t*100+"%":"0%"};window.addEventListener("scroll",e,{passive:!0}),e()})(),(()=>{const s=document.querySelector('[aria-labelledby="work-label"]');if(!s)return;const e=s.querySelectorAll(".row"),t=new IntersectionObserver(r=>{r.forEach(i=>{i.isIntersecting&&(i.target.classList.add("row-stagger"),t.unobserve(i.target))})},{threshold:.1});e.forEach((r,i)=>{r.style.animationDelay=`${i*.06}s`,r.style.opacity="0",t.observe(r)})})(),(()=>{const s=document.getElementById("status-date");if(!s)return;const e=new Date,t=r=>String(r).padStart(2,"0");s.textContent=`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`})(),(()=>{const s=document.getElementById("tw-text"),e=document.getElementById("tw-em"),t=document.getElementById("tw-cursor");if(!s||!e||!t)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){s.textContent="I build systems",e.style.visibility="visible",t.classList.add("cursor--animate");return}const r="I build systems";t.style.animation="none",t.style.opacity="1";let i=0;function o(){i<=r.length&&(s.textContent=r.slice(0,i),i++,i<=r.length?setTimeout(o,40):(e.style.visibility="visible",e.style.opacity="0",setTimeout(()=>{e.style.opacity="1"},60),setTimeout(()=>{t.style.animation="cursorBlink 0.5s steps(2, start) 2",t.addEventListener("animationend",()=>{t.style.animation="none",t.style.opacity="1"},{once:!0})},400)))}setTimeout(o,180)})(),(()=>{const s=document.getElementById("scroll-top");s&&(window.addEventListener("scroll",()=>{s.classList.toggle("visible",window.scrollY>300)},{passive:!0}),s.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})))})(),(()=>{const s=document.querySelectorAll(".section-reveal");if(!s.length)return;const e=new IntersectionObserver(t=>{t.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08});s.forEach(t=>e.observe(t))})()}const me="https://clanka-api.clankamode.workers.dev",Re=new Date("2026-02-19T00:00:00Z"),ge=5e3;function Be(s){const e=new Date(s).getTime(),t=Date.now()-e,r=Math.floor(t/1e3),i=Math.floor(r/60),o=Math.floor(i/60),n=Math.floor(o/24);return n>0?`${n}d ago`:o>0?`${o}h ago`:i>0?`${i}m ago`:"just now"}function qe(){const s=Date.now()-Re.getTime();return Math.floor(s/(1e3*60*60*24))}function z(s,e){const t=document.getElementById(s);t&&(t.textContent=e)}async function Fe(){z("stat-uptime",`// ${qe()}d online`);try{const s=new AbortController,e=window.setTimeout(()=>s.abort(),ge),t=await fetch(`${me}/github/stats`,{headers:{Accept:"application/json"},signal:s.signal});if(window.clearTimeout(e),!t.ok)throw new Error(`API ${t.status}`);const r=await t.json();z("stat-repos",`${r.repoCount} repos`),z("stat-stars",`${r.totalStars} stars`),z("stat-last-commit",`last push: ${Be(r.lastPushedAt)} (${r.lastPushedRepo})`);const i=new AbortController,o=window.setTimeout(()=>i.abort(),ge);try{const n=await fetch(`${me}/fleet/score`,{headers:{Accept:"application/json"},signal:i.signal});if(window.clearTimeout(o),!n.ok)throw new Error(`API ${n.status}`);const l=await n.json(),a=Number(l.score);Number.isFinite(a)&&z("stat-fleet-score",`fleet: ${Math.round(a)}%`)}catch{}finally{window.clearTimeout(o)}}catch{}}const We="https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager",Ke=5e3;async function Ve(){const s=document.getElementById("npm-ci-triage");if(!s)return;let e=0;try{const t=new AbortController;e=window.setTimeout(()=>t.abort(),Ke);const r=await fetch(We,{headers:{Accept:"application/json"},signal:t.signal});if(!r.ok)throw new Error(`NPM API ${r.status}`);const i=await r.json(),o=typeof i.downloads=="number"?i.downloads:null;if(o===null)throw new Error("Malformed downloads payload");s.textContent=`${o} dl/mo`}catch{}finally{window.clearTimeout(e)}}const Ye="https://clanka-api.clankamode.workers.dev/github/events",Ge=5e3,Te=["feat","fix","chore","docs","test","refactor","ci","build","style"];function Xe(s){const e=new Date(s).getTime(),t=Date.now()-e,r=Math.floor(t/1e3),i=Math.floor(r/60),o=Math.floor(i/60),n=Math.floor(o/24);return n>0?`${n}d ago`:o>0?`${o}h ago`:i>0?`${i}m ago`:"just now"}function Ze(s){return s.replace(/^clankamode\//,"")}function Je(s){const t=s.trim().toLowerCase().match(/^([a-z]+)/),r=t?t[1]:"";return Te.includes(r)?r:"push"}function Qe(s){return`${s} commit${s===1?"":"s"}`}function ve(s){const e=document.getElementById("commit-feed");if(!e)return;e.textContent="";const t=document.createElement("span");t.className="commit-feed-loading",t.textContent=s,e.append(t)}async function et(){const s=document.getElementById("commit-feed");if(s)try{const e=new AbortController,t=window.setTimeout(()=>e.abort(),Ge),r=await fetch(Ye,{headers:{Accept:"application/json"},signal:e.signal});if(window.clearTimeout(t),!r.ok)throw new Error(`GitHub events API ${r.status}`);const i=await r.json();if(!Array.isArray(i)||i.length===0){ve("// no activity data");return}s.textContent="",i.slice(0,8).forEach(o=>{const n=Ze(o.repo||"unknown"),l=Array.isArray(o.commits)?o.commits.length:0,a=Array.isArray(o.commits)&&o.commits.length>0?o.commits[0].message:"",p=Je(a),h=Te.includes(p)?p:"push",c=document.createElement("div");c.className="commit-item";const m=document.createElement("span");m.className="commit-repo",m.textContent=n;const g=document.createElement("span");g.className=`commit-tag commit-tag--${h}`,g.textContent=p;const b=document.createElement("span");b.className="commit-count",b.textContent=Qe(l);const ae=document.createElement("span");ae.className="commit-time",ae.textContent=o.pushedAt?Xe(o.pushedAt):"just now",c.append(m,g,b,ae),s.append(c)})}catch{ve("// no activity data")}}const Z=globalThis,pe=Z.ShadowRoot&&(Z.ShadyCSS===void 0||Z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,he=Symbol(),be=new WeakMap;let Oe=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==he)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(pe&&e===void 0){const r=t!==void 0&&t.length===1;r&&(e=be.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&be.set(t,e))}return e}toString(){return this.cssText}};const tt=s=>new Oe(typeof s=="string"?s:s+"",void 0,he),E=(s,...e)=>{const t=s.length===1?s[0]:e.reduce((r,i,o)=>r+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[o+1],s[0]);return new Oe(t,s,he)},st=(s,e)=>{if(pe)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const r=document.createElement("style"),i=Z.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},ye=pe?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(const r of e.cssRules)t+=r.cssText;return tt(t)})(s):s;const{is:rt,defineProperty:it,getOwnPropertyDescriptor:ot,getOwnPropertyNames:nt,getOwnPropertySymbols:at,getPrototypeOf:lt}=Object,x=globalThis,xe=x.trustedTypes,ct=xe?xe.emptyScript:"",dt=x.reactiveElementPolyfillSupport,j=(s,e)=>s,Q={toAttribute(s,e){switch(e){case Boolean:s=s?ct:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},ue=(s,e)=>!rt(s,e),$e={attribute:!0,type:String,converter:Q,reflect:!1,useDefault:!1,hasChanged:ue};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),x.litPropertyMetadata??(x.litPropertyMetadata=new WeakMap);let S=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=$e){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&it(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){const{get:i,set:o}=ot(this.prototype,e)??{get(){return this[t]},set(n){this[t]=n}};return{get:i,set(n){const l=i?.call(this);o?.call(this,n),this.requestUpdate(e,l,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??$e}static _$Ei(){if(this.hasOwnProperty(j("elementProperties")))return;const e=lt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(j("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(j("properties"))){const t=this.properties,r=[...nt(t),...at(t)];for(const i of r)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[t,r]of this.elementProperties){const i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const i of r)t.unshift(ye(i))}else e!==void 0&&t.push(ye(e));return t}static _$Eu(e,t){const r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return st(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){const r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){const o=(r.converter?.toAttribute!==void 0?r.converter:Q).toAttribute(t,r.type);this._$Em=e,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){const r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const o=r.getPropertyOptions(i),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:Q;this._$Em=i;const l=n.fromAttribute(t,o.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,t,r,i=!1,o){if(e!==void 0){const n=this.constructor;if(i===!1&&(o=this[e]),r??(r=n.getPropertyOptions(e)),!((r.hasChanged??ue)(o,t)||r.useDefault&&r.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:o},n){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,n??t??this[e]),o!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[i,o]of r){const{wrapped:n}=o,l=this[i];n!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,o,l)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};S.elementStyles=[],S.shadowRootOptions={mode:"open"},S[j("elementProperties")]=new Map,S[j("finalized")]=new Map,dt?.({ReactiveElement:S}),(x.reactiveElementVersions??(x.reactiveElementVersions=[])).push("2.1.2");const H=globalThis,we=s=>s,ee=H.trustedTypes,_e=ee?ee.createPolicy("lit-html",{createHTML:s=>s}):void 0,Me="$lit$",y=`lit$${Math.random().toFixed(9).slice(2)}$`,Le="?"+y,pt=`<${Le}>`,k=document,F=()=>k.createComment(""),W=s=>s===null||typeof s!="object"&&typeof s!="function",fe=Array.isArray,ht=s=>fe(s)||typeof s?.[Symbol.iterator]=="function",le=`[ 	
\f\r]`,U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ke=/-->/g,Ae=/>/g,w=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ee=/'/g,Ce=/"/g,Ne=/^(?:script|style|textarea|title)$/i,ut=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),d=ut(1),I=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Se=new WeakMap,_=k.createTreeWalker(k,129);function De(s,e){if(!fe(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return _e!==void 0?_e.createHTML(e):e}const ft=(s,e)=>{const t=s.length-1,r=[];let i,o=e===2?"<svg>":e===3?"<math>":"",n=U;for(let l=0;l<t;l++){const a=s[l];let p,h,c=-1,m=0;for(;m<a.length&&(n.lastIndex=m,h=n.exec(a),h!==null);)m=n.lastIndex,n===U?h[1]==="!--"?n=ke:h[1]!==void 0?n=Ae:h[2]!==void 0?(Ne.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=w):h[3]!==void 0&&(n=w):n===w?h[0]===">"?(n=i??U,c=-1):h[1]===void 0?c=-2:(c=n.lastIndex-h[2].length,p=h[1],n=h[3]===void 0?w:h[3]==='"'?Ce:Ee):n===Ce||n===Ee?n=w:n===ke||n===Ae?n=U:(n=w,i=void 0);const g=n===w&&s[l+1].startsWith("/>")?" ":"";o+=n===U?a+pt:c>=0?(r.push(p),a.slice(0,c)+Me+a.slice(c)+y+g):a+y+(c===-2?l:g)}return[De(s,o+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]};class K{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let o=0,n=0;const l=e.length-1,a=this.parts,[p,h]=ft(e,t);if(this.el=K.createElement(p,r),_.currentNode=this.el.content,t===2||t===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(i=_.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const c of i.getAttributeNames())if(c.endsWith(Me)){const m=h[n++],g=i.getAttribute(c).split(y),b=/([.?@])?(.*)/.exec(m);a.push({type:1,index:o,name:b[2],strings:g,ctor:b[1]==="."?gt:b[1]==="?"?vt:b[1]==="@"?bt:te}),i.removeAttribute(c)}else c.startsWith(y)&&(a.push({type:6,index:o}),i.removeAttribute(c));if(Ne.test(i.tagName)){const c=i.textContent.split(y),m=c.length-1;if(m>0){i.textContent=ee?ee.emptyScript:"";for(let g=0;g<m;g++)i.append(c[g],F()),_.nextNode(),a.push({type:2,index:++o});i.append(c[m],F())}}}else if(i.nodeType===8)if(i.data===Le)a.push({type:2,index:o});else{let c=-1;for(;(c=i.data.indexOf(y,c+1))!==-1;)a.push({type:7,index:o}),c+=y.length-1}o++}}static createElement(e,t){const r=k.createElement("template");return r.innerHTML=e,r}}function T(s,e,t=s,r){if(e===I)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl;const o=W(e)?void 0:e._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??(t._$Co=[]))[r]=i:t._$Cl=i),i!==void 0&&(e=T(s,i._$AS(s,e.values),i,r)),e}class mt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??k).importNode(t,!0);_.currentNode=i;let o=_.nextNode(),n=0,l=0,a=r[0];for(;a!==void 0;){if(n===a.index){let p;a.type===2?p=new V(o,o.nextSibling,this,e):a.type===1?p=new a.ctor(o,a.name,a.strings,this,e):a.type===6&&(p=new yt(o,this,e)),this._$AV.push(p),a=r[++l]}n!==a?.index&&(o=_.nextNode(),n++)}return _.currentNode=k,i}p(e){let t=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}}class V{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=T(this,e,t),W(e)?e===u||e==null||e===""?(this._$AH!==u&&this._$AR(),this._$AH=u):e!==this._$AH&&e!==I&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ht(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==u&&W(this._$AH)?this._$AA.nextSibling.data=e:this.T(k.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=K.createElement(De(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{const o=new mt(i,this),n=o.u(this.options);o.p(t),this.T(n),this._$AH=o}}_$AC(e){let t=Se.get(e.strings);return t===void 0&&Se.set(e.strings,t=new K(e)),t}k(e){fe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let r,i=0;for(const o of e)i===t.length?t.push(r=new V(this.O(F()),this.O(F()),this,this.options)):r=t[i],r._$AI(o),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const r=we(e).nextSibling;we(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,o){this.type=1,this._$AH=u,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=u}_$AI(e,t=this,r,i){const o=this.strings;let n=!1;if(o===void 0)e=T(this,e,t,0),n=!W(e)||e!==this._$AH&&e!==I,n&&(this._$AH=e);else{const l=e;let a,p;for(e=o[0],a=0;a<o.length-1;a++)p=T(this,l[r+a],t,a),p===I&&(p=this._$AH[a]),n||(n=!W(p)||p!==this._$AH[a]),p===u?e=u:e!==u&&(e+=(p??"")+o[a+1]),this._$AH[a]=p}n&&!i&&this.j(e)}j(e){e===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class gt extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===u?void 0:e}}class vt extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==u)}}class bt extends te{constructor(e,t,r,i,o){super(e,t,r,i,o),this.type=5}_$AI(e,t=this){if((e=T(this,e,t,0)??u)===I)return;const r=this._$AH,i=e===u&&r!==u||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,o=e!==u&&(r===u||i);i&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class yt{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){T(this,e)}}const xt=H.litHtmlPolyfillSupport;xt?.(K,V),(H.litHtmlVersions??(H.litHtmlVersions=[])).push("3.3.2");const $t=(s,e,t)=>{const r=t?.renderBefore??e;let i=r._$litPart$;if(i===void 0){const o=t?.renderBefore??null;r._$litPart$=i=new V(e.insertBefore(F(),o),o,void 0,t??{})}return i._$AI(s),i};const R=globalThis;class v extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=$t(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return I}}v._$litElement$=!0,v.finalized=!0,R.litElementHydrateSupport?.({LitElement:v});const wt=R.litElementPolyfillSupport;wt?.({LitElement:v});(R.litElementVersions??(R.litElementVersions=[])).push("4.2.2");const C=s=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(s,e)}):customElements.define(s,e)};const _t={attribute:!0,type:String,converter:Q,reflect:!1,hasChanged:ue},kt=(s=_t,e,t)=>{const{kind:r,metadata:i}=t;let o=globalThis.litPropertyMetadata.get(i);if(o===void 0&&globalThis.litPropertyMetadata.set(i,o=new Map),r==="setter"&&((s=Object.create(s)).wrapped=!0),o.set(t.name,s),r==="accessor"){const{name:n}=t;return{set(l){const a=e.get.call(this);e.set.call(this,l),this.requestUpdate(n,a,s,!0,l)},init(l){return l!==void 0&&this.C(n,void 0,s,l),l}}}if(r==="setter"){const{name:n}=t;return function(l){const a=this[n];e.call(this,l),this.requestUpdate(n,a,s,!0,l)}}throw Error("Unsupported decorator location: "+r)};function se(s){return(e,t)=>typeof t=="object"?kt(s,e,t):((r,i,o)=>{const n=i.hasOwnProperty(o);return i.constructor.createProperty(o,r),n?Object.getOwnPropertyDescriptor(i,o):void 0})(s,e,t)}function f(s){return se({...s,state:!0,attribute:!1})}const At="https://clanka-api.clankamode.workers.dev",Et=15e3,Pe=new Map,ce=new Map;function Ct(s){return`${At}${s}`}async function ze(s,e=Et){const t=Ct(s),r=Pe.get(t),i=Date.now();if(r&&r.expiresAt>i)return r.data;const o=ce.get(t);if(o)return o;const n=(async()=>{const l=await fetch(t,{headers:{Accept:"application/json"}});if(!l.ok)throw new Error(`API ${l.status}`);const a=await l.json();return Pe.set(t,{data:a,expiresAt:Date.now()+e}),a})();ce.set(t,n);try{return await n}finally{ce.delete(t)}}function St(){return ze("/now")}function Pt(){return ze("/fleet/summary")}var It=Object.defineProperty,Tt=Object.getOwnPropertyDescriptor,D=(s,e,t,r)=>{for(var i=r>1?void 0:r?Tt(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&It(e,t,i),i};let $=class extends v{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const s=await St();this.current=typeof s.current=="string"?s.current:"active",this.status=typeof s.status=="string"?s.status:"operational",this.history=Array.isArray(s.history)?s.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:s}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const s=this.status.toLowerCase();return d`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${s==="thinking"?"thinking":""}" style=${s==="offline"?"opacity:.4":""}></span>
          ${this.loading?"SYNCING":this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading?d`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`:this.error?d`<span class="error"> ${this.error}</span>`:d` ${this.current}`}
      </div>
    `}};$.styles=E`
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
  `;D([f()],$.prototype,"current",2);D([f()],$.prototype,"status",2);D([f()],$.prototype,"history",2);D([f()],$.prototype,"loading",2);D([f()],$.prototype,"error",2);$=D([C("clanka-presence")],$);function Ue(s){const e=Date.now()-new Date(s).getTime();return e<6e4?"just now":e<36e5?`${Math.floor(e/6e4)}m ago`:e<864e5?`${Math.floor(e/36e5)}h ago`:`${Math.floor(e/864e5)}d ago`}const Ot="https://clanka-api.clankamode.workers.dev";async function je(){const s=new AbortController,e=setTimeout(()=>s.abort(),5e3);try{const t=await fetch(`${Ot}/github/events`,{signal:s.signal});return t.ok?(await t.json()).events??[]:[]}catch{return[]}finally{clearTimeout(e)}}var Mt=Object.defineProperty,Lt=Object.getOwnPropertyDescriptor,re=(s,e,t,r)=>{for(var i=r>1?void 0:r?Lt(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&Mt(e,t,i),i};let O=class extends v{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.loadData()}async loadData(){const s=await je();s.length===0?this.error="[ activity unavailable ]":this.events=s,this.loading=!1}render(){return d`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.loading?d`<div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>`:this.error?d`<div class="status-fallback">${this.error}</div>`:this.events.map(s=>d`
            <div class="row" role="listitem">
              <span class="row-name"><span class="tag">[${s.type}]</span> ${s.repo}: ${s.message}</span>
              <span class="row-meta">${Ue(s.timestamp)}</span>
            </div>
          `)}
    `}};O.styles=E`
    :host { display: block; margin-bottom: 64px; }
    .sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .sec-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted, #6b6b78); }
    .sec-line { flex: 1; height: 1px; background: var(--border, #1e1e22); }
    .row {
      display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 16px;
      padding: 12px 0; border-bottom: 1px solid var(--border, #1e1e22);
      border-left: 2px solid transparent;
      transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
    }
    .row:hover {
      border-left-color: var(--accent, #c8f542); transform: translateX(2px);
      background: color-mix(in srgb, var(--surface, #0e0e10) 84%, var(--accent, #c8f542) 16%);
      padding-left: 10px; padding-right: 10px; margin: 0 -10px;
    }
    .row-name { color: var(--text, #d4d4dc); font-size: 13px; }
    .row-meta { color: var(--dim, #3a3a42); font-size: 11px; text-align: right; }
    .tag { color: var(--accent, #c8f542); }
    .status-fallback { font-size: 12px; color: var(--muted, #6b6b78); padding: 12px 0; border-bottom: 1px solid var(--border, #1e1e22); }
    .loading-text { color: var(--accent, #c8f542); animation: blink 1s steps(2, start) infinite; }
    @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.4; } }
  `;re([f()],O.prototype,"events",2);re([f()],O.prototype,"loading",2);re([f()],O.prototype,"error",2);O=re([C("clanka-activity")],O);var Nt=Object.defineProperty,Dt=Object.getOwnPropertyDescriptor,Y=(s,e,t,r)=>{for(var i=r>1?void 0:r?Dt(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&Nt(e,t,i),i};const G=["ops","infra","core","quality","policy","template"];let A=class extends v{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const s=await Pt(),e=this.extractRepos(s);if(!e.length)throw new Error("No fleet repos in payload");this.repos=e,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(s){const e=this.pickRepoArray(s);return e.length?e.map(t=>this.normalizeRepo(t)).filter(t=>t!==null).sort((t,r)=>{const i=G.indexOf(t.tier)-G.indexOf(r.tier);return i!==0?i:t.repo.localeCompare(r.repo)}):[]}pickRepoArray(s){if(!s||typeof s!="object")return[];const e=s;if(Array.isArray(e.repos))return e.repos;if(Array.isArray(e.fleet))return e.fleet;if(e.summary&&typeof e.summary=="object"){const t=e.summary;if(Array.isArray(t.repos))return t.repos;if(Array.isArray(t.fleet))return t.fleet}return[]}readOnlineState(s){if(typeof s.online=="boolean")return s.online;const e=String(s.status??s.state??"").trim().toLowerCase();return e?["offline","down","error","failed","degraded"].includes(e)?!1:(["online","up","ok","healthy","active"].includes(e),!0):!0}normalizeRepo(s){if(!s||typeof s!="object")return null;const e=s,t=String(e.repo??e.name??e.full_name??"").trim(),r=String(e.tier??"").trim().toLowerCase(),i=String(e.criticality??e.priority??"").trim().toLowerCase(),o=this.readOnlineState(e);return!t||!G.includes(r)?null:["critical","high","medium"].includes(i)?{repo:t,tier:r,criticality:i,online:o}:{repo:t,tier:r,criticality:"medium",online:o}}shortName(s){return s.replace(/^clankamode\//,"")}render(){const s=G.map(e=>({tier:e,repos:this.repos.filter(t=>t.tier===e)})).filter(e=>e.repos.length>0);return d`
      <div class="sec-header">
        <span class="sec-label">fleet</span>
        <div class="sec-line"></div>
        <span class="sync ${this.live?"live":""}">
          ${this.loading?"SYNCING":this.live?"LIVE":"OFFLINE"}
        </span>
      </div>

      ${this.loading?d`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid" aria-hidden="true">
              ${Array.from({length:6}).map(()=>d`<div class="skeleton-card">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>`)}
            </div>
          `:this.error?d`<div class="fallback">${this.error}</div>`:s.map(e=>d`
                <div class="tier-group">
                  <div class="tier-title">${e.tier}</div>
                  <div class="grid" role="list">
                    ${e.repos.map(t=>d`
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
    `}};A.styles=E`
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
  `;Y([f()],A.prototype,"repos",2);Y([f()],A.prototype,"live",2);Y([f()],A.prototype,"loading",2);Y([f()],A.prototype,"error",2);A=Y([C("clanka-fleet")],A);var zt=Object.defineProperty,Ut=Object.getOwnPropertyDescriptor,ie=(s,e,t,r)=>{for(var i=r>1?void 0:r?Ut(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&zt(e,t,i),i};let M=class extends v{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.loadData()}async loadData(){const s=await je();s.length===0?this.error="[ offline — activity unavailable ]":this.events=s.slice(0,8),this.loading=!1}render(){return d`
      <div class="sec-header">
        <span class="sec-label">terminal</span>
        <div class="sec-line"></div>
      </div>
      <div class="terminal" role="log" aria-label="Terminal output">
        <div class="line prompt">clanka@fleet:~$ git log --oneline --all-repos</div>
        ${this.loading?d`<div class="line dim">[ fetching activity... ]<span class="cursor"></span></div>`:this.error?d`<div class="line dim">${this.error}</div>`:this.events.map(s=>d`
              <div class="line"><span class="tag">[${s.type}]</span> <span class="repo">${s.repo}:</span> <span class="msg">"${s.message}"</span>  <span class="ts">· ${Ue(s.timestamp)}</span></div>
            `)}
        ${this.loading?"":d`<div class="line prompt">clanka@fleet:~$ <span class="cursor"></span></div>`}
      </div>
    `}};M.styles=E`
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
      display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
    }
    .sec-label {
      font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted);
    }
    .sec-line { flex: 1; height: 1px; background: var(--border); }
    .terminal {
      border: 1px solid var(--border);
      background: radial-gradient(circle at top, #0f1110 0%, #070708 68%);
      padding: 14px;
      color: var(--accent);
      font-size: 11px;
      line-height: 1.55;
      overflow-x: auto;
    }
    .line { white-space: pre; color: color-mix(in srgb, var(--accent) 92%, #111 8%); }
    .line.dim { color: var(--muted); }
    .line.prompt { color: var(--bright); }
    .tag { color: var(--accent); font-weight: 600; }
    .repo { color: var(--text); }
    .msg { color: color-mix(in srgb, var(--accent) 70%, var(--text) 30%); }
    .ts { color: var(--dim); }
    .cursor {
      display: inline-block; width: 8px; height: 1em;
      background: var(--accent); transform: translateY(2px);
      animation: blink 1s steps(2, start) infinite;
    }
    @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
  `;ie([f()],M.prototype,"events",2);ie([f()],M.prototype,"loading",2);ie([f()],M.prototype,"error",2);M=ie([C("clanka-terminal")],M);var jt=Object.getOwnPropertyDescriptor,Ht=(s,e,t,r)=>{for(var i=r>1?void 0:r?jt(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=n(i)||i);return i};let de=class extends v{render(){return d`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        // agent orchestration is internal<br>
        // check <a href="https://github.com/clankamode" target="_blank">github.com/clankamode</a> for shipped work
      </div>
    `}};de.styles=E`
    :host { display: block; margin-bottom: 28px; }
    .sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .sec-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted, #6b6b78); }
    .sec-line { flex: 1; height: 1px; background: var(--border, #1e1e22); }
    .note {
      text-align: center; padding: 32px 16px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px; line-height: 1.8;
      color: var(--dim, #3a3a42);
    }
    a { color: var(--muted, #6b6b78); text-decoration: none; }
    a:hover { color: var(--accent, #c8f542); }
  `;de=Ht([C("clanka-agents")],de);var Rt=Object.defineProperty,Bt=Object.getOwnPropertyDescriptor,oe=(s,e,t,r)=>{for(var i=r>1?void 0:r?Bt(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&Rt(e,t,i),i};let L=class extends v{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(s){const e=(s??"todo").toLowerCase();return["todo","doing","done"].includes(e)?e:"todo"}render(){return d`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?d`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:3}).map(()=>d`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?d`<div class="fallback">${this.error}</div>`:this.tasks.length===0?d`<div class="fallback">[ no tasks ]</div>`:d`
                <div class="grid" role="list">
                  ${this.tasks.map(s=>d`
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
    `}};L.styles=E`
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
  `;oe([se({type:Array})],L.prototype,"tasks",2);oe([se({type:Boolean})],L.prototype,"loading",2);oe([se({type:String})],L.prototype,"error",2);L=oe([C("clanka-tasks")],L);var qt=Object.defineProperty,Ft=Object.getOwnPropertyDescriptor,ne=(s,e,t,r)=>{for(var i=r>1?void 0:r?Ft(e,t):e,o=s.length-1,n;o>=0;o--)(n=s[o])&&(i=(r?n(e,t,i):n(i))||i);return r&&i&&qt(e,t,i),i};let N=class extends v{constructor(){super(...arguments),this.open=!1,this.query="",this.activeIndex=0,this.items=[],this.handleGlobalKey=s=>{(s.metaKey||s.ctrlKey)&&s.key==="k"&&(s.preventDefault(),this.toggle()),s.key==="Escape"&&this.open&&this.close()}}connectedCallback(){super.connectedCallback(),this.buildItems(),window.addEventListener("keydown",this.handleGlobalKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this.handleGlobalKey)}toggle(){this.open=!this.open,this.open&&(this.query="",this.activeIndex=0,this.updateComplete.then(()=>{this.shadowRoot?.querySelector("input")?.focus()}))}close(){this.open=!1,this.query=""}buildItems(){const s=[];s.push({label:"Logs",hint:"blog posts",href:"#logs-label",section:"navigate"}),s.push({label:"Work",hint:"projects",href:"#work-label",section:"navigate"}),s.push({label:"About",hint:"bio",href:"#about-label",section:"navigate"}),s.push({label:"Capabilities",hint:"skills",href:"#cap-label",section:"navigate"}),document.querySelectorAll(".featured-log, .row a").forEach(e=>{const r=(e.tagName==="A",e).getAttribute("href");if(!r||!r.includes("/posts/"))return;const i=e.classList.contains("featured-log")?e.querySelector(".featured-title")?.textContent?.trim()||"":e.textContent?.trim()||"";i&&s.push({label:i,hint:"post",href:r,section:"logs"})}),s.push({label:"GitHub",hint:"github.com/clankamode",href:"https://github.com/clankamode",section:"links"}),s.push({label:"RSS Feed",hint:"subscribe",href:"/feed.xml",section:"links"}),this.items=s}get filtered(){if(!this.query)return this.items;const s=this.query.toLowerCase();return this.items.filter(e=>e.label.toLowerCase().includes(s)||e.hint.toLowerCase().includes(s)||e.section.toLowerCase().includes(s))}navigate(s){this.close(),s.href.startsWith("http")?window.open(s.href,"_blank","noopener,noreferrer"):s.href.startsWith("#")?document.getElementById(s.href.slice(1))?.scrollIntoView({behavior:"smooth"}):window.location.href=s.href}handleInput(s){this.query=s.target.value,this.activeIndex=0}handleKeydown(s){const e=this.filtered;s.key==="ArrowDown"?(s.preventDefault(),this.activeIndex=Math.min(this.activeIndex+1,e.length-1)):s.key==="ArrowUp"?(s.preventDefault(),this.activeIndex=Math.max(this.activeIndex-1,0)):s.key==="Enter"&&e[this.activeIndex]&&(s.preventDefault(),this.navigate(e[this.activeIndex]))}highlightMatch(s){if(!this.query)return s;const e=this.query.toLowerCase(),t=s.toLowerCase().indexOf(e);if(t===-1)return s;const r=s.slice(0,t),i=s.slice(t,t+this.query.length),o=s.slice(t+this.query.length);return d`${r}<mark>${i}</mark>${o}`}renderItems(){const s=this.filtered;if(!s.length)return d`<div class="empty">no results for "${this.query}"</div>`;const e=new Map;for(const i of s){const o=e.get(i.section)||[];o.push(i),e.set(i.section,o)}const t=[];let r=0;for(const[i,o]of e){t.push(d`<div class="section-label">${i}</div>`);for(const n of o){const l=r++;t.push(d`
          <div
            class="item ${l===this.activeIndex?"active":""}"
            @click=${()=>this.navigate(n)}
            @mouseenter=${()=>{this.activeIndex=l}}
          >
            <span class="item-label">${this.highlightMatch(n.label)}</span>
            <span class="item-hint">${n.hint}</span>
          </div>
        `)}}return t}render(){return this.open?d`
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
    `:d``}};N.styles=E`
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
  `;ne([f()],N.prototype,"open",2);ne([f()],N.prototype,"query",2);ne([f()],N.prototype,"activeIndex",2);N=ne([C("clanka-cmdk")],N);const X=document.getElementById("presence"),B=document.getElementById("activity"),P=document.getElementById("terminal"),Ie=document.getElementById("agents"),q=document.getElementById("tasks"),J=({loading:s,error:e})=>{B&&(B.loading=s,B.error=e||""),P&&(P.loading=s,P.error=e||""),q&&(q.loading=s,q.error=e||"")};J({loading:!0,error:""});X&&(X.addEventListener("sync-state",s=>{const t=s.detail||{loading:!1,error:"[ api unreachable ]"};J(t)}),X.addEventListener("sync-updated",s=>{const t=s.detail||{};B&&(B.history=t.history||[]),P&&(P.team=t.team||{},P.recentActivity=t.history||[]),Ie&&(Ie.team=t.team||{}),q&&(q.tasks=t.tasks||[]),J({loading:!1,error:""})}),X.addEventListener("sync-error",s=>{const t=s.detail?.error||"[ api unreachable ]";J({loading:!1,error:t})}));(()=>{const s=document.querySelectorAll("main section");if(!s.length)return;const e=new IntersectionObserver(t=>{t.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08,rootMargin:"0px 0px -8% 0px"});s.forEach(t=>{t.classList.add("section-reveal"),e.observe(t)})})();(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const s=document.querySelector(".hero-statement"),e=document.querySelector(".cursor");if(!s)return;const t="I build systems<br><em>that outlast me.</em>",[,r="",i=""]=t.match(/^(.*?)<br><em>(.*?)<\/em>$/)||[],o="<br><em>",n="</em>",l=40,a=c=>c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");if(!r||!i)return;s.innerHTML="";const p=(c=0)=>{if(c>r.length){window.setTimeout(()=>h(0),200);return}s.innerHTML=a(r.slice(0,c)),window.setTimeout(()=>p(c+1),l)},h=(c=0)=>{if(c>i.length){s.innerHTML=a(r)+o+a(i)+n,e&&window.setTimeout(()=>{e.style.opacity="0",e.style.pointerEvents="none"},2e3);return}s.innerHTML=a(r)+o+a(i.slice(0,c)),window.setTimeout(()=>h(c+1),l)};p(0)})();He();Fe();Ve();et();
