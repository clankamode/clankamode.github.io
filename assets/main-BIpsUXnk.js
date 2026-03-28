import{i as C,r as l,a as E,b as i,t as A,n as U,l as se,c as V,d as ne,e as oe}from"./content-browser-p5-G7IT8.js";const W="https://clanka-api.clankamode.workers.dev",ie=new Date("2026-02-19T00:00:00Z"),K=5e3,ce=Date.parse("2008-01-01T00:00:00Z"),le=300*1e3;function de(e){if(typeof e!="string"||e.trim().length===0)return null;const t=Date.parse(e);if(!Number.isFinite(t))return null;const r=Date.now();return t<ce||t>r+le?null:t}function G(e){const t=Date.now()-e;if(!Number.isFinite(t)||t<0)return"just now";const r=Math.floor(t/1e3),a=Math.floor(r/60),s=Math.floor(a/60),n=Math.floor(s/24);return n>0?`${n}d ago`:s>0?`${s}h ago`:a>0?`${a}m ago`:"just now"}function pe(){const e=Date.now()-ie.getTime();return Math.floor(e/(1e3*60*60*24))}function b(e,t){const r=document.getElementById(e);r&&(r.textContent=t)}async function ue(){b("stat-uptime",`// ${pe()}d online`);try{const e=new AbortController,t=window.setTimeout(()=>e.abort(),K),r=await fetch(`${W}/github/stats`,{headers:{Accept:"application/json"},signal:e.signal});if(window.clearTimeout(t),!r.ok)throw new Error(`API ${r.status}`);const a=await r.json();b("stat-repos",`${a.repoCount} repos`),b("stat-stars",`${a.totalStars} stars`);const s=de(a.lastPushedAt),n=typeof a.lastPushedRepo=="string"?a.lastPushedRepo.trim():"";s===null?b("stat-last-commit","last push: unavailable"):n.length===0?b("stat-last-commit",`last push: ${G(s)}`):b("stat-last-commit",`last push: ${G(s)} (${n})`);const o=new AbortController,d=window.setTimeout(()=>o.abort(),K);try{const p=await fetch(`${W}/fleet/summary`,{headers:{Accept:"application/json"},signal:o.signal});if(window.clearTimeout(d),!p.ok)throw new Error(`API ${p.status}`);const u=await p.json(),c=Number(u.totalRepos);Number.isFinite(c)&&c>0&&b("stat-fleet-score",`fleet: ${c} repos`)}catch{}finally{window.clearTimeout(d)}}catch{}}const me="https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager",fe=5e3;async function he(){const e=document.getElementById("npm-ci-triage");if(!e)return;let t=0;try{const r=new AbortController;t=window.setTimeout(()=>r.abort(),fe);const a=await fetch(me,{headers:{Accept:"application/json"},signal:r.signal});if(!a.ok)throw new Error(`NPM API ${a.status}`);const s=await a.json(),n=typeof s.downloads=="number"?s.downloads:null;if(n===null)throw new Error("Malformed downloads payload");e.textContent=`${n} dl/mo`}catch{e.textContent="–"}finally{window.clearTimeout(t)}}const ge="https://clanka-api.clankamode.workers.dev/github/events",ve=5e3,J=["feat","fix","chore","docs","test","refactor","ci","build","style"];function be(e){const t=new Date(e).getTime(),r=Date.now()-t,a=Math.floor(r/1e3),s=Math.floor(a/60),n=Math.floor(s/60),o=Math.floor(n/24);return o>0?`${o}d ago`:n>0?`${n}h ago`:s>0?`${s}m ago`:"just now"}function xe(e){return e.replace(/^clankamode\//,"")}function ye(e){const r=e.trim().toLowerCase().match(/^([a-z]+)/),a=r?r[1]:"";return J.includes(a)?a:"push"}function we(e){return Array.isArray(e)?e:Array.isArray(e.events)?e.events:[]}function Y(e){const t=document.getElementById("commit-feed");if(!t)return;t.textContent="";const r=document.createElement("span");r.className="commit-feed-loading",r.textContent=e,t.append(r)}async function ke(){const e=document.getElementById("commit-feed");if(e)try{const t=new AbortController,r=window.setTimeout(()=>t.abort(),ve),a=await fetch(ge,{headers:{Accept:"application/json"},signal:t.signal});if(window.clearTimeout(r),!a.ok)throw new Error(`GitHub events API ${a.status}`);const s=await a.json(),n=we(s);if(!Array.isArray(n)||n.length===0){Y("// no activity data");return}e.textContent="",n.slice(0,8).forEach(o=>{const d=xe(o.repo||"unknown"),p=o.message||"",u=ye(p),c=J.includes(u)?u:"push",f=document.createElement("div");f.className="commit-item";const h=document.createElement("span");h.className="commit-repo",h.textContent=d;const g=document.createElement("span");g.className=`commit-tag commit-tag--${c}`,g.textContent=u;const v=document.createElement("span");v.className="commit-time",v.textContent=o.timestamp?be(o.timestamp):"just now",f.append(h,g,v),e.append(f)})}catch{Y("// no activity data")}}const $e="https://clanka-api.clankamode.workers.dev",Ce=15e3,q=new Map,F=new Map;function Ee(e){return`${$e}${e}`}async function Q(e,t=Ce){const r=Ee(e),a=q.get(r),s=Date.now();if(a&&a.expiresAt>s)return a.data;const n=F.get(r);if(n)return n;const o=(async()=>{const d=await fetch(r,{headers:{Accept:"application/json"}});if(!d.ok)throw new Error(`API ${d.status}`);const p=await d.json();return q.set(r,{data:p,expiresAt:Date.now()+t}),p})();F.set(r,o);try{return await o}finally{F.delete(r)}}function Ae(){return Q("/now")}function _e(){return Q("/fleet/summary")}var Ie=Object.defineProperty,Oe=Object.getOwnPropertyDescriptor,_=(e,t,r,a)=>{for(var s=a>1?void 0:a?Oe(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(a?o(t,r,s):o(s))||s);return a&&s&&Ie(t,r,s),s};let m=class extends E{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const e=await Ae();this.current=typeof e.current=="string"?e.current:"active",this.status=typeof e.status=="string"?e.status:"operational",this.history=Array.isArray(e.history)?e.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:e}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const e=this.status.toLowerCase();return i`
      <div class="hd">
        <span class="hd-name">CLANKA ⚡</span>
        <span class="hd-status">
          <span class="dot ${e==="thinking"?"thinking":""}" style=${e==="offline"?"opacity:.4":""}></span>
          ${this.loading?"SYNCING":this.status.toUpperCase()}
        </span>
      </div>
      <div class="presence-block">
        <span class="presence-label">// currently:</span>
        ${this.loading?i`<span class="loading"> [ loading... ]</span><div class="skeleton" aria-hidden="true"></div>`:this.error?i`<span class="error"> ${this.error}</span>`:i` ${this.current}`}
      </div>
    `}};m.styles=C`
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
  `;_([l()],m.prototype,"current",2);_([l()],m.prototype,"status",2);_([l()],m.prototype,"history",2);_([l()],m.prototype,"loading",2);_([l()],m.prototype,"error",2);m=_([A("clanka-presence")],m);function ee(e){const t=Date.now()-new Date(e).getTime();return t<6e4?"just now":t<36e5?`${Math.floor(t/6e4)}m ago`:t<864e5?`${Math.floor(t/36e5)}h ago`:`${Math.floor(t/864e5)}d ago`}const Te="https://clanka-api.clankamode.workers.dev";async function te(){const e=new AbortController,t=setTimeout(()=>e.abort(),5e3);try{const r=await fetch(`${Te}/github/events`,{signal:e.signal});return r.ok?(await r.json()).events??[]:[]}catch{return[]}finally{clearTimeout(t)}}var Pe=Object.defineProperty,Ne=Object.getOwnPropertyDescriptor,S=(e,t,r,a)=>{for(var s=a>1?void 0:a?Ne(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(a?o(t,r,s):o(s))||s);return a&&s&&Pe(t,r,s),s};let w=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.scheduleLoadWhenNearViewport()}disconnectedCallback(){this.viewportObserver?.disconnect(),this.viewportObserver=void 0,super.disconnectedCallback()}scheduleLoadWhenNearViewport(){if((()=>{const r=this.getBoundingClientRect(),a=window.innerHeight;return r.top<a+900&&r.bottom>-900})()){this.loadData();return}if(typeof IntersectionObserver>"u"){this.loadData();return}this.viewportObserver=new IntersectionObserver(r=>{r.some(a=>a.isIntersecting)&&(this.viewportObserver?.disconnect(),this.viewportObserver=void 0,this.loadData())},{rootMargin:"0px 0px 900px 0px",threshold:0}),this.viewportObserver.observe(this)}async loadData(){const e=await te();e.length===0?this.error="[ activity unavailable ]":this.events=e,this.loading=!1}render(){return i`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.loading?i`<div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>`:this.error?i`<div class="status-fallback">${this.error}</div>`:this.events.map(e=>i`
            <div class="row" role="listitem">
              <span class="row-name"><span class="tag">[${e.type}]</span> ${e.repo}: ${e.message}</span>
              <span class="row-meta">${ee(e.timestamp)}</span>
            </div>
          `)}
    `}};w.styles=C`
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
  `;S([l()],w.prototype,"events",2);S([l()],w.prototype,"loading",2);S([l()],w.prototype,"error",2);w=S([A("clanka-activity")],w);var De=Object.defineProperty,Me=Object.getOwnPropertyDescriptor,T=(e,t,r,a)=>{for(var s=a>1?void 0:a?Me(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(a?o(t,r,s):o(s))||s);return a&&s&&De(t,r,s),s};const P=["ops","infra","core","quality","policy","template"];let x=class extends E{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.scheduleLoadWhenNearViewport()}disconnectedCallback(){this.viewportObserver?.disconnect(),this.viewportObserver=void 0,super.disconnectedCallback()}scheduleLoadWhenNearViewport(){if((()=>{const r=this.getBoundingClientRect(),a=window.innerHeight;return r.top<a+900&&r.bottom>-900})()){this.loadFleet();return}if(typeof IntersectionObserver>"u"){this.loadFleet();return}this.viewportObserver=new IntersectionObserver(r=>{r.some(a=>a.isIntersecting)&&(this.viewportObserver?.disconnect(),this.viewportObserver=void 0,this.loadFleet())},{rootMargin:"0px 0px 900px 0px",threshold:0}),this.viewportObserver.observe(this)}async loadFleet(){this.loading=!0,this.error="";try{const e=await _e(),t=this.extractRepos(e);if(!t.length)throw new Error("No fleet repos in payload");this.repos=t,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(e){const t=this.pickRepoArray(e);return t.length?t.map(r=>this.normalizeRepo(r)).filter(r=>r!==null).sort((r,a)=>{const s=P.indexOf(r.tier)-P.indexOf(a.tier);return s!==0?s:r.repo.localeCompare(a.repo)}):[]}pickRepoArray(e){if(!e||typeof e!="object")return[];const t=e;if(Array.isArray(t.repos))return t.repos;if(Array.isArray(t.fleet))return t.fleet;if(t.summary&&typeof t.summary=="object"){const r=t.summary;if(Array.isArray(r.repos))return r.repos;if(Array.isArray(r.fleet))return r.fleet}return[]}readOnlineState(e){if(typeof e.online=="boolean")return e.online;const t=String(e.status??e.state??"").trim().toLowerCase();return t?["offline","down","error","failed","degraded"].includes(t)?!1:["online","up","ok","healthy","active"].includes(t)?!0:null:null}normalizeRepo(e){if(!e||typeof e!="object")return null;const t=e,r=String(t.repo??t.name??t.full_name??"").trim(),a=String(t.tier??"").trim().toLowerCase(),s=String(t.criticality??t.priority??"").trim().toLowerCase(),n=this.readOnlineState(t);return!r||!P.includes(a)?null:["critical","high","medium"].includes(s)?{repo:r,tier:a,criticality:s,online:n}:{repo:r,tier:a,criticality:"medium",online:n}}shortName(e){return e.replace(/^clankamode\//,"")}render(){const e=P.map(t=>({tier:t,repos:this.repos.filter(r=>r.tier===t)})).filter(t=>t.repos.length>0);return i`
      <div class="sec-header">
        <span class="sec-label">fleet</span>
        <div class="sec-line"></div>
        <span class="sync ${this.live?"live":""}">
          ${this.loading?"SYNCING":this.live?"LIVE":"OFFLINE"}
        </span>
      </div>

      ${this.loading?i`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid" aria-hidden="true">
              ${Array.from({length:6}).map(()=>i`<div class="skeleton-card">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>`)}
            </div>
          `:this.error?i`<div class="fallback">${this.error}</div>`:e.map(t=>i`
                <div class="tier-group">
                  <div class="tier-title">${t.tier}</div>
                  <div class="grid" role="list">
                    ${t.repos.map(r=>i`
                        <article class="card" role="listitem">
                          <div class="card-head">
                            <span class="repo">${this.shortName(r.repo)}</span>
                            ${r.online===null?null:i`
                                  <span class="status-pill ${r.online?"online":"offline"}">
                                    ${r.online?"● online":"● offline"}
                                  </span>
                                `}
                          </div>
                          <div class="tier-badge">${r.tier}</div>
                          <div class="criticality"><span class="dot ${r.criticality}" aria-hidden="true"></span>${r.criticality}</div>
                        </article>
                      `)}
                  </div>
                </div>
              `)}
    `}};x.styles=C`
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
  `;T([l()],x.prototype,"repos",2);T([l()],x.prototype,"live",2);T([l()],x.prototype,"loading",2);T([l()],x.prototype,"error",2);x=T([A("clanka-fleet")],x);var Se=Object.defineProperty,je=Object.getOwnPropertyDescriptor,j=(e,t,r,a)=>{for(var s=a>1?void 0:a?je(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(a?o(t,r,s):o(s))||s);return a&&s&&Se(t,r,s),s};let k=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.loadData()}async loadData(){const e=await te();e.length===0?this.error="[ offline — activity unavailable ]":this.events=e.slice(0,8),this.loading=!1}render(){return i`
      <div class="sec-header">
        <span class="sec-label">terminal</span>
        <div class="sec-line"></div>
      </div>
      <div class="terminal" role="log" aria-label="Terminal output">
        <div class="line prompt">clanka@fleet:~$ git log --oneline --all-repos</div>
        ${this.loading?i`<div class="line dim">[ fetching activity... ]<span class="cursor"></span></div>`:this.error?i`<div class="line dim">${this.error}</div>`:this.events.map(e=>i`
              <div class="line"><span class="tag">[${e.type}]</span> <span class="repo">${e.repo}:</span> <span class="msg">"${e.message}"</span>  <span class="ts">· ${ee(e.timestamp)}</span></div>
            `)}
        ${this.loading?"":i`<div class="line prompt">clanka@fleet:~$ <span class="cursor"></span></div>`}
      </div>
    `}};k.styles=C`
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
  `;j([l()],k.prototype,"events",2);j([l()],k.prototype,"loading",2);j([l()],k.prototype,"error",2);k=j([A("clanka-terminal")],k);var ze=Object.getOwnPropertyDescriptor,Le=(e,t,r,a)=>{for(var s=a>1?void 0:a?ze(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=o(s)||s);return s};let H=class extends E{render(){return i`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        // agent orchestration is internal<br>
        // check <a href="https://github.com/clankamode" target="_blank">github.com/clankamode</a> for shipped work
      </div>
    `}};H.styles=C`
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
  `;H=Le([A("clanka-agents")],H);const Be=3;function Fe(e){switch((e??"todo").trim().toLowerCase()){case"doing":return"doing";case"done":return"done";default:return"todo"}}function N(e,t){return String(e??t)}function Re(e){return{statusClass:Fe(e.status),statusLabel:N(e.status,"TODO"),title:N(e.title,"untitled"),assignee:N(e.assignee,"unassigned"),priority:N(e.priority,"?")}}var He=Object.defineProperty,Ue=Object.getOwnPropertyDescriptor,z=(e,t,r,a)=>{for(var s=a>1?void 0:a?Ue(t,r):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(a?o(t,r,s):o(s))||s);return a&&s&&He(t,r,s),s};let $=class extends E{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}render(){return i`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?i`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:Be}).map(()=>i`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?i`<div class="fallback">${this.error}</div>`:this.tasks.length===0?i`<div class="fallback">[ no tasks ]</div>`:i`
                <div class="grid" role="list">
                  ${this.tasks.map(e=>{const t=Re(e);return i`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${t.statusClass}">${t.statusLabel}</div>
                        <div class="task-title">${t.title}</div>
                        <div class="task-meta">
                          <span>@${t.assignee}</span>
                          <span>P${t.priority}</span>
                        </div>
                      </article>
                    `})}
                </div>
              `}
    `}};$.styles=C`
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
  `;z([U({type:Array})],$.prototype,"tasks",2);z([U({type:Boolean})],$.prototype,"loading",2);z([U({type:String})],$.prototype,"error",2);$=z([A("clanka-tasks")],$);function R(e){const t=document.createElement("span");return t.className="featured-meta-badge",t.textContent=e,t}async function Ve(){const e=document.getElementById("homepage-featured-log"),t=document.getElementById("homepage-log-preview"),r=document.getElementById("homepage-topic-preview"),a=document.getElementById("stat-posts"),s=document.getElementById("stat-audio-posts"),n=document.getElementById("logs-archive-link-count"),{featured:o,recent:d,topics:p,counts:u}=(await se()).homepage;if(e&&o){e.textContent="";const c=document.createElement("a");c.className="featured-log",c.href=o.canonicalPath;const f=document.createElement("span");f.className="featured-kicker",f.textContent=`latest dispatch · ${o.date}`;const h=document.createElement("span");h.className="featured-title",h.textContent=`${String(o.number).padStart(3,"0")}: ${o.title}`;const g=document.createElement("div");g.className="featured-meta",g.append(R(`${o.estimatedReadMinutes} min read`),R(o.audio?"audio available":"text only"),R(`${o.topics.length} topic lanes`));const v=document.createElement("span");v.className="featured-snippet",v.textContent=o.summary;const L=document.createElement("div");L.className="topic-chip-row featured-topic-row",o.topics.slice(0,3).forEach(ae=>{L.append(V(ae))});const B=document.createElement("span");B.className="featured-read",B.textContent="open dispatch",c.append(f,h,g,v,L,B),e.append(c)}t&&(t.textContent="",d.filter(c=>c.slug!==o?.slug).slice(0,5).forEach(c=>{t.append(ne(c))})),r&&(r.textContent="",p.slice(0,6).forEach(c=>{r.append(V(c))})),a&&(a.textContent=`${String(u.posts).padStart(3,"0")} posts`),s&&(s.textContent=`${String(u.audioPosts).padStart(3,"0")} with audio`),n&&(n.textContent=`browse all ${u.posts} dispatches`)}const We=900;function re(e,t,r=We){const a=typeof e=="string"?document.querySelector(e):e;if(!a)return;if((()=>{const o=a.getBoundingClientRect(),d=window.innerHeight;return o.top<d+r&&o.bottom>-r})()){t();return}if(typeof IntersectionObserver>"u"){t();return}const n=new IntersectionObserver(o=>{o.some(d=>d.isIntersecting)&&(n.disconnect(),t())},{root:null,rootMargin:`0px 0px ${r}px 0px`,threshold:0});n.observe(a)}const D=document.getElementById("presence"),I=document.getElementById("activity"),y=document.getElementById("terminal"),X=document.getElementById("agents"),O=document.getElementById("tasks"),Z=(e,t)=>{const r=document.getElementById(e);r&&(r.textContent=t)},Ke=new Set(["active","online","busy","running","healthy","up"]),Ge=e=>{if(!e||typeof e!="object")return null;const t=Object.values(e).filter(s=>s!==null&&typeof s=="object");if(!t.length)return null;let r=0,a=0;return t.forEach(s=>{const n=String(s.status??s.state??s.presence??"").trim().toLowerCase();n&&(a+=1,Ke.has(n)&&(r+=1))}),a>0?r:t.length},Ye=e=>typeof e.agents_active=="number"&&Number.isFinite(e.agents_active)&&e.agents_active>=0?Math.floor(e.agents_active):Ge(e.team),M=({loading:e,error:t})=>{I&&(I.loading=e,I.error=t||""),y&&(y.loading=e,y.error=t||""),O&&(O.loading=e,O.error=t||"")};M({loading:!0,error:""});D&&(D.addEventListener("sync-state",e=>{const r=e.detail||{loading:!1,error:"[ api unreachable ]"};M(r)}),D.addEventListener("sync-updated",e=>{const r=e.detail||{};I&&(I.history=r.history||[]),y&&(y.team=r.team||{},y.recentActivity=r.history||[]),X&&(X.team=r.team||{}),O&&(O.tasks=r.tasks||[]);const a=Ye(r);a!==null&&Z("stat-active-agents",`agents: ${a} active`),M({loading:!1,error:""})}),D.addEventListener("sync-error",e=>{const r=e.detail?.error||"[ api unreachable ]";Z("stat-active-agents","agents: offline"),M({loading:!1,error:r})}));oe();re(".logs-section",()=>{Ve()});ue();he();re('[aria-labelledby="activity-label"]',()=>{ke()});
