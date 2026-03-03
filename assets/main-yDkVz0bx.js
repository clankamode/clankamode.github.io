(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function s(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(i){if(i.ep)return;i.ep=!0;const n=s(i);fetch(i.href,n)}})();const Le="clanka-theme";function De(t){return t==="light"||t==="dark"}function Ve(){try{const t=localStorage.getItem(Le);return De(t)?t:null}catch{return null}}function We(t){try{localStorage.setItem(Le,t)}catch{}}function Ye(){const t=document.documentElement.dataset.theme;if(De(t??null))return t;const e=Ve();return e||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")}function me(t){document.documentElement.dataset.theme=t,We(t)}function Ge(t){if(!(t instanceof HTMLElement))return!1;const e=t.tagName;return t.isContentEditable||e==="INPUT"||e==="TEXTAREA"||e==="SELECT"}function Xe(){(()=>{const t=document.getElementById("theme-toggle");if(!t)return;const e=r=>{t.textContent=`theme: ${r}`,t.setAttribute("aria-pressed",r==="light"?"true":"false")};let s=Ye();me(s),e(s),t.addEventListener("click",()=>{s=s==="dark"?"light":"dark",me(s),e(s)})})(),(()=>{const t=document.getElementById("scrollProgress");if(!t)return;const e=()=>{const s=document.documentElement.scrollHeight-window.innerHeight;t.style.width=s>0?`${window.scrollY/s*100}%`:"0%"};window.addEventListener("scroll",e,{passive:!0}),e()})(),(()=>{const t=document.querySelector('[aria-labelledby="work-label"]');if(!t)return;const e=t.querySelectorAll(".row"),s=new IntersectionObserver(r=>{r.forEach(i=>{i.isIntersecting&&(i.target.classList.add("row-stagger"),s.unobserve(i.target))})},{threshold:.1});e.forEach((r,i)=>{r.style.animationDelay=`${i*.06}s`,r.style.opacity="0",s.observe(r)})})(),(()=>{const t=document.getElementById("status-date");if(!t)return;const e=new Date,s=r=>String(r).padStart(2,"0");t.textContent=`${e.getFullYear()}-${s(e.getMonth()+1)}-${s(e.getDate())}`})(),(()=>{const t=document.getElementById("tw-text"),e=document.getElementById("tw-em"),s=document.getElementById("tw-cursor");if(!t||!e||!s)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.textContent="I build systems",e.style.visibility="visible",s.classList.add("cursor--animate");return}const r="I build systems";s.style.animation="none",s.style.opacity="1";let i=0;function n(){i<=r.length&&(t.textContent=r.slice(0,i),i++,i<=r.length?setTimeout(n,40):(e.style.visibility="visible",e.style.opacity="0",setTimeout(()=>{e.style.opacity="1"},60),setTimeout(()=>{s.style.animation="cursorBlink 0.5s steps(2, start) 2",s.addEventListener("animationend",()=>{s.style.animation="none",s.style.opacity="1"},{once:!0})},400)))}setTimeout(n,180)})(),(()=>{const t=document.getElementById("scroll-top");t&&(window.addEventListener("scroll",()=>{t.classList.toggle("visible",window.scrollY>300)},{passive:!0}),t.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})))})(),(()=>{const t=document.getElementById("posts-search-input"),e=document.getElementById("posts-search-count"),s=document.querySelector(".logs-section .featured-log"),r=Array.from(document.querySelectorAll("#logs-list .row"));if(!t||!e||r.length===0)return;const i=r.map(l=>{const c=l.querySelector(".row-name a");if(!c)return null;const u=c.textContent??"",f=l.querySelector(".row-excerpt")?.textContent??"",m=l.querySelector(".row-meta")?.textContent??"";return{row:l,link:c,text:`${u} ${f} ${m}`.toLowerCase()}}).filter(l=>l!==null),n=(s?.textContent??"").toLowerCase();let o=i;const d=(l,c)=>{if(!c){e.textContent=`${l} logs`;return}if(l===0){e.textContent="no matches";return}e.textContent=`${l} match${l===1?"":"es"}`},a=()=>{const l=t.value.trim().toLowerCase(),c=[];let u=!1;s&&(u=l.length===0||n.includes(l),s.hidden=!u),i.forEach(f=>{const m=l.length===0||f.text.includes(l);f.row.hidden=!m,f.link.tabIndex=m?0:-1,m&&c.push(f)}),o=c,d(o.length+(u?1:0),l)},h=l=>{if(!o.length)return;const c=o.map(Ke=>Ke.link),u=document.activeElement,f=u instanceof HTMLAnchorElement?c.indexOf(u):-1,w=Math.max(0,Math.min(c.length-1,(f===-1?-1:f)+l));c[w]?.focus()};t.addEventListener("input",a),t.addEventListener("keydown",l=>{l.key==="ArrowDown"?(l.preventDefault(),h(1)):l.key==="Escape"&&(t.value?(t.value="",a()):t.blur())}),r.forEach(l=>{const c=l.querySelector(".row-name a");c&&c.addEventListener("keydown",u=>{if(u.key==="ArrowDown")u.preventDefault(),h(1);else if(u.key==="ArrowUp"){u.preventDefault();const f=o.map(w=>w.link),m=f.indexOf(c);if(m<=0){t.focus();return}f[m-1]?.focus()}})}),window.addEventListener("keydown",l=>{l.key!=="/"||l.metaKey||l.ctrlKey||l.altKey||Ge(l.target)||(l.preventDefault(),t.focus(),t.select())}),a()})(),(()=>{const t=document.querySelectorAll(".section-reveal");if(!t.length)return;const e=new IntersectionObserver(s=>{s.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08});t.forEach(s=>e.observe(s))})()}const ge="https://clanka-api.clankamode.workers.dev",Ze=new Date("2026-02-19T00:00:00Z"),ve=5e3,Je=Date.parse("2008-01-01T00:00:00Z"),Qe=300*1e3;function et(t){if(typeof t!="string"||t.trim().length===0)return null;const e=Date.parse(t);if(!Number.isFinite(e))return null;const s=Date.now();return e<Je||e>s+Qe?null:e}function be(t){const e=Date.now()-t;if(!Number.isFinite(e)||e<0)return"just now";const s=Math.floor(e/1e3),r=Math.floor(s/60),i=Math.floor(r/60),n=Math.floor(i/24);return n>0?`${n}d ago`:i>0?`${i}h ago`:r>0?`${r}m ago`:"just now"}function tt(){const t=Date.now()-Ze.getTime();return Math.floor(t/(1e3*60*60*24))}function _(t,e){const s=document.getElementById(t);s&&(s.textContent=e)}async function st(){_("stat-uptime",`// ${tt()}d online`);try{const t=new AbortController,e=window.setTimeout(()=>t.abort(),ve),s=await fetch(`${ge}/github/stats`,{headers:{Accept:"application/json"},signal:t.signal});if(window.clearTimeout(e),!s.ok)throw new Error(`API ${s.status}`);const r=await s.json();_("stat-repos",`${r.repoCount} repos`),_("stat-stars",`${r.totalStars} stars`);const i=et(r.lastPushedAt),n=typeof r.lastPushedRepo=="string"?r.lastPushedRepo.trim():"";i===null?_("stat-last-commit","last push: unavailable"):n.length===0?_("stat-last-commit",`last push: ${be(i)}`):_("stat-last-commit",`last push: ${be(i)} (${n})`);const o=new AbortController,d=window.setTimeout(()=>o.abort(),ve);try{const a=await fetch(`${ge}/fleet/score`,{headers:{Accept:"application/json"},signal:o.signal});if(window.clearTimeout(d),!a.ok)throw new Error(`API ${a.status}`);const h=await a.json(),l=Number(h.score);Number.isFinite(l)&&_("stat-fleet-score",`fleet: ${Math.round(l)}%`)}catch{}finally{window.clearTimeout(d)}}catch{}}const rt="https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager",it=5e3;async function nt(){const t=document.getElementById("npm-ci-triage");if(!t)return;let e=0;try{const s=new AbortController;e=window.setTimeout(()=>s.abort(),it);const r=await fetch(rt,{headers:{Accept:"application/json"},signal:s.signal});if(!r.ok)throw new Error(`NPM API ${r.status}`);const i=await r.json(),n=typeof i.downloads=="number"?i.downloads:null;if(n===null)throw new Error("Malformed downloads payload");t.textContent=`${n} dl/mo`}catch{}finally{window.clearTimeout(e)}}const ot="https://clanka-api.clankamode.workers.dev/github/events",at=5e3,Ne=["feat","fix","chore","docs","test","refactor","ci","build","style"];function lt(t){const e=new Date(t).getTime(),s=Date.now()-e,r=Math.floor(s/1e3),i=Math.floor(r/60),n=Math.floor(i/60),o=Math.floor(n/24);return o>0?`${o}d ago`:n>0?`${n}h ago`:i>0?`${i}m ago`:"just now"}function ct(t){return t.replace(/^clankamode\//,"")}function dt(t){const s=t.trim().toLowerCase().match(/^([a-z]+)/),r=s?s[1]:"";return Ne.includes(r)?r:"push"}function pt(t){return`${t} commit${t===1?"":"s"}`}function ye(t){const e=document.getElementById("commit-feed");if(!e)return;e.textContent="";const s=document.createElement("span");s.className="commit-feed-loading",s.textContent=t,e.append(s)}async function ht(){const t=document.getElementById("commit-feed");if(t)try{const e=new AbortController,s=window.setTimeout(()=>e.abort(),at),r=await fetch(ot,{headers:{Accept:"application/json"},signal:e.signal});if(window.clearTimeout(s),!r.ok)throw new Error(`GitHub events API ${r.status}`);const i=await r.json();if(!Array.isArray(i)||i.length===0){ye("// no activity data");return}t.textContent="",i.slice(0,8).forEach(n=>{const o=ct(n.repo||"unknown"),d=Array.isArray(n.commits)?n.commits.length:0,a=Array.isArray(n.commits)&&n.commits.length>0?n.commits[0].message:"",h=dt(a),l=Ne.includes(h)?h:"push",c=document.createElement("div");c.className="commit-item";const u=document.createElement("span");u.className="commit-repo",u.textContent=o;const f=document.createElement("span");f.className=`commit-tag commit-tag--${l}`,f.textContent=h;const m=document.createElement("span");m.className="commit-count",m.textContent=pt(d);const w=document.createElement("span");w.className="commit-time",w.textContent=n.pushedAt?lt(n.pushedAt):"just now",c.append(u,f,m,w),t.append(c)})}catch{ye("// no activity data")}}const J=globalThis,pe=J.ShadowRoot&&(J.ShadyCSS===void 0||J.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,he=Symbol(),xe=new WeakMap;let ze=class{constructor(e,s,r){if(this._$cssResult$=!0,r!==he)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=s}get styleSheet(){let e=this.o;const s=this.t;if(pe&&e===void 0){const r=s!==void 0&&s.length===1;r&&(e=xe.get(s)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&xe.set(s,e))}return e}toString(){return this.cssText}};const ut=t=>new ze(typeof t=="string"?t:t+"",void 0,he),S=(t,...e)=>{const s=t.length===1?t[0]:e.reduce((r,i,n)=>r+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new ze(s,t,he)},ft=(t,e)=>{if(pe)t.adoptedStyleSheets=e.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of e){const r=document.createElement("style"),i=J.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=s.cssText,t.appendChild(r)}},$e=pe?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let s="";for(const r of e.cssRules)s+=r.cssText;return ut(s)})(t):t;const{is:mt,defineProperty:gt,getOwnPropertyDescriptor:vt,getOwnPropertyNames:bt,getOwnPropertySymbols:yt,getPrototypeOf:xt}=Object,x=globalThis,we=x.trustedTypes,$t=we?we.emptyScript:"",wt=x.reactiveElementPolyfillSupport,H=(t,e)=>t,ee={toAttribute(t,e){switch(e){case Boolean:t=t?$t:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=t!==null;break;case Number:s=t===null?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch{s=null}}return s}},ue=(t,e)=>!mt(t,e),_e={attribute:!0,type:String,converter:ee,reflect:!1,useDefault:!1,hasChanged:ue};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),x.litPropertyMetadata??(x.litPropertyMetadata=new WeakMap);let I=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,s=_e){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(e,s),!s.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(e,r,s);i!==void 0&&gt(this.prototype,e,i)}}static getPropertyDescriptor(e,s,r){const{get:i,set:n}=vt(this.prototype,e)??{get(){return this[s]},set(o){this[s]=o}};return{get:i,set(o){const d=i?.call(this);n?.call(this,o),this.requestUpdate(e,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??_e}static _$Ei(){if(this.hasOwnProperty(H("elementProperties")))return;const e=xt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(H("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(H("properties"))){const s=this.properties,r=[...bt(s),...yt(s)];for(const i of r)this.createProperty(i,s[i])}const e=this[Symbol.metadata];if(e!==null){const s=litPropertyMetadata.get(e);if(s!==void 0)for(const[r,i]of s)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[s,r]of this.elementProperties){const i=this._$Eu(s,r);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const s=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const i of r)s.unshift($e(i))}else e!==void 0&&s.push($e(e));return s}static _$Eu(e,s){const r=s.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,s=this.constructor.elementProperties;for(const r of s.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ft(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,s,r){this._$AK(e,r)}_$ET(e,s){const r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){const n=(r.converter?.toAttribute!==void 0?r.converter:ee).toAttribute(s,r.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,s){const r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const n=r.getPropertyOptions(i),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ee;this._$Em=i;const d=o.fromAttribute(s,n.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(e,s,r,i=!1,n){if(e!==void 0){const o=this.constructor;if(i===!1&&(n=this[e]),r??(r=o.getPropertyOptions(e)),!((r.hasChanged??ue)(n,s)||r.useDefault&&r.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,r))))return;this.C(e,s,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,s,{useDefault:r,reflect:i,wrapped:n},o){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,o??s??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(s=void 0),this._$AL.set(e,s)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[i,n]of r){const{wrapped:o}=n,d=this[i];o!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,n,d)}}let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(s)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(s)}willUpdate(e){}_$AE(e){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(s=>this._$ET(s,this[s]))),this._$EM()}updated(e){}firstUpdated(e){}};I.elementStyles=[],I.shadowRootOptions={mode:"open"},I[H("elementProperties")]=new Map,I[H("finalized")]=new Map,wt?.({ReactiveElement:I}),(x.reactiveElementVersions??(x.reactiveElementVersions=[])).push("2.1.2");const R=globalThis,ke=t=>t,te=R.trustedTypes,Ae=te?te.createPolicy("lit-html",{createHTML:t=>t}):void 0,je="$lit$",y=`lit$${Math.random().toFixed(9).slice(2)}$`,Ue="?"+y,_t=`<${Ue}>`,E=document,K=()=>E.createComment(""),V=t=>t===null||typeof t!="object"&&typeof t!="function",fe=Array.isArray,kt=t=>fe(t)||typeof t?.[Symbol.iterator]=="function",le=`[ 	
\f\r]`,U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ee=/-->/g,Ce=/>/g,k=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Se=/'/g,Te=/"/g,He=/^(?:script|style|textarea|title)$/i,At=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),p=At(1),O=Symbol.for("lit-noChange"),g=Symbol.for("lit-nothing"),Ie=new WeakMap,A=E.createTreeWalker(E,129);function Re(t,e){if(!fe(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ae!==void 0?Ae.createHTML(e):e}const Et=(t,e)=>{const s=t.length-1,r=[];let i,n=e===2?"<svg>":e===3?"<math>":"",o=U;for(let d=0;d<s;d++){const a=t[d];let h,l,c=-1,u=0;for(;u<a.length&&(o.lastIndex=u,l=o.exec(a),l!==null);)u=o.lastIndex,o===U?l[1]==="!--"?o=Ee:l[1]!==void 0?o=Ce:l[2]!==void 0?(He.test(l[2])&&(i=RegExp("</"+l[2],"g")),o=k):l[3]!==void 0&&(o=k):o===k?l[0]===">"?(o=i??U,c=-1):l[1]===void 0?c=-2:(c=o.lastIndex-l[2].length,h=l[1],o=l[3]===void 0?k:l[3]==='"'?Te:Se):o===Te||o===Se?o=k:o===Ee||o===Ce?o=U:(o=k,i=void 0);const f=o===k&&t[d+1].startsWith("/>")?" ":"";n+=o===U?a+_t:c>=0?(r.push(h),a.slice(0,c)+je+a.slice(c)+y+f):a+y+(c===-2?d:f)}return[Re(t,n+(t[s]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]};class W{constructor({strings:e,_$litType$:s},r){let i;this.parts=[];let n=0,o=0;const d=e.length-1,a=this.parts,[h,l]=Et(e,s);if(this.el=W.createElement(h,r),A.currentNode=this.el.content,s===2||s===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(i=A.nextNode())!==null&&a.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(const c of i.getAttributeNames())if(c.endsWith(je)){const u=l[o++],f=i.getAttribute(c).split(y),m=/([.?@])?(.*)/.exec(u);a.push({type:1,index:n,name:m[2],strings:f,ctor:m[1]==="."?St:m[1]==="?"?Tt:m[1]==="@"?It:se}),i.removeAttribute(c)}else c.startsWith(y)&&(a.push({type:6,index:n}),i.removeAttribute(c));if(He.test(i.tagName)){const c=i.textContent.split(y),u=c.length-1;if(u>0){i.textContent=te?te.emptyScript:"";for(let f=0;f<u;f++)i.append(c[f],K()),A.nextNode(),a.push({type:2,index:++n});i.append(c[u],K())}}}else if(i.nodeType===8)if(i.data===Ue)a.push({type:2,index:n});else{let c=-1;for(;(c=i.data.indexOf(y,c+1))!==-1;)a.push({type:7,index:n}),c+=y.length-1}n++}}static createElement(e,s){const r=E.createElement("template");return r.innerHTML=e,r}}function M(t,e,s=t,r){if(e===O)return e;let i=r!==void 0?s._$Co?.[r]:s._$Cl;const n=V(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(t),i._$AT(t,s,r)),r!==void 0?(s._$Co??(s._$Co=[]))[r]=i:s._$Cl=i),i!==void 0&&(e=M(t,i._$AS(t,e.values),i,r)),e}class Ct{constructor(e,s){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:s},parts:r}=this._$AD,i=(e?.creationScope??E).importNode(s,!0);A.currentNode=i;let n=A.nextNode(),o=0,d=0,a=r[0];for(;a!==void 0;){if(o===a.index){let h;a.type===2?h=new Y(n,n.nextSibling,this,e):a.type===1?h=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(h=new Pt(n,this,e)),this._$AV.push(h),a=r[++d]}o!==a?.index&&(n=A.nextNode(),o++)}return A.currentNode=E,i}p(e){let s=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,s),s+=r.strings.length-2):r._$AI(e[s])),s++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,s,r,i){this.type=2,this._$AH=g,this._$AN=void 0,this._$AA=e,this._$AB=s,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&e?.nodeType===11&&(e=s.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,s=this){e=M(this,e,s),V(e)?e===g||e==null||e===""?(this._$AH!==g&&this._$AR(),this._$AH=g):e!==this._$AH&&e!==O&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):kt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==g&&V(this._$AH)?this._$AA.nextSibling.data=e:this.T(E.createTextNode(e)),this._$AH=e}$(e){const{values:s,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=W.createElement(Re(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(s);else{const n=new Ct(i,this),o=n.u(this.options);n.p(s),this.T(o),this._$AH=n}}_$AC(e){let s=Ie.get(e.strings);return s===void 0&&Ie.set(e.strings,s=new W(e)),s}k(e){fe(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let r,i=0;for(const n of e)i===s.length?s.push(r=new Y(this.O(K()),this.O(K()),this,this.options)):r=s[i],r._$AI(n),i++;i<s.length&&(this._$AR(r&&r._$AB.nextSibling,i),s.length=i)}_$AR(e=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);e!==this._$AB;){const r=ke(e).nextSibling;ke(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class se{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,s,r,i,n){this.type=1,this._$AH=g,this._$AN=void 0,this.element=e,this.name=s,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=g}_$AI(e,s=this,r,i){const n=this.strings;let o=!1;if(n===void 0)e=M(this,e,s,0),o=!V(e)||e!==this._$AH&&e!==O,o&&(this._$AH=e);else{const d=e;let a,h;for(e=n[0],a=0;a<n.length-1;a++)h=M(this,d[r+a],s,a),h===O&&(h=this._$AH[a]),o||(o=!V(h)||h!==this._$AH[a]),h===g?e=g:e!==g&&(e+=(h??"")+n[a+1]),this._$AH[a]=h}o&&!i&&this.j(e)}j(e){e===g?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class St extends se{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===g?void 0:e}}class Tt extends se{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==g)}}class It extends se{constructor(e,s,r,i,n){super(e,s,r,i,n),this.type=5}_$AI(e,s=this){if((e=M(this,e,s,0)??g)===O)return;const r=this._$AH,i=e===g&&r!==g||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==g&&(r===g||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Pt{constructor(e,s,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=s,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){M(this,e)}}const Ot=R.litHtmlPolyfillSupport;Ot?.(W,Y),(R.litHtmlVersions??(R.litHtmlVersions=[])).push("3.3.2");const Mt=(t,e,s)=>{const r=s?.renderBefore??e;let i=r._$litPart$;if(i===void 0){const n=s?.renderBefore??null;r._$litPart$=i=new Y(e.insertBefore(K(),n),n,void 0,s??{})}return i._$AI(t),i};const B=globalThis;class b extends I{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var s;const e=super.createRenderRoot();return(s=this.renderOptions).renderBefore??(s.renderBefore=e.firstChild),e}update(e){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Mt(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}}b._$litElement$=!0,b.finalized=!0,B.litElementHydrateSupport?.({LitElement:b});const Lt=B.litElementPolyfillSupport;Lt?.({LitElement:b});(B.litElementVersions??(B.litElementVersions=[])).push("4.2.2");const T=t=>(e,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)};const Dt={attribute:!0,type:String,converter:ee,reflect:!1,hasChanged:ue},Nt=(t=Dt,e,s)=>{const{kind:r,metadata:i}=s;let n=globalThis.litPropertyMetadata.get(i);if(n===void 0&&globalThis.litPropertyMetadata.set(i,n=new Map),r==="setter"&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),r==="accessor"){const{name:o}=s;return{set(d){const a=e.get.call(this);e.set.call(this,d),this.requestUpdate(o,a,t,!0,d)},init(d){return d!==void 0&&this.C(o,void 0,t,d),d}}}if(r==="setter"){const{name:o}=s;return function(d){const a=this[o];e.call(this,d),this.requestUpdate(o,a,t,!0,d)}}throw Error("Unsupported decorator location: "+r)};function re(t){return(e,s)=>typeof s=="object"?Nt(t,e,s):((r,i,n)=>{const o=i.hasOwnProperty(n);return i.constructor.createProperty(n,r),o?Object.getOwnPropertyDescriptor(i,n):void 0})(t,e,s)}function v(t){return re({...t,state:!0,attribute:!1})}const zt="https://clanka-api.clankamode.workers.dev",jt=15e3,Pe=new Map,ce=new Map;function Ut(t){return`${zt}${t}`}async function Be(t,e=jt){const s=Ut(t),r=Pe.get(s),i=Date.now();if(r&&r.expiresAt>i)return r.data;const n=ce.get(s);if(n)return n;const o=(async()=>{const d=await fetch(s,{headers:{Accept:"application/json"}});if(!d.ok)throw new Error(`API ${d.status}`);const a=await d.json();return Pe.set(s,{data:a,expiresAt:Date.now()+e}),a})();ce.set(s,o);try{return await o}finally{ce.delete(s)}}function Ht(){return Be("/now")}function Rt(){return Be("/fleet/summary")}var Bt=Object.defineProperty,qt=Object.getOwnPropertyDescriptor,j=(t,e,s,r)=>{for(var i=r>1?void 0:r?qt(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&Bt(e,s,i),i};let $=class extends b{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const t=await Ht();this.current=typeof t.current=="string"?t.current:"active",this.status=typeof t.status=="string"?t.status:"operational",this.history=Array.isArray(t.history)?t.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:t}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const t=this.status.toLowerCase();return p`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${t==="thinking"?"thinking":""}" style=${t==="offline"?"opacity:.4":""}></span>
          ${this.loading?"SYNCING":this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading?p`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`:this.error?p`<span class="error"> ${this.error}</span>`:p` ${this.current}`}
      </div>
    `}};$.styles=S`
    :host {
      display: block;
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
  `;j([v()],$.prototype,"current",2);j([v()],$.prototype,"status",2);j([v()],$.prototype,"history",2);j([v()],$.prototype,"loading",2);j([v()],$.prototype,"error",2);$=j([T("clanka-presence")],$);function qe(t){const e=Date.now()-new Date(t).getTime();return e<6e4?"just now":e<36e5?`${Math.floor(e/6e4)}m ago`:e<864e5?`${Math.floor(e/36e5)}h ago`:`${Math.floor(e/864e5)}d ago`}const Ft="https://clanka-api.clankamode.workers.dev";async function Fe(){const t=new AbortController,e=setTimeout(()=>t.abort(),5e3);try{const s=await fetch(`${Ft}/github/events`,{signal:t.signal});return s.ok?(await s.json()).events??[]:[]}catch{return[]}finally{clearTimeout(e)}}var Kt=Object.defineProperty,Vt=Object.getOwnPropertyDescriptor,ie=(t,e,s,r)=>{for(var i=r>1?void 0:r?Vt(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&Kt(e,s,i),i};let L=class extends b{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.loadData()}async loadData(){const t=await Fe();t.length===0?this.error="[ activity unavailable ]":this.events=t,this.loading=!1}render(){return p`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.loading?p`<div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>`:this.error?p`<div class="status-fallback">${this.error}</div>`:this.events.map(t=>p`
            <div class="row" role="listitem">
              <span class="row-name"><span class="tag">[${t.type}]</span> ${t.repo}: ${t.message}</span>
              <span class="row-meta">${qe(t.timestamp)}</span>
            </div>
          `)}
    `}};L.styles=S`
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
  `;ie([v()],L.prototype,"events",2);ie([v()],L.prototype,"loading",2);ie([v()],L.prototype,"error",2);L=ie([T("clanka-activity")],L);var Wt=Object.defineProperty,Yt=Object.getOwnPropertyDescriptor,G=(t,e,s,r)=>{for(var i=r>1?void 0:r?Yt(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&Wt(e,s,i),i};const X=["ops","infra","core","quality","policy","template"];let C=class extends b{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const t=await Rt(),e=this.extractRepos(t);if(!e.length)throw new Error("No fleet repos in payload");this.repos=e,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(t){const e=this.pickRepoArray(t);return e.length?e.map(s=>this.normalizeRepo(s)).filter(s=>s!==null).sort((s,r)=>{const i=X.indexOf(s.tier)-X.indexOf(r.tier);return i!==0?i:s.repo.localeCompare(r.repo)}):[]}pickRepoArray(t){if(!t||typeof t!="object")return[];const e=t;if(Array.isArray(e.repos))return e.repos;if(Array.isArray(e.fleet))return e.fleet;if(e.summary&&typeof e.summary=="object"){const s=e.summary;if(Array.isArray(s.repos))return s.repos;if(Array.isArray(s.fleet))return s.fleet}return[]}readOnlineState(t){if(typeof t.online=="boolean")return t.online;const e=String(t.status??t.state??"").trim().toLowerCase();return e?["offline","down","error","failed","degraded"].includes(e)?!1:(["online","up","ok","healthy","active"].includes(e),!0):!0}normalizeRepo(t){if(!t||typeof t!="object")return null;const e=t,s=String(e.repo??e.name??e.full_name??"").trim(),r=String(e.tier??"").trim().toLowerCase(),i=String(e.criticality??e.priority??"").trim().toLowerCase(),n=this.readOnlineState(e);return!s||!X.includes(r)?null:["critical","high","medium"].includes(i)?{repo:s,tier:r,criticality:i,online:n}:{repo:s,tier:r,criticality:"medium",online:n}}shortName(t){return t.replace(/^clankamode\//,"")}render(){const t=X.map(e=>({tier:e,repos:this.repos.filter(s=>s.tier===e)})).filter(e=>e.repos.length>0);return p`
      <div class="sec-header">
        <span class="sec-label">fleet</span>
        <div class="sec-line"></div>
        <span class="sync ${this.live?"live":""}">
          ${this.loading?"SYNCING":this.live?"LIVE":"OFFLINE"}
        </span>
      </div>

      ${this.loading?p`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid" aria-hidden="true">
              ${Array.from({length:6}).map(()=>p`<div class="skeleton-card">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>`)}
            </div>
          `:this.error?p`<div class="fallback">${this.error}</div>`:t.map(e=>p`
                <div class="tier-group">
                  <div class="tier-title">${e.tier}</div>
                  <div class="grid" role="list">
                    ${e.repos.map(s=>p`
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
    `}};C.styles=S`
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
    @media (max-width: 680px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .card {
        min-height: 0;
        padding: 10px 12px;
      }
      .card-head {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
      }
    }
  `;G([v()],C.prototype,"repos",2);G([v()],C.prototype,"live",2);G([v()],C.prototype,"loading",2);G([v()],C.prototype,"error",2);C=G([T("clanka-fleet")],C);var Gt=Object.defineProperty,Xt=Object.getOwnPropertyDescriptor,ne=(t,e,s,r)=>{for(var i=r>1?void 0:r?Xt(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&Gt(e,s,i),i};let D=class extends b{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.loadData()}async loadData(){const t=await Fe();t.length===0?this.error="[ offline — activity unavailable ]":this.events=t.slice(0,8),this.loading=!1}render(){return p`
      <div class="sec-header">
        <span class="sec-label">terminal</span>
        <div class="sec-line"></div>
      </div>
      <div class="terminal" role="log" aria-label="Terminal output">
        <div class="line prompt">clanka@fleet:~$ git log --oneline --all-repos</div>
        ${this.loading?p`<div class="line dim">[ fetching activity... ]<span class="cursor"></span></div>`:this.error?p`<div class="line dim">${this.error}</div>`:this.events.map(t=>p`
              <div class="line"><span class="tag">[${t.type}]</span> <span class="repo">${t.repo}:</span> <span class="msg">"${t.message}"</span>  <span class="ts">· ${qe(t.timestamp)}</span></div>
            `)}
        ${this.loading?"":p`<div class="line prompt">clanka@fleet:~$ <span class="cursor"></span></div>`}
      </div>
    `}};D.styles=S`
    :host {
      display: block;
      margin-bottom: 28px;
      font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
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
      background: radial-gradient(
        circle at top,
        color-mix(in srgb, var(--surface) 84%, var(--accent) 16%) 0%,
        var(--bg) 68%
      );
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
  `;ne([v()],D.prototype,"events",2);ne([v()],D.prototype,"loading",2);ne([v()],D.prototype,"error",2);D=ne([T("clanka-terminal")],D);var Zt=Object.getOwnPropertyDescriptor,Jt=(t,e,s,r)=>{for(var i=r>1?void 0:r?Zt(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=o(i)||i);return i};let de=class extends b{render(){return p`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        // agent orchestration is internal<br>
        // check <a href="https://github.com/clankamode" target="_blank">github.com/clankamode</a> for shipped work
      </div>
    `}};de.styles=S`
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
  `;de=Jt([T("clanka-agents")],de);var Qt=Object.defineProperty,es=Object.getOwnPropertyDescriptor,oe=(t,e,s,r)=>{for(var i=r>1?void 0:r?es(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&Qt(e,s,i),i};let N=class extends b{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(t){const e=(t??"todo").toLowerCase();return["todo","doing","done"].includes(e)?e:"todo"}render(){return p`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?p`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:3}).map(()=>p`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?p`<div class="fallback">${this.error}</div>`:this.tasks.length===0?p`<div class="fallback">[ no tasks ]</div>`:p`
                <div class="grid" role="list">
                  ${this.tasks.map(t=>p`
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
    `}};N.styles=S`
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
  `;oe([re({type:Array})],N.prototype,"tasks",2);oe([re({type:Boolean})],N.prototype,"loading",2);oe([re({type:String})],N.prototype,"error",2);N=oe([T("clanka-tasks")],N);var ts=Object.defineProperty,ss=Object.getOwnPropertyDescriptor,ae=(t,e,s,r)=>{for(var i=r>1?void 0:r?ss(e,s):e,n=t.length-1,o;n>=0;n--)(o=t[n])&&(i=(r?o(e,s,i):o(i))||i);return r&&i&&ts(e,s,i),i};let z=class extends b{constructor(){super(...arguments),this.open=!1,this.query="",this.activeIndex=0,this.items=[],this.handleGlobalKey=t=>{(t.metaKey||t.ctrlKey)&&t.key==="k"&&(t.preventDefault(),this.toggle()),t.key==="Escape"&&this.open&&this.close()}}connectedCallback(){super.connectedCallback(),this.buildItems(),window.addEventListener("keydown",this.handleGlobalKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this.handleGlobalKey)}toggle(){this.open=!this.open,this.open&&(this.query="",this.activeIndex=0,this.updateComplete.then(()=>{this.shadowRoot?.querySelector("input")?.focus()}))}close(){this.open=!1,this.query=""}buildItems(){const t=[];t.push({label:"Logs",hint:"blog posts",href:"#logs-label",section:"navigate"}),t.push({label:"Work",hint:"projects",href:"#work-label",section:"navigate"}),t.push({label:"About",hint:"bio",href:"#about-label",section:"navigate"}),t.push({label:"Capabilities",hint:"skills",href:"#cap-label",section:"navigate"}),document.querySelectorAll(".featured-log, .row a").forEach(e=>{const r=(e.tagName==="A",e).getAttribute("href");if(!r||!r.includes("/posts/"))return;const i=e.classList.contains("featured-log")?e.querySelector(".featured-title")?.textContent?.trim()||"":e.textContent?.trim()||"";i&&t.push({label:i,hint:"post",href:r,section:"logs"})}),t.push({label:"GitHub",hint:"github.com/clankamode",href:"https://github.com/clankamode",section:"links"}),t.push({label:"RSS Feed",hint:"subscribe",href:"/feed.xml",section:"links"}),this.items=t}get filtered(){if(!this.query)return this.items;const t=this.query.toLowerCase();return this.items.filter(e=>e.label.toLowerCase().includes(t)||e.hint.toLowerCase().includes(t)||e.section.toLowerCase().includes(t))}navigate(t){this.close(),t.href.startsWith("http")?window.open(t.href,"_blank","noopener,noreferrer"):t.href.startsWith("#")?document.getElementById(t.href.slice(1))?.scrollIntoView({behavior:"smooth"}):window.location.href=t.href}handleInput(t){this.query=t.target.value,this.activeIndex=0}handleKeydown(t){const e=this.filtered;t.key==="ArrowDown"?(t.preventDefault(),this.activeIndex=Math.min(this.activeIndex+1,e.length-1)):t.key==="ArrowUp"?(t.preventDefault(),this.activeIndex=Math.max(this.activeIndex-1,0)):t.key==="Enter"&&e[this.activeIndex]&&(t.preventDefault(),this.navigate(e[this.activeIndex]))}highlightMatch(t){if(!this.query)return t;const e=this.query.toLowerCase(),s=t.toLowerCase().indexOf(e);if(s===-1)return t;const r=t.slice(0,s),i=t.slice(s,s+this.query.length),n=t.slice(s+this.query.length);return p`${r}<mark>${i}</mark>${n}`}renderItems(){const t=this.filtered;if(!t.length)return p`<div class="empty">no results for "${this.query}"</div>`;const e=new Map;for(const i of t){const n=e.get(i.section)||[];n.push(i),e.set(i.section,n)}const s=[];let r=0;for(const[i,n]of e){s.push(p`<div class="section-label">${i}</div>`);for(const o of n){const d=r++;s.push(p`
          <div
            class="item ${d===this.activeIndex?"active":""}"
            @click=${()=>this.navigate(o)}
            @mouseenter=${()=>{this.activeIndex=d}}
          >
            <span class="item-label">${this.highlightMatch(o.label)}</span>
            <span class="item-hint">${o.hint}</span>
          </div>
        `)}}return s}render(){return this.open?p`
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
    `:p``}};z.styles=S`
    :host {
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
  `;ae([v()],z.prototype,"open",2);ae([v()],z.prototype,"query",2);ae([v()],z.prototype,"activeIndex",2);z=ae([T("clanka-cmdk")],z);const Z=document.getElementById("presence"),q=document.getElementById("activity"),P=document.getElementById("terminal"),Oe=document.getElementById("agents"),F=document.getElementById("tasks"),Me=(t,e)=>{const s=document.getElementById(t);s&&(s.textContent=e)},rs=new Set(["active","online","busy","running","healthy","up"]),is=t=>{if(!t||typeof t!="object")return null;const e=Object.values(t).filter(i=>i!==null&&typeof i=="object");if(!e.length)return null;let s=0,r=0;return e.forEach(i=>{const n=String(i.status??i.state??i.presence??"").trim().toLowerCase();n&&(r+=1,rs.has(n)&&(s+=1))}),r>0?s:e.length},ns=t=>typeof t.agents_active=="number"&&Number.isFinite(t.agents_active)&&t.agents_active>=0?Math.floor(t.agents_active):is(t.team),Q=({loading:t,error:e})=>{q&&(q.loading=t,q.error=e||""),P&&(P.loading=t,P.error=e||""),F&&(F.loading=t,F.error=e||"")};Q({loading:!0,error:""});Z&&(Z.addEventListener("sync-state",t=>{const s=t.detail||{loading:!1,error:"[ api unreachable ]"};Q(s)}),Z.addEventListener("sync-updated",t=>{const s=t.detail||{};q&&(q.history=s.history||[]),P&&(P.team=s.team||{},P.recentActivity=s.history||[]),Oe&&(Oe.team=s.team||{}),F&&(F.tasks=s.tasks||[]);const r=ns(s);r!==null&&Me("stat-active-agents",`agents: ${r} active`),Q({loading:!1,error:""})}),Z.addEventListener("sync-error",t=>{const s=t.detail?.error||"[ api unreachable ]";Me("stat-active-agents","agents: offline"),Q({loading:!1,error:s})}));(()=>{const t=document.querySelectorAll("main section");if(!t.length)return;const e=new IntersectionObserver(s=>{s.forEach(r=>{r.isIntersecting&&(r.target.classList.add("is-visible"),e.unobserve(r.target))})},{threshold:.08,rootMargin:"0px 0px -8% 0px"});t.forEach(s=>{s.classList.add("section-reveal"),e.observe(s)})})();(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t=document.querySelector(".hero-statement"),e=document.querySelector(".cursor");if(!t)return;const s="I build systems<br><em>that outlast me.</em>",[,r="",i=""]=s.match(/^(.*?)<br><em>(.*?)<\/em>$/)||[],n="<br><em>",o="</em>",d=40,a=c=>c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");if(!r||!i)return;t.innerHTML="";const h=(c=0)=>{if(c>r.length){window.setTimeout(()=>l(0),200);return}t.innerHTML=a(r.slice(0,c)),window.setTimeout(()=>h(c+1),d)},l=(c=0)=>{if(c>i.length){t.innerHTML=a(r)+n+a(i)+o,e&&window.setTimeout(()=>{e.style.opacity="0",e.style.pointerEvents="none"},2e3);return}t.innerHTML=a(r)+n+a(i.slice(0,c)),window.setTimeout(()=>l(c+1),d)};h(0)})();Xe();st();nt();ht();
