import{i as C,r as l,a as E,b as i,t as A,n as H,l as se,c as K,d as re,e as ne}from"./content-browser-CcKiDIxM.js";const V="https://clanka-api.clankamode.workers.dev",oe=new Date("2026-02-19T00:00:00Z"),G=5e3,ie=Date.parse("2008-01-01T00:00:00Z"),ce=300*1e3;function le(e){if(typeof e!="string"||e.trim().length===0)return null;const t=Date.parse(e);if(!Number.isFinite(t))return null;const a=Date.now();return t<ie||t>a+ce?null:t}function Y(e){const t=Date.now()-e;if(!Number.isFinite(t)||t<0)return"just now";const a=Math.floor(t/1e3),r=Math.floor(a/60),s=Math.floor(r/60),n=Math.floor(s/24);return n>0?`${n}d ago`:s>0?`${s}h ago`:r>0?`${r}m ago`:"just now"}function de(){const e=Date.now()-oe.getTime();return Math.floor(e/(1e3*60*60*24))}function b(e,t){const a=document.getElementById(e);a&&(a.textContent=t)}async function pe(){b("stat-uptime",`// ${de()}d online`);try{const e=new AbortController,t=window.setTimeout(()=>e.abort(),G),a=await fetch(`${V}/github/stats`,{headers:{Accept:"application/json"},signal:e.signal});if(window.clearTimeout(t),!a.ok)throw new Error(`API ${a.status}`);const r=await a.json();b("stat-repos",`${r.repoCount} repos`),b("stat-stars",`${r.totalStars} stars`);const s=le(r.lastPushedAt),n=typeof r.lastPushedRepo=="string"?r.lastPushedRepo.trim():"";s===null?b("stat-last-commit","last push: unavailable"):n.length===0?b("stat-last-commit",`last push: ${Y(s)}`):b("stat-last-commit",`last push: ${Y(s)} (${n})`);const o=new AbortController,d=window.setTimeout(()=>o.abort(),G);try{const p=await fetch(`${V}/fleet/summary`,{headers:{Accept:"application/json"},signal:o.signal});if(window.clearTimeout(d),!p.ok)throw new Error(`API ${p.status}`);const u=await p.json(),c=Number(u.totalRepos);Number.isFinite(c)&&c>0&&b("stat-fleet-score",`fleet: ${c} repos`)}catch{}finally{window.clearTimeout(d)}}catch{}}const ue="https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager",me=5e3;async function fe(){const e=document.getElementById("npm-ci-triage");if(!e)return;let t=0;try{const a=new AbortController;t=window.setTimeout(()=>a.abort(),me);const r=await fetch(ue,{headers:{Accept:"application/json"},signal:a.signal});if(!r.ok)throw new Error(`NPM API ${r.status}`);const s=await r.json(),n=typeof s.downloads=="number"?s.downloads:null;if(n===null)throw new Error("Malformed downloads payload");e.textContent=`${n} dl/mo`}catch{e.textContent="–"}finally{window.clearTimeout(t)}}const ge="https://clanka-api.clankamode.workers.dev/github/events",he=5e3,J=["feat","fix","chore","docs","test","refactor","ci","build","style"];function ve(e){const t=new Date(e).getTime(),a=Date.now()-t,r=Math.floor(a/1e3),s=Math.floor(r/60),n=Math.floor(s/60),o=Math.floor(n/24);return o>0?`${o}d ago`:n>0?`${n}h ago`:s>0?`${s}m ago`:"just now"}function be(e){return e.replace(/^clankamode\//,"")}function xe(e){const a=e.trim().toLowerCase().match(/^([a-z]+)/),r=a?a[1]:"";return J.includes(r)?r:"push"}function ye(e){return Array.isArray(e)?e:Array.isArray(e.events)?e.events:[]}function W(e){const t=document.getElementById("commit-feed");if(!t)return;t.textContent="";const a=document.createElement("span");a.className="commit-feed-loading",a.textContent=e,t.append(a)}async function we(){const e=document.getElementById("commit-feed");if(e)try{const t=new AbortController,a=window.setTimeout(()=>t.abort(),he),r=await fetch(ge,{headers:{Accept:"application/json"},signal:t.signal});if(window.clearTimeout(a),!r.ok)throw new Error(`GitHub events API ${r.status}`);const s=await r.json(),n=ye(s);if(!Array.isArray(n)||n.length===0){W("// no activity data");return}e.textContent="",n.slice(0,8).forEach(o=>{const d=be(o.repo||"unknown"),p=o.message||"",u=xe(p),c=J.includes(u)?u:"push",f=document.createElement("div");f.className="commit-item";const g=document.createElement("span");g.className="commit-repo",g.textContent=d;const h=document.createElement("span");h.className=`commit-tag commit-tag--${c}`,h.textContent=u;const v=document.createElement("span");v.className="commit-time",v.textContent=o.timestamp?ve(o.timestamp):"just now",f.append(g,h,v),e.append(f)})}catch{W("// no activity data")}}const ke="https://clanka-api.clankamode.workers.dev",$e=15e3,q=new Map,F=new Map;function Ce(e){return`${ke}${e}`}async function Q(e,t=$e){const a=Ce(e),r=q.get(a),s=Date.now();if(r&&r.expiresAt>s)return r.data;const n=F.get(a);if(n)return n;const o=(async()=>{const d=await fetch(a,{headers:{Accept:"application/json"}});if(!d.ok)throw new Error(`API ${d.status}`);const p=await d.json();return q.set(a,{data:p,expiresAt:Date.now()+t}),p})();F.set(a,o);try{return await o}finally{F.delete(a)}}function Ee(){return Q("/now")}function Ae(){return Q("/fleet/summary")}var _e=Object.defineProperty,Te=Object.getOwnPropertyDescriptor,_=(e,t,a,r)=>{for(var s=r>1?void 0:r?Te(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(r?o(t,a,s):o(s))||s);return r&&s&&_e(t,a,s),s};let m=class extends E{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const e=await Ee();this.current=typeof e.current=="string"?e.current:"active",this.status=typeof e.status=="string"?e.status:"operational",this.history=Array.isArray(e.history)?e.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:e}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const e=this.status.toLowerCase();return i`
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
  `;_([l()],m.prototype,"current",2);_([l()],m.prototype,"status",2);_([l()],m.prototype,"history",2);_([l()],m.prototype,"loading",2);_([l()],m.prototype,"error",2);m=_([A("clanka-presence")],m);function ee(e){const t=Date.now()-new Date(e).getTime();return t<6e4?"just now":t<36e5?`${Math.floor(t/6e4)}m ago`:t<864e5?`${Math.floor(t/36e5)}h ago`:`${Math.floor(t/864e5)}d ago`}const Ie="https://clanka-api.clankamode.workers.dev";async function te(){const e=new AbortController,t=setTimeout(()=>e.abort(),5e3);try{const a=await fetch(`${Ie}/github/events`,{signal:e.signal});return a.ok?(await a.json()).events??[]:[]}catch{return[]}finally{clearTimeout(t)}}var Pe=Object.defineProperty,Oe=Object.getOwnPropertyDescriptor,N=(e,t,a,r)=>{for(var s=r>1?void 0:r?Oe(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(r?o(t,a,s):o(s))||s);return r&&s&&Pe(t,a,s),s};let w=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.loadData()}async loadData(){const e=await te();e.length===0?this.error="[ activity unavailable ]":this.events=e,this.loading=!1}render(){return i`
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
  `;N([l()],w.prototype,"events",2);N([l()],w.prototype,"loading",2);N([l()],w.prototype,"error",2);w=N([A("clanka-activity")],w);var De=Object.defineProperty,Me=Object.getOwnPropertyDescriptor,P=(e,t,a,r)=>{for(var s=r>1?void 0:r?Me(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(r?o(t,a,s):o(s))||s);return r&&s&&De(t,a,s),s};const O=["ops","infra","core","quality","policy","template"];let x=class extends E{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const e=await Ae(),t=this.extractRepos(e);if(!t.length)throw new Error("No fleet repos in payload");this.repos=t,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(e){const t=this.pickRepoArray(e);return t.length?t.map(a=>this.normalizeRepo(a)).filter(a=>a!==null).sort((a,r)=>{const s=O.indexOf(a.tier)-O.indexOf(r.tier);return s!==0?s:a.repo.localeCompare(r.repo)}):[]}pickRepoArray(e){if(!e||typeof e!="object")return[];const t=e;if(Array.isArray(t.repos))return t.repos;if(Array.isArray(t.fleet))return t.fleet;if(t.summary&&typeof t.summary=="object"){const a=t.summary;if(Array.isArray(a.repos))return a.repos;if(Array.isArray(a.fleet))return a.fleet}return[]}readOnlineState(e){if(typeof e.online=="boolean")return e.online;const t=String(e.status??e.state??"").trim().toLowerCase();return t?["offline","down","error","failed","degraded"].includes(t)?!1:["online","up","ok","healthy","active"].includes(t)?!0:null:null}normalizeRepo(e){if(!e||typeof e!="object")return null;const t=e,a=String(t.repo??t.name??t.full_name??"").trim(),r=String(t.tier??"").trim().toLowerCase(),s=String(t.criticality??t.priority??"").trim().toLowerCase(),n=this.readOnlineState(t);return!a||!O.includes(r)?null:["critical","high","medium"].includes(s)?{repo:a,tier:r,criticality:s,online:n}:{repo:a,tier:r,criticality:"medium",online:n}}shortName(e){return e.replace(/^clankamode\//,"")}render(){const e=O.map(t=>({tier:t,repos:this.repos.filter(a=>a.tier===t)})).filter(t=>t.repos.length>0);return i`
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
                    ${t.repos.map(a=>i`
                        <article class="card" role="listitem">
                          <div class="card-head">
                            <span class="repo">${this.shortName(a.repo)}</span>
                            ${a.online===null?null:i`
                                  <span class="status-pill ${a.online?"online":"offline"}">
                                    ${a.online?"● online":"● offline"}
                                  </span>
                                `}
                          </div>
                          <div class="tier-badge">${a.tier}</div>
                          <div class="criticality"><span class="dot ${a.criticality}" aria-hidden="true"></span>${a.criticality}</div>
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
  `;P([l()],x.prototype,"repos",2);P([l()],x.prototype,"live",2);P([l()],x.prototype,"loading",2);P([l()],x.prototype,"error",2);x=P([A("clanka-fleet")],x);var Se=Object.defineProperty,Ne=Object.getOwnPropertyDescriptor,j=(e,t,a,r)=>{for(var s=r>1?void 0:r?Ne(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(r?o(t,a,s):o(s))||s);return r&&s&&Se(t,a,s),s};let k=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.loadData()}async loadData(){const e=await te();e.length===0?this.error="[ offline — activity unavailable ]":this.events=e.slice(0,8),this.loading=!1}render(){return i`
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
  `;j([l()],k.prototype,"events",2);j([l()],k.prototype,"loading",2);j([l()],k.prototype,"error",2);k=j([A("clanka-terminal")],k);var je=Object.getOwnPropertyDescriptor,ze=(e,t,a,r)=>{for(var s=r>1?void 0:r?je(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=o(s)||s);return s};let U=class extends E{render(){return i`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        // agent orchestration is internal<br>
        // check <a href="https://github.com/clankamode" target="_blank">github.com/clankamode</a> for shipped work
      </div>
    `}};U.styles=C`
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
  `;U=ze([A("clanka-agents")],U);const Le=3;function Be(e){switch((e??"todo").trim().toLowerCase()){case"doing":return"doing";case"done":return"done";default:return"todo"}}function D(e,t){return String(e??t)}function Fe(e){return{statusClass:Be(e.status),statusLabel:D(e.status,"TODO"),title:D(e.title,"untitled"),assignee:D(e.assignee,"unassigned"),priority:D(e.priority,"?")}}var Re=Object.defineProperty,Ue=Object.getOwnPropertyDescriptor,z=(e,t,a,r)=>{for(var s=r>1?void 0:r?Ue(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(s=(r?o(t,a,s):o(s))||s);return r&&s&&Re(t,a,s),s};let $=class extends E{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}render(){return i`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?i`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:Le}).map(()=>i`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?i`<div class="fallback">${this.error}</div>`:this.tasks.length===0?i`<div class="fallback">[ no tasks ]</div>`:i`
                <div class="grid" role="list">
                  ${this.tasks.map(e=>{const t=Fe(e);return i`
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
  `;z([H({type:Array})],$.prototype,"tasks",2);z([H({type:Boolean})],$.prototype,"loading",2);z([H({type:String})],$.prototype,"error",2);$=z([A("clanka-tasks")],$);function R(e){const t=document.createElement("span");return t.className="featured-meta-badge",t.textContent=e,t}async function He(){const e=document.getElementById("homepage-featured-log"),t=document.getElementById("homepage-log-preview"),a=document.getElementById("homepage-topic-preview"),r=document.getElementById("stat-posts"),s=document.getElementById("stat-audio-posts"),n=document.getElementById("logs-archive-link-count"),{featured:o,recent:d,topics:p,counts:u}=(await se()).homepage;if(e&&o){e.textContent="";const c=document.createElement("a");c.className="featured-log",c.href=o.canonicalPath;const f=document.createElement("span");f.className="featured-kicker",f.textContent=`latest dispatch · ${o.date}`;const g=document.createElement("span");g.className="featured-title",g.textContent=`${String(o.number).padStart(3,"0")}: ${o.title}`;const h=document.createElement("div");h.className="featured-meta",h.append(R(`${o.estimatedReadMinutes} min read`),R(o.audio?"audio available":"text only"),R(`${o.topics.length} topic lanes`));const v=document.createElement("span");v.className="featured-snippet",v.textContent=o.summary;const L=document.createElement("div");L.className="topic-chip-row featured-topic-row",o.topics.slice(0,3).forEach(ae=>{L.append(K(ae))});const B=document.createElement("span");B.className="featured-read",B.textContent="open dispatch",c.append(f,g,h,v,L,B),e.append(c)}t&&(t.textContent="",d.filter(c=>c.slug!==o?.slug).slice(0,5).forEach(c=>{t.append(re(c))})),a&&(a.textContent="",p.forEach(c=>{a.append(K(c))})),r&&(r.textContent=`${String(u.posts).padStart(3,"0")} posts`),s&&(s.textContent=`${String(u.audioPosts).padStart(3,"0")} with audio`),n&&(n.textContent=`browse all ${u.posts} dispatches`)}const M=document.getElementById("presence"),T=document.getElementById("activity"),y=document.getElementById("terminal"),X=document.getElementById("agents"),I=document.getElementById("tasks"),Z=(e,t)=>{const a=document.getElementById(e);a&&(a.textContent=t)},Ke=new Set(["active","online","busy","running","healthy","up"]),Ve=e=>{if(!e||typeof e!="object")return null;const t=Object.values(e).filter(s=>s!==null&&typeof s=="object");if(!t.length)return null;let a=0,r=0;return t.forEach(s=>{const n=String(s.status??s.state??s.presence??"").trim().toLowerCase();n&&(r+=1,Ke.has(n)&&(a+=1))}),r>0?a:t.length},Ge=e=>typeof e.agents_active=="number"&&Number.isFinite(e.agents_active)&&e.agents_active>=0?Math.floor(e.agents_active):Ve(e.team),S=({loading:e,error:t})=>{T&&(T.loading=e,T.error=t||""),y&&(y.loading=e,y.error=t||""),I&&(I.loading=e,I.error=t||"")};S({loading:!0,error:""});M&&(M.addEventListener("sync-state",e=>{const a=e.detail||{loading:!1,error:"[ api unreachable ]"};S(a)}),M.addEventListener("sync-updated",e=>{const a=e.detail||{};T&&(T.history=a.history||[]),y&&(y.team=a.team||{},y.recentActivity=a.history||[]),X&&(X.team=a.team||{}),I&&(I.tasks=a.tasks||[]);const r=Ge(a);r!==null&&Z("stat-active-agents",`agents: ${r} active`),S({loading:!1,error:""})}),M.addEventListener("sync-error",e=>{const a=e.detail?.error||"[ api unreachable ]";Z("stat-active-agents","agents: offline"),S({loading:!1,error:a})}));ne();He();pe();fe();we();
