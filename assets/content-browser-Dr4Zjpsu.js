(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function s(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=s(i);fetch(i.href,r)}})();const ae="clanka-theme";function ce(t){return t==="light"||t==="dark"}function me(){try{const t=localStorage.getItem(ae);return ce(t)?t:null}catch{return null}}function ye(t){try{localStorage.setItem(ae,t)}catch{}}function ge(){const t=document.documentElement.dataset.theme;if(ce(t??null))return t;const e=me();return e||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")}function F(t){document.documentElement.dataset.theme=t,ye(t)}function $e(t){if(!(t instanceof HTMLElement))return!1;const e=t.tagName;return t.isContentEditable||e==="INPUT"||e==="TEXTAREA"||e==="SELECT"}function Ze(){(()=>{const t=document.getElementById("theme-toggle");if(!t)return;const e=n=>{t.textContent=`theme: ${n}`,t.setAttribute("aria-pressed",n==="light"?"true":"false")};let s=ge();F(s),e(s),t.addEventListener("click",()=>{s=s==="dark"?"light":"dark",F(s),e(s)})})(),(()=>{const t=document.getElementById("scrollProgress");if(!t)return;const e=()=>{const s=document.documentElement.scrollHeight-window.innerHeight;t.style.width=s>0?`${window.scrollY/s*100}%`:"0%"};window.addEventListener("scroll",e,{passive:!0}),e()})(),(()=>{const t=document.querySelector('[aria-labelledby="work-label"]');if(!t)return;const e=t.querySelectorAll(".row"),s=new IntersectionObserver(n=>{n.forEach(i=>{i.isIntersecting&&(i.target.classList.add("row-stagger"),s.unobserve(i.target))})},{threshold:.1});e.forEach((n,i)=>{n.style.animationDelay=`${i*.06}s`,n.style.opacity="0",s.observe(n)})})(),(()=>{const t=document.getElementById("status-date");if(!t)return;const e=new Date,s=n=>String(n).padStart(2,"0");t.textContent=`${e.getFullYear()}-${s(e.getMonth()+1)}-${s(e.getDate())}`})(),(()=>{const t=document.getElementById("tw-text"),e=document.getElementById("tw-em"),s=document.getElementById("tw-cursor");if(!t||!e||!s)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.textContent="I build systems",e.style.visibility="visible",s.classList.add("cursor--animate");return}const n="I build systems";s.style.animation="none",s.style.opacity="1";let i=0;function r(){i<=n.length&&(t.textContent=n.slice(0,i),i++,i<=n.length?setTimeout(r,40):(e.style.visibility="visible",e.style.opacity="0",setTimeout(()=>{e.style.opacity="1"},60),setTimeout(()=>{s.style.animation="cursorBlink 0.5s steps(2, start) 2",s.addEventListener("animationend",()=>{s.style.animation="none",s.style.opacity="1"},{once:!0})},400)))}setTimeout(r,180)})(),(()=>{const t=document.getElementById("scroll-top");t&&(window.addEventListener("scroll",()=>{t.classList.toggle("visible",window.scrollY>300)},{passive:!0}),t.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})))})(),(()=>{const t=document.getElementById("posts-search-input"),e=document.getElementById("posts-search-count"),s=document.querySelector(".logs-section .featured-log"),n=Array.from(document.querySelectorAll("#logs-list .row"));if(!t||!e||n.length===0)return;const i=n.map(a=>{const h=a.querySelector(".row-name a");if(!h)return null;const d=h.textContent??"",p=a.querySelector(".row-excerpt")?.textContent??"",m=a.querySelector(".row-meta")?.textContent??"";return{row:a,link:h,text:`${d} ${p} ${m}`.toLowerCase()}}).filter(a=>a!==null),r=(s?.textContent??"").toLowerCase();let o=i;const l=(a,h)=>{if(!h){e.textContent=`${a} logs`;return}if(a===0){e.textContent="no matches";return}e.textContent=`${a} match${a===1?"":"es"}`},c=()=>{const a=t.value.trim().toLowerCase(),h=[];let d=!1;s&&(d=a.length===0||r.includes(a),s.hidden=!d),i.forEach(p=>{const m=a.length===0||p.text.includes(a);p.row.hidden=!m,p.link.tabIndex=m?0:-1,m&&h.push(p)}),o=h,l(o.length+(d?1:0),a)},u=a=>{if(!o.length)return;const h=o.map(fe=>fe.link),d=document.activeElement,p=d instanceof HTMLAnchorElement?h.indexOf(d):-1,D=Math.max(0,Math.min(h.length-1,(p===-1?-1:p)+a));h[D]?.focus()};t.addEventListener("input",c),t.addEventListener("keydown",a=>{a.key==="ArrowDown"?(a.preventDefault(),u(1)):a.key==="Escape"&&(t.value?(t.value="",c()):t.blur())}),n.forEach(a=>{const h=a.querySelector(".row-name a");h&&h.addEventListener("keydown",d=>{if(d.key==="ArrowDown")d.preventDefault(),u(1);else if(d.key==="ArrowUp"){d.preventDefault();const p=o.map(D=>D.link),m=p.indexOf(h);if(m<=0){t.focus();return}p[m-1]?.focus()}})}),window.addEventListener("keydown",a=>{a.key!=="/"||a.metaKey||a.ctrlKey||a.altKey||$e(a.target)||(a.preventDefault(),t.focus(),t.select())}),c()})(),(()=>{const t=document.querySelectorAll(".section-reveal");if(!t.length)return;const e=new IntersectionObserver(s=>{s.forEach(n=>{n.isIntersecting&&(n.target.classList.add("is-visible"),e.unobserve(n.target))})},{threshold:.08});t.forEach(s=>e.observe(s))})()}const L=globalThis,z=L.ShadowRoot&&(L.ShadyCSS===void 0||L.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,K=Symbol(),G=new WeakMap;let le=class{constructor(e,s,n){if(this._$cssResult$=!0,n!==K)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=s}get styleSheet(){let e=this.o;const s=this.t;if(z&&e===void 0){const n=s!==void 0&&s.length===1;n&&(e=G.get(s)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&G.set(s,e))}return e}toString(){return this.cssText}};const ve=t=>new le(typeof t=="string"?t:t+"",void 0,K),be=(t,...e)=>{const s=t.length===1?t[0]:e.reduce((n,i,r)=>n+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[r+1],t[0]);return new le(s,t,K)},_e=(t,e)=>{if(z)t.adoptedStyleSheets=e.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of e){const n=document.createElement("style"),i=L.litNonce;i!==void 0&&n.setAttribute("nonce",i),n.textContent=s.cssText,t.appendChild(n)}},X=z?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let s="";for(const n of e.cssRules)s+=n.cssText;return ve(s)})(t):t;const{is:xe,defineProperty:we,getOwnPropertyDescriptor:Ae,getOwnPropertyNames:Ee,getOwnPropertySymbols:ke,getPrototypeOf:Se}=Object,g=globalThis,Z=g.trustedTypes,Ce=Z?Z.emptyScript:"",Ie=g.reactiveElementPolyfillSupport,S=(t,e)=>t,U={toAttribute(t,e){switch(e){case Boolean:t=t?Ce:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=t!==null;break;case Number:s=t===null?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch{s=null}}return s}},W=(t,e)=>!xe(t,e),J={attribute:!0,type:String,converter:U,reflect:!1,useDefault:!1,hasChanged:W};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),g.litPropertyMetadata??(g.litPropertyMetadata=new WeakMap);let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,s=J){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(e,s),!s.noAccessor){const n=Symbol(),i=this.getPropertyDescriptor(e,n,s);i!==void 0&&we(this.prototype,e,i)}}static getPropertyDescriptor(e,s,n){const{get:i,set:r}=Ae(this.prototype,e)??{get(){return this[s]},set(o){this[s]=o}};return{get:i,set(o){const l=i?.call(this);r?.call(this,o),this.requestUpdate(e,l,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??J}static _$Ei(){if(this.hasOwnProperty(S("elementProperties")))return;const e=Se(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(S("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(S("properties"))){const s=this.properties,n=[...Ee(s),...ke(s)];for(const i of n)this.createProperty(i,s[i])}const e=this[Symbol.metadata];if(e!==null){const s=litPropertyMetadata.get(e);if(s!==void 0)for(const[n,i]of s)this.elementProperties.set(n,i)}this._$Eh=new Map;for(const[s,n]of this.elementProperties){const i=this._$Eu(s,n);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const s=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const i of n)s.unshift(X(i))}else e!==void 0&&s.push(X(e));return s}static _$Eu(e,s){const n=s.attribute;return n===!1?void 0:typeof n=="string"?n:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,s=this.constructor.elementProperties;for(const n of s.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return _e(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,s,n){this._$AK(e,n)}_$ET(e,s){const n=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,n);if(i!==void 0&&n.reflect===!0){const r=(n.converter?.toAttribute!==void 0?n.converter:U).toAttribute(s,n.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,s){const n=this.constructor,i=n._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const r=n.getPropertyOptions(i),o=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:U;this._$Em=i;const l=o.fromAttribute(s,r.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,s,n,i=!1,r){if(e!==void 0){const o=this.constructor;if(i===!1&&(r=this[e]),n??(n=o.getPropertyOptions(e)),!((n.hasChanged??W)(r,s)||n.useDefault&&n.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,n))))return;this.C(e,s,n)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,s,{useDefault:n,reflect:i,wrapped:r},o){n&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,o??s??this[e]),r!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(s=void 0),this._$AL.set(e,s)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}const n=this.constructor.elementProperties;if(n.size>0)for(const[i,r]of n){const{wrapped:o}=r,l=this[i];o!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,r,l)}}let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),this._$EO?.forEach(n=>n.hostUpdate?.()),this.update(s)):this._$EM()}catch(n){throw e=!1,this._$EM(),n}e&&this._$AE(s)}willUpdate(e){}_$AE(e){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(s=>this._$ET(s,this[s]))),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[S("elementProperties")]=new Map,x[S("finalized")]=new Map,Ie?.({ReactiveElement:x}),(g.reactiveElementVersions??(g.reactiveElementVersions=[])).push("2.1.2");const C=globalThis,Q=t=>t,H=C.trustedTypes,ee=H?H.createPolicy("lit-html",{createHTML:t=>t}):void 0,he="$lit$",y=`lit$${Math.random().toFixed(9).slice(2)}$`,de="?"+y,Pe=`<${de}>`,b=document,O=()=>b.createComment(""),T=t=>t===null||typeof t!="object"&&typeof t!="function",V=Array.isArray,Oe=t=>V(t)||typeof t?.[Symbol.iterator]=="function",j=`[ 	
\f\r]`,k=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,te=/-->/g,se=/>/g,$=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ne=/'/g,ie=/"/g,ue=/^(?:script|style|textarea|title)$/i,Te=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),_=Te(1),w=Symbol.for("lit-noChange"),f=Symbol.for("lit-nothing"),re=new WeakMap,v=b.createTreeWalker(b,129);function pe(t,e){if(!V(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return ee!==void 0?ee.createHTML(e):e}const Me=(t,e)=>{const s=t.length-1,n=[];let i,r=e===2?"<svg>":e===3?"<math>":"",o=k;for(let l=0;l<s;l++){const c=t[l];let u,a,h=-1,d=0;for(;d<c.length&&(o.lastIndex=d,a=o.exec(c),a!==null);)d=o.lastIndex,o===k?a[1]==="!--"?o=te:a[1]!==void 0?o=se:a[2]!==void 0?(ue.test(a[2])&&(i=RegExp("</"+a[2],"g")),o=$):a[3]!==void 0&&(o=$):o===$?a[0]===">"?(o=i??k,h=-1):a[1]===void 0?h=-2:(h=o.lastIndex-a[2].length,u=a[1],o=a[3]===void 0?$:a[3]==='"'?ie:ne):o===ie||o===ne?o=$:o===te||o===se?o=k:(o=$,i=void 0);const p=o===$&&t[l+1].startsWith("/>")?" ":"";r+=o===k?c+Pe:h>=0?(n.push(u),c.slice(0,h)+he+c.slice(h)+y+p):c+y+(h===-2?l:p)}return[pe(t,r+(t[s]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),n]};class M{constructor({strings:e,_$litType$:s},n){let i;this.parts=[];let r=0,o=0;const l=e.length-1,c=this.parts,[u,a]=Me(e,s);if(this.el=M.createElement(u,n),v.currentNode=this.el.content,s===2||s===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(i=v.nextNode())!==null&&c.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const h of i.getAttributeNames())if(h.endsWith(he)){const d=a[o++],p=i.getAttribute(h).split(y),m=/([.?@])?(.*)/.exec(d);c.push({type:1,index:r,name:m[2],strings:p,ctor:m[1]==="."?Le:m[1]==="?"?Ue:m[1]==="@"?He:R}),i.removeAttribute(h)}else h.startsWith(y)&&(c.push({type:6,index:r}),i.removeAttribute(h));if(ue.test(i.tagName)){const h=i.textContent.split(y),d=h.length-1;if(d>0){i.textContent=H?H.emptyScript:"";for(let p=0;p<d;p++)i.append(h[p],O()),v.nextNode(),c.push({type:2,index:++r});i.append(h[d],O())}}}else if(i.nodeType===8)if(i.data===de)c.push({type:2,index:r});else{let h=-1;for(;(h=i.data.indexOf(y,h+1))!==-1;)c.push({type:7,index:r}),h+=y.length-1}r++}}static createElement(e,s){const n=b.createElement("template");return n.innerHTML=e,n}}function A(t,e,s=t,n){if(e===w)return e;let i=n!==void 0?s._$Co?.[n]:s._$Cl;const r=T(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(t),i._$AT(t,s,n)),n!==void 0?(s._$Co??(s._$Co=[]))[n]=i:s._$Cl=i),i!==void 0&&(e=A(t,i._$AS(t,e.values),i,n)),e}class Ne{constructor(e,s){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:s},parts:n}=this._$AD,i=(e?.creationScope??b).importNode(s,!0);v.currentNode=i;let r=v.nextNode(),o=0,l=0,c=n[0];for(;c!==void 0;){if(o===c.index){let u;c.type===2?u=new N(r,r.nextSibling,this,e):c.type===1?u=new c.ctor(r,c.name,c.strings,this,e):c.type===6&&(u=new Re(r,this,e)),this._$AV.push(u),c=n[++l]}o!==c?.index&&(r=v.nextNode(),o++)}return v.currentNode=b,i}p(e){let s=0;for(const n of this._$AV)n!==void 0&&(n.strings!==void 0?(n._$AI(e,n,s),s+=n.strings.length-2):n._$AI(e[s])),s++}}class N{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,s,n,i){this.type=2,this._$AH=f,this._$AN=void 0,this._$AA=e,this._$AB=s,this._$AM=n,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&e?.nodeType===11&&(e=s.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,s=this){e=A(this,e,s),T(e)?e===f||e==null||e===""?(this._$AH!==f&&this._$AR(),this._$AH=f):e!==this._$AH&&e!==w&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Oe(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==f&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(b.createTextNode(e)),this._$AH=e}$(e){const{values:s,_$litType$:n}=e,i=typeof n=="number"?this._$AC(e):(n.el===void 0&&(n.el=M.createElement(pe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===i)this._$AH.p(s);else{const r=new Ne(i,this),o=r.u(this.options);r.p(s),this.T(o),this._$AH=r}}_$AC(e){let s=re.get(e.strings);return s===void 0&&re.set(e.strings,s=new M(e)),s}k(e){V(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let n,i=0;for(const r of e)i===s.length?s.push(n=new N(this.O(O()),this.O(O()),this,this.options)):n=s[i],n._$AI(r),i++;i<s.length&&(this._$AR(n&&n._$AB.nextSibling,i),s.length=i)}_$AR(e=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);e!==this._$AB;){const n=Q(e).nextSibling;Q(e).remove(),e=n}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class R{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,s,n,i,r){this.type=1,this._$AH=f,this._$AN=void 0,this.element=e,this.name=s,this._$AM=i,this.options=r,n.length>2||n[0]!==""||n[1]!==""?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=f}_$AI(e,s=this,n,i){const r=this.strings;let o=!1;if(r===void 0)e=A(this,e,s,0),o=!T(e)||e!==this._$AH&&e!==w,o&&(this._$AH=e);else{const l=e;let c,u;for(e=r[0],c=0;c<r.length-1;c++)u=A(this,l[n+c],s,c),u===w&&(u=this._$AH[c]),o||(o=!T(u)||u!==this._$AH[c]),u===f?e=f:e!==f&&(e+=(u??"")+r[c+1]),this._$AH[c]=u}o&&!i&&this.j(e)}j(e){e===f?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Le extends R{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===f?void 0:e}}class Ue extends R{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==f)}}class He extends R{constructor(e,s,n,i,r){super(e,s,n,i,r),this.type=5}_$AI(e,s=this){if((e=A(this,e,s,0)??f)===w)return;const n=this._$AH,i=e===f&&n!==f||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,r=e!==f&&(n===f||i);i&&this.element.removeEventListener(this.name,this,n),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Re{constructor(e,s,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=s,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){A(this,e)}}const qe=C.litHtmlPolyfillSupport;qe?.(M,N),(C.litHtmlVersions??(C.litHtmlVersions=[])).push("3.3.2");const De=(t,e,s)=>{const n=s?.renderBefore??e;let i=n._$litPart$;if(i===void 0){const r=s?.renderBefore??null;n._$litPart$=i=new N(e.insertBefore(O(),r),r,void 0,s??{})}return i._$AI(t),i};const I=globalThis;class P extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var s;const e=super.createRenderRoot();return(s=this.renderOptions).renderBefore??(s.renderBefore=e.firstChild),e}update(e){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=De(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return w}}P._$litElement$=!0,P.finalized=!0,I.litElementHydrateSupport?.({LitElement:P});const je=I.litElementPolyfillSupport;je?.({LitElement:P});(I.litElementVersions??(I.litElementVersions=[])).push("4.2.2");const Be=t=>(e,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)};const ze={attribute:!0,type:String,converter:U,reflect:!1,hasChanged:W},Ke=(t=ze,e,s)=>{const{kind:n,metadata:i}=s;let r=globalThis.litPropertyMetadata.get(i);if(r===void 0&&globalThis.litPropertyMetadata.set(i,r=new Map),n==="setter"&&((t=Object.create(t)).wrapped=!0),r.set(s.name,t),n==="accessor"){const{name:o}=s;return{set(l){const c=e.get.call(this);e.set.call(this,l),this.requestUpdate(o,c,t,!0,l)},init(l){return l!==void 0&&this.C(o,void 0,t,l),l}}}if(n==="setter"){const{name:o}=s;return function(l){const c=this[o];e.call(this,l),this.requestUpdate(o,c,t,!0,l)}}throw Error("Unsupported decorator location: "+n)};function We(t){return(e,s)=>typeof s=="object"?Ke(t,e,s):((n,i,r)=>{const o=i.hasOwnProperty(r);return i.constructor.createProperty(r,n),o?Object.getOwnPropertyDescriptor(i,r):void 0})(t,e,s)}function Y(t){return We({...t,state:!0,attribute:!1})}var Ve=Object.defineProperty,Ye=Object.getOwnPropertyDescriptor,q=(t,e,s,n)=>{for(var i=n>1?void 0:n?Ye(e,s):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(i=(n?o(e,s,i):o(i))||i);return n&&i&&Ve(e,s,i),i};let E=class extends P{constructor(){super(...arguments),this.open=!1,this.query="",this.activeIndex=0,this.items=[],this.handleGlobalKey=t=>{(t.metaKey||t.ctrlKey)&&t.key==="k"&&(t.preventDefault(),this.toggle()),t.key==="Escape"&&this.open&&this.close()}}connectedCallback(){super.connectedCallback(),this.buildItems(),window.addEventListener("keydown",this.handleGlobalKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this.handleGlobalKey)}toggle(){this.open=!this.open,this.open&&(this.query="",this.activeIndex=0,this.updateComplete.then(()=>{this.shadowRoot?.querySelector("input")?.focus()}))}close(){this.open=!1,this.query=""}async buildItems(){const t=[];t.push({label:"Logs",hint:"blog posts",href:"#logs-label",section:"navigate"}),t.push({label:"Work",hint:"projects",href:"#work-label",section:"navigate"}),t.push({label:"About",hint:"bio",href:"#about-label",section:"navigate"}),t.push({label:"Capabilities",hint:"skills",href:"#cap-label",section:"navigate"}),t.push({label:"Archive",hint:"all dispatches",href:"/logs/",section:"logs"});try{const e=await fetch("/content-index.json",{headers:{Accept:"application/json"}});if(!e.ok)throw new Error(`content index ${e.status}`);const s=await e.json();s.posts?.forEach(n=>{!n.title||!n.canonicalPath||t.push({label:n.title,hint:"post",href:n.canonicalPath,section:"logs"})}),s.topics?.forEach(n=>{!n.name||!n.slug||t.push({label:n.name,hint:"topic",href:`/topics/${n.slug}/`,section:"topics"})})}catch{document.querySelectorAll(".featured-log, .row a").forEach(e=>{const n=e.getAttribute("href");if(!n||!n.includes("/posts/"))return;const i=e.classList.contains("featured-log")?e.querySelector(".featured-title")?.textContent?.trim()||"":e.textContent?.trim()||"";i&&t.push({label:i,hint:"post",href:n,section:"logs"})})}t.push({label:"GitHub",hint:"github.com/clankamode",href:"https://github.com/clankamode",section:"links"}),t.push({label:"RSS Feed",hint:"subscribe",href:"/feed.xml",section:"links"}),this.items=t.filter((e,s,n)=>n.findIndex(i=>i.href===e.href)===s)}get filtered(){if(!this.query)return this.items;const t=this.query.toLowerCase();return this.items.filter(e=>e.label.toLowerCase().includes(t)||e.hint.toLowerCase().includes(t)||e.section.toLowerCase().includes(t))}navigate(t){this.close(),t.href.startsWith("http")?window.open(t.href,"_blank","noopener,noreferrer"):t.href.startsWith("#")?document.getElementById(t.href.slice(1))?.scrollIntoView({behavior:"smooth"}):window.location.href=t.href}handleInput(t){this.query=t.target.value,this.activeIndex=0}handleKeydown(t){const e=this.filtered;t.key==="ArrowDown"?(t.preventDefault(),this.activeIndex=Math.min(this.activeIndex+1,e.length-1)):t.key==="ArrowUp"?(t.preventDefault(),this.activeIndex=Math.max(this.activeIndex-1,0)):t.key==="Enter"&&e[this.activeIndex]&&(t.preventDefault(),this.navigate(e[this.activeIndex]))}highlightMatch(t){if(!this.query)return t;const e=this.query.toLowerCase(),s=t.toLowerCase().indexOf(e);if(s===-1)return t;const n=t.slice(0,s),i=t.slice(s,s+this.query.length),r=t.slice(s+this.query.length);return _`${n}<mark>${i}</mark>${r}`}renderItems(){const t=this.filtered;if(!t.length)return _`<div class="empty">no results for "${this.query}"</div>`;const e=new Map;for(const i of t){const r=e.get(i.section)||[];r.push(i),e.set(i.section,r)}const s=[];let n=0;for(const[i,r]of e){s.push(_`<div class="section-label">${i}</div>`);for(const o of r){const l=n++;s.push(_`
          <div
            class="item ${l===this.activeIndex?"active":""}"
            @click=${()=>this.navigate(o)}
            @mouseenter=${()=>{this.activeIndex=l}}
          >
            <span class="item-label">${this.highlightMatch(o.label)}</span>
            <span class="item-hint">${o.hint}</span>
          </div>
        `)}}return s}render(){return this.open?_`
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
    `:_``}};E.styles=be`
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
  `;q([Y()],E.prototype,"open",2);q([Y()],E.prototype,"query",2);q([Y()],E.prototype,"activeIndex",2);E=q([Be("clanka-cmdk")],E);let B=null;function Fe(t){if(!t||typeof t!="object")return!1;const e=t;return typeof e.generatedAt=="string"&&Array.isArray(e.posts)&&Array.isArray(e.topics)&&!!e.homepage&&Array.isArray(e.homepage.recent)&&Array.isArray(e.homepage.topics)&&!!e.homepage.counts&&Array.isArray(e.homepage.years)}async function et(){return B||(B=fetch("/content-index.json",{headers:{Accept:"application/json"}}).then(async t=>{if(!t.ok)throw new Error(`content index ${t.status}`);const e=await t.json();if(!Fe(e))throw new Error("invalid content index payload");return e})),B}function oe(t){const e=document.createElement("span");return e.className="archive-meta-badge",e.textContent=t,e}function tt(t,e,s=`${e}s`){const n=s===`${e}s`&&e.endsWith("ch")?`${e}es`:s;return`${t} ${t===1?e:n}`}function Ge(t){return`/topics/${t}/`}function Xe(t){const e=document.createElement("a");return e.className="topic-chip",e.href=Ge(t.slug),e.textContent=t.name,e}function st(t){const e=document.createElement("article");e.className="archive-card";const s=document.createElement("div");s.className="archive-card-kicker",s.textContent=`dispatch ${String(t.number).padStart(3,"0")} · ${t.date}`;const n=document.createElement("h2");n.className="archive-card-title";const i=document.createElement("a");i.href=t.canonicalPath,i.textContent=t.title,n.append(i);const r=document.createElement("p");r.className="archive-card-summary",r.textContent=t.summary;const o=document.createElement("div");o.className="archive-card-meta",o.append(oe(`${t.estimatedReadMinutes} min read`),oe(t.audio?"listen available":"read only"));const l=document.createElement("div");return l.className="topic-chip-row",t.topics.forEach(c=>{l.append(Xe(c))}),e.append(s,n,r,o,l),e}function nt(t){const e=document.createElement("div");e.className="row archive-preview-row";const s=document.createElement("div");s.className="archive-preview-main";const n=document.createElement("span");n.className="row-name";const i=document.createElement("a");i.href=t.canonicalPath,i.textContent=`${String(t.number).padStart(3,"0")}: ${t.title}`,n.append(i);const r=document.createElement("span");r.className="row-excerpt",r.textContent=t.summary,s.append(n,r);const o=document.createElement("div");o.className="archive-preview-meta";const l=document.createElement("span");l.className="row-meta",l.textContent=t.date;const c=document.createElement("span");return c.className="row-meta",c.textContent=t.audio?"listen":"read",o.append(l,c),e.append(s,o),e}function it(t,e){t.textContent="",e.forEach(s=>{const n=document.createElement("option");n.value=s.value,n.textContent=s.label,t.append(n)})}export{P as a,_ as b,nt as c,Xe as d,Ze as e,st as f,tt as g,be as i,et as l,We as n,it as p,Y as r,Be as t};
