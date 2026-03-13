import{i as C,r as p,a as E,b as i,t as A,n as F,l as J,c as Q,d as ee,e as te}from"./content-browser-Dr4Zjpsu.js";const H="https://clanka-api.clankamode.workers.dev",ae=new Date("2026-02-19T00:00:00Z"),R=5e3,re=Date.parse("2008-01-01T00:00:00Z"),se=300*1e3;function ne(e){if(typeof e!="string"||e.trim().length===0)return null;const t=Date.parse(e);if(!Number.isFinite(t))return null;const a=Date.now();return t<re||t>a+se?null:t}function U(e){const t=Date.now()-e;if(!Number.isFinite(t)||t<0)return"just now";const a=Math.floor(t/1e3),s=Math.floor(a/60),r=Math.floor(s/60),n=Math.floor(r/24);return n>0?`${n}d ago`:r>0?`${r}h ago`:s>0?`${s}m ago`:"just now"}function oe(){const e=Date.now()-ae.getTime();return Math.floor(e/(1e3*60*60*24))}function b(e,t){const a=document.getElementById(e);a&&(a.textContent=t)}async function ie(){b("stat-uptime",`// ${oe()}d online`);try{const e=new AbortController,t=window.setTimeout(()=>e.abort(),R),a=await fetch(`${H}/github/stats`,{headers:{Accept:"application/json"},signal:e.signal});if(window.clearTimeout(t),!a.ok)throw new Error(`API ${a.status}`);const s=await a.json();b("stat-repos",`${s.repoCount} repos`),b("stat-stars",`${s.totalStars} stars`);const r=ne(s.lastPushedAt),n=typeof s.lastPushedRepo=="string"?s.lastPushedRepo.trim():"";r===null?b("stat-last-commit","last push: unavailable"):n.length===0?b("stat-last-commit",`last push: ${U(r)}`):b("stat-last-commit",`last push: ${U(r)} (${n})`);const o=new AbortController,u=window.setTimeout(()=>o.abort(),R);try{const d=await fetch(`${H}/fleet/score`,{headers:{Accept:"application/json"},signal:o.signal});if(window.clearTimeout(u),!d.ok)throw new Error(`API ${d.status}`);const m=await d.json(),c=Number(m.score);Number.isFinite(c)&&b("stat-fleet-score",`fleet: ${Math.round(c)}%`)}catch{}finally{window.clearTimeout(u)}}catch{}}const ce="https://api.npmjs.org/downloads/point/last-month/@clankamode%2Fci-failure-triager",le=5e3;async function de(){const e=document.getElementById("npm-ci-triage");if(!e)return;let t=0;try{const a=new AbortController;t=window.setTimeout(()=>a.abort(),le);const s=await fetch(ce,{headers:{Accept:"application/json"},signal:a.signal});if(!s.ok)throw new Error(`NPM API ${s.status}`);const r=await s.json(),n=typeof r.downloads=="number"?r.downloads:null;if(n===null)throw new Error("Malformed downloads payload");e.textContent=`${n} dl/mo`}catch{}finally{window.clearTimeout(t)}}const pe="https://clanka-api.clankamode.workers.dev/github/events",ue=5e3,K=["feat","fix","chore","docs","test","refactor","ci","build","style"];function me(e){const t=new Date(e).getTime(),a=Date.now()-t,s=Math.floor(a/1e3),r=Math.floor(s/60),n=Math.floor(r/60),o=Math.floor(n/24);return o>0?`${o}d ago`:n>0?`${n}h ago`:r>0?`${r}m ago`:"just now"}function fe(e){return e.replace(/^clankamode\//,"")}function ge(e){const a=e.trim().toLowerCase().match(/^([a-z]+)/),s=a?a[1]:"";return K.includes(s)?s:"push"}function he(e){return`${e} commit${e===1?"":"s"}`}function q(e){const t=document.getElementById("commit-feed");if(!t)return;t.textContent="";const a=document.createElement("span");a.className="commit-feed-loading",a.textContent=e,t.append(a)}async function ve(){const e=document.getElementById("commit-feed");if(e)try{const t=new AbortController,a=window.setTimeout(()=>t.abort(),ue),s=await fetch(pe,{headers:{Accept:"application/json"},signal:t.signal});if(window.clearTimeout(a),!s.ok)throw new Error(`GitHub events API ${s.status}`);const r=await s.json();if(!Array.isArray(r)||r.length===0){q("// no activity data");return}e.textContent="",r.slice(0,8).forEach(n=>{const o=fe(n.repo||"unknown"),u=Array.isArray(n.commits)?n.commits.length:0,d=Array.isArray(n.commits)&&n.commits.length>0?n.commits[0].message:"",m=ge(d),c=K.includes(m)?m:"push",l=document.createElement("div");l.className="commit-item";const g=document.createElement("span");g.className="commit-repo",g.textContent=o;const h=document.createElement("span");h.className=`commit-tag commit-tag--${c}`,h.textContent=m;const v=document.createElement("span");v.className="commit-count",v.textContent=he(u);const z=document.createElement("span");z.className="commit-time",z.textContent=n.pushedAt?me(n.pushedAt):"just now",l.append(g,h,v,z),e.append(l)})}catch{q("// no activity data")}}const be="https://clanka-api.clankamode.workers.dev",ye=15e3,G=new Map,L=new Map;function xe(e){return`${be}${e}`}async function W(e,t=ye){const a=xe(e),s=G.get(a),r=Date.now();if(s&&s.expiresAt>r)return s.data;const n=L.get(a);if(n)return n;const o=(async()=>{const u=await fetch(a,{headers:{Accept:"application/json"}});if(!u.ok)throw new Error(`API ${u.status}`);const d=await u.json();return G.set(a,{data:d,expiresAt:Date.now()+t}),d})();L.set(a,o);try{return await o}finally{L.delete(a)}}function we(){return W("/now")}function ke(){return W("/fleet/summary")}var $e=Object.defineProperty,Ce=Object.getOwnPropertyDescriptor,T=(e,t,a,s)=>{for(var r=s>1?void 0:s?Ce(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=(s?o(t,a,r):o(r))||r);return s&&r&&$e(t,a,r),r};let f=class extends E{constructor(){super(...arguments),this.current="[ loading... ]",this.status="OPERATIONAL",this.history=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Clanka live presence"),this.hasAttribute("tabindex")||(this.tabIndex=0)}disconnectedCallback(){this.pollId&&window.clearInterval(this.pollId),super.disconnectedCallback()}async firstUpdated(){await this.updatePresence(),this.pollId=window.setInterval(()=>this.updatePresence(),3e4)}async updatePresence(){this.loading=!0,this.error="",this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!0,error:""}}));try{const e=await we();this.current=typeof e.current=="string"?e.current:"active",this.status=typeof e.status=="string"?e.status:"operational",this.history=Array.isArray(e.history)?e.history:[],this.dispatchEvent(new CustomEvent("sync-updated",{detail:e}))}catch{this.error="[ api unreachable ]",this.current="[ offline ]",this.status="offline",this.dispatchEvent(new CustomEvent("sync-error",{detail:{error:this.error}}))}finally{this.loading=!1,this.dispatchEvent(new CustomEvent("sync-state",{detail:{loading:!1,error:this.error}}))}}render(){const e=this.status.toLowerCase();return i`
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
    `}};f.styles=C`
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
  `;T([p()],f.prototype,"current",2);T([p()],f.prototype,"status",2);T([p()],f.prototype,"history",2);T([p()],f.prototype,"loading",2);T([p()],f.prototype,"error",2);f=T([A("clanka-presence")],f);function X(e){const t=Date.now()-new Date(e).getTime();return t<6e4?"just now":t<36e5?`${Math.floor(t/6e4)}m ago`:t<864e5?`${Math.floor(t/36e5)}h ago`:`${Math.floor(t/864e5)}d ago`}const Ee="https://clanka-api.clankamode.workers.dev";async function Z(){const e=new AbortController,t=setTimeout(()=>e.abort(),5e3);try{const a=await fetch(`${Ee}/github/events`,{signal:e.signal});return a.ok?(await a.json()).events??[]:[]}catch{return[]}finally{clearTimeout(t)}}var Ae=Object.defineProperty,Te=Object.getOwnPropertyDescriptor,D=(e,t,a,s)=>{for(var r=s>1?void 0:s?Te(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=(s?o(t,a,r):o(r))||r);return s&&r&&Ae(t,a,r),r};let w=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Recent activity"),this.loadData()}async loadData(){const e=await Z();e.length===0?this.error="[ activity unavailable ]":this.events=e,this.loading=!1}render(){return i`
      <div class="sec-header">
        <span class="sec-label">activity</span>
        <div class="sec-line"></div>
      </div>
      ${this.loading?i`<div class="status-fallback"><span class="loading-text">[ loading... ]</span></div>`:this.error?i`<div class="status-fallback">${this.error}</div>`:this.events.map(e=>i`
            <div class="row" role="listitem">
              <span class="row-name"><span class="tag">[${e.type}]</span> ${e.repo}: ${e.message}</span>
              <span class="row-meta">${X(e.timestamp)}</span>
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
  `;D([p()],w.prototype,"events",2);D([p()],w.prototype,"loading",2);D([p()],w.prototype,"error",2);w=D([A("clanka-activity")],w);var _e=Object.defineProperty,Ie=Object.getOwnPropertyDescriptor,P=(e,t,a,s)=>{for(var r=s>1?void 0:s?Ie(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=(s?o(t,a,r):o(r))||r);return s&&r&&_e(t,a,r),r};const M=["ops","infra","core","quality","policy","template"];let y=class extends E{constructor(){super(...arguments),this.repos=[],this.live=!1,this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Fleet status"),this.hasAttribute("tabindex")||(this.tabIndex=0),this.loadFleet()}async loadFleet(){this.loading=!0,this.error="";try{const e=await ke(),t=this.extractRepos(e);if(!t.length)throw new Error("No fleet repos in payload");this.repos=t,this.live=!0}catch{this.repos=[],this.live=!1,this.error="[ api unreachable ]"}finally{this.loading=!1}}extractRepos(e){const t=this.pickRepoArray(e);return t.length?t.map(a=>this.normalizeRepo(a)).filter(a=>a!==null).sort((a,s)=>{const r=M.indexOf(a.tier)-M.indexOf(s.tier);return r!==0?r:a.repo.localeCompare(s.repo)}):[]}pickRepoArray(e){if(!e||typeof e!="object")return[];const t=e;if(Array.isArray(t.repos))return t.repos;if(Array.isArray(t.fleet))return t.fleet;if(t.summary&&typeof t.summary=="object"){const a=t.summary;if(Array.isArray(a.repos))return a.repos;if(Array.isArray(a.fleet))return a.fleet}return[]}readOnlineState(e){if(typeof e.online=="boolean")return e.online;const t=String(e.status??e.state??"").trim().toLowerCase();return t?["offline","down","error","failed","degraded"].includes(t)?!1:(["online","up","ok","healthy","active"].includes(t),!0):!0}normalizeRepo(e){if(!e||typeof e!="object")return null;const t=e,a=String(t.repo??t.name??t.full_name??"").trim(),s=String(t.tier??"").trim().toLowerCase(),r=String(t.criticality??t.priority??"").trim().toLowerCase(),n=this.readOnlineState(t);return!a||!M.includes(s)?null:["critical","high","medium"].includes(r)?{repo:a,tier:s,criticality:r,online:n}:{repo:a,tier:s,criticality:"medium",online:n}}shortName(e){return e.replace(/^clankamode\//,"")}render(){const e=M.map(t=>({tier:t,repos:this.repos.filter(a=>a.tier===t)})).filter(t=>t.repos.length>0);return i`
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
                            <span class="status-pill ${a.online?"online":"offline"}">
                              ${a.online?"● online":"○ offline"}
                            </span>
                          </div>
                          <div class="tier-badge">${a.tier}</div>
                          <div class="criticality"><span class="dot ${a.criticality}" aria-hidden="true"></span>${a.criticality}</div>
                        </article>
                      `)}
                  </div>
                </div>
              `)}
    `}};y.styles=C`
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
  `;P([p()],y.prototype,"repos",2);P([p()],y.prototype,"live",2);P([p()],y.prototype,"loading",2);P([p()],y.prototype,"error",2);y=P([A("clanka-fleet")],y);var Pe=Object.defineProperty,Me=Object.getOwnPropertyDescriptor,N=(e,t,a,s)=>{for(var r=s>1?void 0:s?Me(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=(s?o(t,a,r):o(r))||r);return s&&r&&Pe(t,a,r),r};let k=class extends E{constructor(){super(...arguments),this.events=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.loadData()}async loadData(){const e=await Z();e.length===0?this.error="[ offline — activity unavailable ]":this.events=e.slice(0,8),this.loading=!1}render(){return i`
      <div class="sec-header">
        <span class="sec-label">terminal</span>
        <div class="sec-line"></div>
      </div>
      <div class="terminal" role="log" aria-label="Terminal output">
        <div class="line prompt">clanka@fleet:~$ git log --oneline --all-repos</div>
        ${this.loading?i`<div class="line dim">[ fetching activity... ]<span class="cursor"></span></div>`:this.error?i`<div class="line dim">${this.error}</div>`:this.events.map(e=>i`
              <div class="line"><span class="tag">[${e.type}]</span> <span class="repo">${e.repo}:</span> <span class="msg">"${e.message}"</span>  <span class="ts">· ${X(e.timestamp)}</span></div>
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
  `;N([p()],k.prototype,"events",2);N([p()],k.prototype,"loading",2);N([p()],k.prototype,"error",2);k=N([A("clanka-terminal")],k);var Se=Object.getOwnPropertyDescriptor,Oe=(e,t,a,s)=>{for(var r=s>1?void 0:s?Se(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=o(r)||r);return r};let B=class extends E{render(){return i`
      <div class="sec-header">
        <span class="sec-label">agents</span>
        <div class="sec-line"></div>
      </div>
      <div class="note">
        // agent orchestration is internal<br>
        // check <a href="https://github.com/clankamode" target="_blank">github.com/clankamode</a> for shipped work
      </div>
    `}};B.styles=C`
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
  `;B=Oe([A("clanka-agents")],B);var De=Object.defineProperty,Ne=Object.getOwnPropertyDescriptor,j=(e,t,a,s)=>{for(var r=s>1?void 0:s?Ne(t,a):t,n=e.length-1,o;n>=0;n--)(o=e[n])&&(r=(s?o(t,a,r):o(r))||r);return s&&r&&De(t,a,r),r};let $=class extends E{constructor(){super(...arguments),this.tasks=[],this.loading=!0,this.error=""}connectedCallback(){super.connectedCallback(),this.setAttribute("role","region"),this.setAttribute("aria-label","Task board"),this.hasAttribute("tabindex")||(this.tabIndex=0)}normalizeStatus(e){const t=(e??"todo").toLowerCase();return["todo","doing","done"].includes(t)?t:"todo"}render(){return i`
      <div class="sec-header">
        <span class="sec-label">tasks_board</span>
        <div class="sec-line"></div>
      </div>

      ${this.loading?i`
            <div class="fallback"><span class="loading">[ loading... ]</span></div>
            <div class="grid">
              ${Array.from({length:3}).map(()=>i`<div class="task-card" aria-hidden="true">
                  <div class="skeleton status"></div>
                  <div class="skeleton title"></div>
                  <div class="skeleton meta"></div>
                </div>`)}
            </div>
          `:this.error?i`<div class="fallback">${this.error}</div>`:this.tasks.length===0?i`<div class="fallback">[ no tasks ]</div>`:i`
                <div class="grid" role="list">
                  ${this.tasks.map(e=>i`
                      <article class="task-card" role="listitem">
                        <div class="task-status status-${this.normalizeStatus(e.status)}">${(e.status??"TODO").toString()}</div>
                        <div class="task-title">${(e.title??"untitled").toString()}</div>
                        <div class="task-meta">
                          <span>@${(e.assignee??"unassigned").toString()}</span>
                          <span>P${(e.priority??"?").toString()}</span>
                        </div>
                      </article>
                    `)}
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
  `;j([F({type:Array})],$.prototype,"tasks",2);j([F({type:Boolean})],$.prototype,"loading",2);j([F({type:String})],$.prototype,"error",2);$=j([A("clanka-tasks")],$);async function je(){const e=document.getElementById("homepage-featured-log"),t=document.getElementById("homepage-log-preview"),a=document.getElementById("homepage-topic-preview"),s=document.getElementById("stat-posts"),r=document.getElementById("stat-audio-posts"),n=document.getElementById("logs-archive-link-count"),{featured:o,recent:u,topics:d,counts:m}=(await J()).homepage;if(e&&o){e.textContent="";const c=document.createElement("a");c.className="featured-log",c.href=o.canonicalPath;const l=document.createElement("span");l.className="featured-kicker",l.textContent=`latest dispatch · ${o.date}`;const g=document.createElement("span");g.className="featured-title",g.textContent=`${String(o.number).padStart(3,"0")}: ${o.title}`;const h=document.createElement("span");h.className="featured-snippet",h.textContent=o.summary;const v=document.createElement("span");v.className="featured-read",v.textContent="READ →",c.append(l,g,h,v),e.append(c)}t&&(t.textContent="",u.filter(c=>c.slug!==o?.slug).slice(0,5).forEach(c=>{t.append(Q(c))})),a&&(a.textContent="",d.forEach(c=>{a.append(ee(c))})),s&&(s.textContent=`${String(m.posts).padStart(3,"0")} posts`),r&&(r.textContent=`${String(m.audioPosts).padStart(3,"0")} with audio`),n&&(n.textContent=`browse all ${m.posts} dispatches`)}const S=document.getElementById("presence"),_=document.getElementById("activity"),x=document.getElementById("terminal"),V=document.getElementById("agents"),I=document.getElementById("tasks"),Y=(e,t)=>{const a=document.getElementById(e);a&&(a.textContent=t)},ze=new Set(["active","online","busy","running","healthy","up"]),Le=e=>{if(!e||typeof e!="object")return null;const t=Object.values(e).filter(r=>r!==null&&typeof r=="object");if(!t.length)return null;let a=0,s=0;return t.forEach(r=>{const n=String(r.status??r.state??r.presence??"").trim().toLowerCase();n&&(s+=1,ze.has(n)&&(a+=1))}),s>0?a:t.length},Be=e=>typeof e.agents_active=="number"&&Number.isFinite(e.agents_active)&&e.agents_active>=0?Math.floor(e.agents_active):Le(e.team),O=({loading:e,error:t})=>{_&&(_.loading=e,_.error=t||""),x&&(x.loading=e,x.error=t||""),I&&(I.loading=e,I.error=t||"")};O({loading:!0,error:""});S&&(S.addEventListener("sync-state",e=>{const a=e.detail||{loading:!1,error:"[ api unreachable ]"};O(a)}),S.addEventListener("sync-updated",e=>{const a=e.detail||{};_&&(_.history=a.history||[]),x&&(x.team=a.team||{},x.recentActivity=a.history||[]),V&&(V.team=a.team||{}),I&&(I.tasks=a.tasks||[]);const s=Be(a);s!==null&&Y("stat-active-agents",`agents: ${s} active`),O({loading:!1,error:""})}),S.addEventListener("sync-error",e=>{const a=e.detail?.error||"[ api unreachable ]";Y("stat-active-agents","agents: offline"),O({loading:!1,error:a})}));(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const e=document.querySelector(".hero-statement"),t=document.querySelector(".cursor");if(!e)return;const a="I build systems<br><em>that outlast me.</em>",[,s="",r=""]=a.match(/^(.*?)<br><em>(.*?)<\/em>$/)||[],n="<br><em>",o="</em>",u=40,d=l=>l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");if(!s||!r)return;e.innerHTML="";const m=(l=0)=>{if(l>s.length){window.setTimeout(()=>c(0),200);return}e.innerHTML=d(s.slice(0,l)),window.setTimeout(()=>m(l+1),u)},c=(l=0)=>{if(l>r.length){e.innerHTML=d(s)+n+d(r)+o,t&&window.setTimeout(()=>{t.style.opacity="0",t.style.pointerEvents="none"},2e3);return}e.innerHTML=d(s)+n+d(r.slice(0,l)),window.setTimeout(()=>c(l+1),u)};m(0)})();te();je();ie();de();ve();
